import React, { useMemo } from 'react';
import { Box, Divider } from '@mui/material';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import StatePage from '../components/StatePage';
import StateTable from '../components/StateTable';
import TrendChart from '../components/TrendChart';
import { useStateLoads } from '../hooks/useStateLoads';
import { useStateEnrollmentData, useStateStaffData } from '../hooks/useStatewideData';
import {
  adjustSeriesForInflation,
  changeSince,
  formatCount,
  formatDollars,
  formatPercent,
  formatSchoolYear,
  latestPoint,
  mergeSeries,
  pivotByYear,
  sortByYear,
  studentsPerTeacher,
  toSeries,
} from '../utils/stateMetrics';

const PAGE = PAGE_REGISTRY.state.staff;
const TREND_YEARS = 10;
// Degree counts cover full- and part-time teachers, so they can run a little above teacher FTEs
const MAX_DEGREE_COUNT_RATIO = 1.25;

const DEGREES = [
  { key: 'Bachelor', name: "Bachelor's" },
  { key: 'Masters', name: "Master's" },
  { key: 'Beyond Masters', name: "Beyond master's" },
];

const CLASS_SIZES = [
  { key: 'grades_1_2', name: 'Grades 1-2' },
  { key: 'grades_3_4', name: 'Grades 3-4' },
  { key: 'grades_5_8', name: 'Grades 5-8' },
];

const StateStaff: React.FC = () => {
  const staffData = useStateStaffData();
  const enrollment = useStateEnrollmentData();
  const { status, retry } = useStateLoads([...staffData.loads, ...staffData.detailLoads, ...enrollment.loads]);

  const salary = useMemo(() => {
    const nominal = toSeries(staffData.salary, row => row.salary);
    const latestYear = latestPoint(nominal)?.year;
    return {
      latestYear,
      rows: mergeSeries({ salary: nominal, adjusted: latestYear ? adjustSeriesForInflation(nominal, latestYear) : [] }),
    };
  }, [staffData.salary]);

  const staffByType = useMemo(() => pivotByYear(staffData.staff, row => row.staff_type.name, row => row.value), [staffData.staff]);
  const teachers = useMemo(() => toSeries(staffByType, row => row.Teacher), [staffByType]);
  const otherStaff = useMemo(
    () => toSeries(staffByType, row => Object.entries(row).reduce((sum, [key, value]) => (key === 'year' || key === 'Teacher' ? sum : sum + (value ?? 0)), 0)),
    [staffByType]
  );
  const ratio = useMemo(() => studentsPerTeacher(toSeries(enrollment.adm, row => row.total), teachers), [enrollment.adm, teachers]);

  // Latest year by staff type, with the change over the last ten years
  const staffTable = useMemo(() => {
    const latest = staffByType[staffByType.length - 1];
    if (!latest) return { year: null as number | null, rows: [] };
    const types = Object.keys(latest).filter(key => key !== 'year');
    return {
      year: latest.year,
      rows: types
        .map(type => {
          const change = changeSince(toSeries(staffByType, row => row[type]), TREND_YEARS);
          return { type, count: latest[type] ?? 0, change: change?.percentChange ?? null, since: change?.from.year ?? null };
        })
        .sort((a, b) => b.count - a.count),
    };
  }, [staffByType]);

  // Years whose degree counts add up to far more teachers than the staffing report (2011-12 in
  // the current data) are left out rather than charted as a jump
  const degreeShares = useMemo(() => {
    const counts = pivotByYear(staffData.education, row => row.teacher_type.name, row => row.value);
    const teacherCount = new Map(teachers.map(point => [point.year, point.value]));
    const plausible = counts.filter(({ year, ...byDegree }) => {
      const total = Object.values(byDegree).reduce<number>((sum, value) => sum + (value ?? 0), 0);
      const reported = teacherCount.get(year);
      return reported === undefined || total <= reported * MAX_DEGREE_COUNT_RATIO;
    });
    const skipped = counts.filter(row => !plausible.includes(row)).map(row => row.year);
    const rows = plausible.map(({ year, ...byDegree }) => {
      const total = Object.values(byDegree).reduce<number>((sum, value) => sum + (value ?? 0), 0);
      const row: Record<string, number | null> & { year: number } = { year };
      DEGREES.forEach(degree => { row[degree.key] = total ? ((byDegree[degree.key] ?? 0) / total) * 100 : null; });
      return row;
    });
    return { rows, skipped };
  }, [staffData.education, teachers]);

  const classSize = useMemo(() => sortByYear(staffData.classSize).map(row => ({
    year: row.year,
    grades_1_2: row.grades_1_2,
    grades_3_4: row.grades_3_4,
    grades_5_8: row.grades_5_8,
  })), [staffData.classSize]);

  return (
    <StatePage
      displayName={PAGE.displayName}
      status={status}
      onRetry={retry}
      errorMessage="Statewide staff data could not be loaded."
      intro="Who works in New Hampshire's public schools, what teachers are paid, and how many students there are for each teacher."
      source="NH Department of Education, staffing, teacher salary, educator degree and class size reports"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <TrendChart
          title="Average Teacher Salary"
          subtitle={salary.latestYear ? `(Actual pay, and pay in ${formatSchoolYear(salary.latestYear)} dollars)` : undefined}
          data={salary.rows}
          series={[{ key: 'salary', name: 'Actual' }, { key: 'adjusted', name: 'After inflation' }]}
          format={formatDollars}
          axisFormat={value => `$${Math.round(value / 1000)}K`}
          note="The after-inflation line restates each year's average in today's dollars, so a flat line means pay kept pace with prices."
          csvName="nh-average-teacher-salary"
        />

        <Divider />

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, '& > *': { flex: 1, minWidth: 0 } }}>
          <TrendChart
            title="Teachers and Other Staff"
            subtitle="(Full-time equivalents)"
            data={mergeSeries({ teachers, other: otherStaff })}
            series={[{ key: 'teachers', name: 'Teachers' }, { key: 'other', name: 'All other staff' }]}
            format={formatCount}
            axisFormat={value => `${Math.round(value / 1000)}K`}
            csvName="nh-staff"
          />
          <StateTable
            title={staffTable.year ? `Staff by Type, ${formatSchoolYear(staffTable.year)}` : 'Staff by Type'}
            subtitle="(Full-time equivalents)"
            columns={[
              { key: 'type', label: 'Staff type' },
              { key: 'count', label: 'Staff', align: 'right', format: row => formatCount(row.count) },
              {
                key: 'change',
                label: 'Change over 10 years',
                align: 'right',
                format: row => (row.change === null ? '—' : `${row.change > 0 ? '+' : ''}${row.change.toFixed(0)}%`),
              },
            ]}
            rows={staffTable.rows}
            csvName={`nh-staff-by-type-${staffTable.year ?? ''}`}
          />
        </Box>

        <Divider />

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, '& > *': { flex: 1, minWidth: 0 } }}>
          <TrendChart
            title="Students per Teacher"
            subtitle="(Average daily membership divided by teacher full-time equivalents)"
            data={ratio.map(point => ({ year: point.year, ratio: point.value }))}
            series={[{ key: 'ratio', name: 'Students per teacher' }]}
            format={value => value.toFixed(1)}
            yDomain={[0, 'auto']}
            note="Not the same as class size: teachers include specialists and others who don't lead a regular class."
            csvName="nh-students-per-teacher"
          />
          <TrendChart
            title="Average Class Size"
            data={classSize}
            series={CLASS_SIZES}
            format={value => value.toFixed(1)}
            yDomain={[0, 'auto']}
            csvName="nh-class-size"
          />
        </Box>

        <Divider />

        <TrendChart
          title="Teachers' Highest Degree"
          subtitle="(Percentage of teachers)"
          data={degreeShares.rows}
          series={DEGREES}
          note={degreeShares.skipped.length
            ? `${degreeShares.skipped.map(formatSchoolYear).join(', ')} left out: that year's degree counts add up to far more teachers than the state's staffing report.`
            : undefined}
          format={value => formatPercent(value, 1)}
          axisFormat={value => formatPercent(value)}
          yDomain={[0, 100]}
          csvName="nh-teacher-degrees"
        />
      </Box>
    </StatePage>
  );
};

export default StateStaff;
