import React, { useMemo } from 'react';
import { Box, Divider } from '@mui/material';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import StatePage from '../components/StatePage';
import StateTable from '../components/StateTable';
import TrendChart, { CONTEXT_COLOR, ENTITY_COLORS, SERIES_COLORS } from '../components/TrendChart';
import KeyFigures, { KeyFigure } from '../components/KeyFigures';
import { useStateLoads } from '../hooks/useStateLoads';
import { useStateEnrollmentData, useStateStaffData } from '../hooks/useStatewideData';
import {
  adjustSeriesForInflation,
  changeSince,
  describeChange,
  formatCompact,
  formatCompactDollars,
  formatCount,
  formatDollars,
  formatPercent,
  formatSchoolYear,
  formatSignedPercent,
  latestPoint,
  mergeSeries,
  percentChangeSeries,
  pivotByYear,
  sortByYear,
  studentsPerTeacher,
  toSeries,
} from '../utils/stateMetrics';
import { plainLabel, STAFF_LABELS } from '../utils/labels';
import { changeText, realChangeText, realPercentChange } from '../utils/phrases';

const PAGE = PAGE_REGISTRY.state.staff;
const TREND_YEARS = 10;
// Degree counts cover full- and part-time teachers, so they can run a little above teacher FTEs
const MAX_DEGREE_COUNT_RATIO = 1.25;
// A class-size drop this large over two years gets a note, since the state's data doesn't explain it
const CLASS_SIZE_DROP = 0.15;

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
      nominal,
      rows: mergeSeries({ salary: nominal, adjusted: latestYear ? adjustSeriesForInflation(nominal, latestYear) : [] }),
    };
  }, [staffData.salary]);

  const staffByType = useMemo(() => pivotByYear(staffData.staff, row => row.staff_type.name, row => row.value), [staffData.staff]);
  const teachers = useMemo(() => toSeries(staffByType, row => row.Teacher), [staffByType]);
  const otherStaff = useMemo(
    () => toSeries(staffByType, row => Object.entries(row).reduce((sum, [key, value]) => (key === 'year' || key === 'Teacher' ? sum : sum + (value ?? 0)), 0)),
    [staffByType]
  );
  const students = useMemo(() => toSeries(enrollment.adm, row => row.total), [enrollment.adm]);
  const ratio = useMemo(() => studentsPerTeacher(students, teachers), [students, teachers]);

  // Students and staff as percent change over the last ten years both cover
  const studentsVsStaff = useMemo(() => {
    const latest = Math.min(latestPoint(students)?.year ?? 0, latestPoint(teachers)?.year ?? 0);
    if (!latest) return { rows: [], baseYear: null as number | null, endYear: null as number | null };
    const baseYear = Math.max(latest - TREND_YEARS, students[0]?.year ?? 0, teachers[0]?.year ?? 0);
    return {
      baseYear,
      endYear: latest,
      rows: mergeSeries({
        students: percentChangeSeries(students, baseYear),
        teachers: percentChangeSeries(teachers, baseYear),
        other: percentChangeSeries(otherStaff, baseYear),
      }).filter(row => row.year <= latest),
    };
  }, [students, teachers, otherStaff]);

  // Latest year by staff type, with the change over the last ten years
  const staffTable = useMemo(() => {
    const latest = staffByType[staffByType.length - 1];
    if (!latest) return { year: null as number | null, since: null as number | null, rows: [] };
    const types = Object.keys(latest).filter(key => key !== 'year');
    const rows = types
      .map(type => {
        const change = changeSince(toSeries(staffByType, row => row[type]), TREND_YEARS);
        return { type: plainLabel(STAFF_LABELS, type), count: latest[type] ?? 0, change: change?.percentChange ?? null, since: change?.from.year ?? null };
      })
      .sort((a, b) => b.count - a.count);
    return { year: latest.year, since: rows.find(row => row.since !== null)?.since ?? null, rows };
  }, [staffByType]);
  const staffTotal = staffTable.rows.reduce((sum, row) => sum + row.count, 0);

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
  const classSizeNote = useMemo(() => {
    const notes = CLASS_SIZES.flatMap(size => {
      const series = toSeries(classSize, row => row[size.key as keyof typeof row]);
      const latest = latestPoint(series);
      const earlier = latest ? series.find(point => point.year === latest.year - 2) : undefined;
      return latest && earlier && latest.value < earlier.value * (1 - CLASS_SIZE_DROP)
        ? [`${size.name} average class size fell from ${earlier.value.toFixed(1)} in ${formatSchoolYear(earlier.year)} to ${latest.value.toFixed(1)} in ${formatSchoolYear(latest.year)}; the state's data doesn't say why.`]
        : [];
    });
    return notes.join(' ');
  }, [classSize]);

  const keyFigures = useMemo(() => {
    const latestTeachers = latestPoint(teachers);
    const latestSalary = latestPoint(salary.nominal);
    const latestRatio = latestPoint(ratio);
    const salaryChange = changeSince(salary.nominal, TREND_YEARS);
    const figures: KeyFigure[] = [];
    const takeaway: string[] = [];
    if (latestSalary) {
      figures.push({
        label: 'Average teacher salary',
        value: formatDollars(latestSalary.value),
        period: formatSchoolYear(latestSalary.year),
        change: changeText(salaryChange),
        detail: realChangeText(salaryChange),
      });
      if (salaryChange) {
        takeaway.push(`The average teacher earned ${formatDollars(latestSalary.value)} in ${formatSchoolYear(latestSalary.year)}, ${describeChange(salaryChange.percentChange)} from ${formatSchoolYear(salaryChange.from.year)}`
          + `, which is ${describeChange(realPercentChange(salaryChange))} once inflation is taken into account.`);
      }
    }
    if (latestTeachers) {
      figures.push({
        label: 'Teachers',
        value: formatCount(latestTeachers.value),
        period: formatSchoolYear(latestTeachers.year),
        change: changeText(changeSince(teachers, TREND_YEARS)),
        detail: 'Full-time equivalent: part-time teachers count as fractions',
      });
    }
    if (latestRatio) {
      figures.push({
        label: 'Students per teacher',
        value: latestRatio.value.toFixed(1),
        period: formatSchoolYear(latestRatio.year),
        detail: 'Not the same as class size',
      });
    }
    const latestClass = classSize[classSize.length - 1];
    if (latestClass && typeof latestClass.grades_1_2 === 'number') {
      figures.push({
        label: 'Average class size, grades 1-2',
        value: latestClass.grades_1_2.toFixed(1),
        period: formatSchoolYear(latestClass.year),
        detail: [
          typeof latestClass.grades_3_4 === 'number' ? `Grades 3-4: ${latestClass.grades_3_4.toFixed(1)}` : null,
          typeof latestClass.grades_5_8 === 'number' ? `grades 5-8: ${latestClass.grades_5_8.toFixed(1)}` : null,
        ].filter(Boolean).join('; ') || undefined,
      });
    }
    return { figures, takeaway };
  }, [teachers, salary.nominal, ratio, classSize]);

  const salaryDollars = salary.latestYear ? `${formatSchoolYear(salary.latestYear)} dollars` : 'today\'s dollars';

  return (
    <StatePage
      displayName={PAGE.displayName}
      status={status}
      onRetry={retry}
      errorMessage="Statewide staff data could not be loaded."
      intro="Who works in New Hampshire's public schools, what teachers are paid, and how many students there are for each teacher."
      keyFigures={<KeyFigures takeaway={keyFigures.takeaway} figures={keyFigures.figures} />}
      districtSection="staff"
      notCovered="Teacher turnover, vacancies, years of experience and starting pay, and separate counts of administrators, counselors, school psychologists and social workers aren't on the site yet. The staff types are the categories in the state's staffing report, which doesn't define them."
      source="NH Department of Education, staffing, teacher salary, educator degree and class size reports"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <TrendChart
          title="Average teacher salary"
          subtitle={`Actual pay each year, and the same pay in ${salaryDollars}`}
          data={salary.rows}
          series={[
            { key: 'salary', name: 'Actual pay', color: SERIES_COLORS[0] },
            { key: 'adjusted', name: `In ${salaryDollars}`, color: ENTITY_COLORS.adjusted },
          ]}
          format={formatDollars}
          axisFormat={formatCompactDollars}
          note={`The "in ${salaryDollars}" line is higher in earlier years because a dollar then bought more. If it slopes down, pay didn't keep up with prices.`}
          csvName="nh-average-teacher-salary"
          csvUnit="dollars"
        />

        <Divider />

        <TrendChart
          title={studentsVsStaff.baseYear ? `Students and staff since ${formatSchoolYear(studentsVsStaff.baseYear)}` : 'Students and staff'}
          subtitle={studentsVsStaff.baseYear ? `Percent change from ${formatSchoolYear(studentsVsStaff.baseYear)}` : undefined}
          data={studentsVsStaff.rows}
          series={[
            { key: 'students', name: 'Students', color: CONTEXT_COLOR },
            { key: 'teachers', name: 'Teachers', color: ENTITY_COLORS.teachers },
            { key: 'other', name: 'All other staff', shortName: 'Other staff', color: ENTITY_COLORS.otherStaff },
          ]}
          format={value => formatSignedPercent(value)}
          axis="span"
          note={`Shows whether staffing changed with the number of students. Students are average daily membership; staff are full-time equivalents.${
            studentsVsStaff.endYear && studentsVsStaff.endYear !== latestPoint(teachers)?.year
              ? ` The chart ends in ${formatSchoolYear(studentsVsStaff.endYear)}, the latest year with both counts, so its changes differ a little from the figures above.`
              : ''}`}
          csvName="nh-students-vs-staff"
          csvUnit={studentsVsStaff.baseYear ? `% change from ${formatSchoolYear(studentsVsStaff.baseYear)}` : '% change'}
        />

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, '& > *': { flex: 1, minWidth: 0 } }}>
          <TrendChart
            title="Teachers and other staff"
            subtitle="Full-time equivalents"
            data={mergeSeries({ teachers, other: otherStaff })}
            series={[
              { key: 'teachers', name: 'Teachers', color: ENTITY_COLORS.teachers },
              { key: 'other', name: 'All other staff', shortName: 'Other staff', color: ENTITY_COLORS.otherStaff },
            ]}
            format={formatCount}
            axisFormat={value => formatCompact(value)}
            csvName="nh-staff"
            csvUnit="full-time equivalents"
          />
          <StateTable
            title={staffTable.year ? `Staff by type, ${formatSchoolYear(staffTable.year)}` : 'Staff by type'}
            subtitle="Full-time equivalents"
            columns={[
              { key: 'type', label: 'Staff type' },
              { key: 'count', label: 'Staff', align: 'right', format: row => formatCount(row.count) },
              {
                key: 'change',
                label: staffTable.since ? `Change since ${formatSchoolYear(staffTable.since)}` : 'Change',
                align: 'right',
                format: row => formatSignedPercent(row.change),
              },
            ]}
            rows={staffTable.rows}
            totalRow={staffTable.rows.length ? { type: 'All staff', count: staffTotal, change: null, since: null } : undefined}
            csvName={`nh-staff-by-type-${staffTable.year ?? ''}`}
          />
        </Box>

        <Divider />

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, '& > *': { flex: 1, minWidth: 0 } }}>
          <TrendChart
            title="Students per teacher"
            subtitle="Students divided by full-time-equivalent teachers"
            data={ratio.map(point => ({ year: point.year, ratio: point.value }))}
            series={[{ key: 'ratio', name: 'Students per teacher' }]}
            format={value => value.toFixed(1)}
            axisFormat={value => formatCompact(value)}
            note="Not the same as class size: teachers include specialists and others who don't lead a regular class."
            csvName="nh-students-per-teacher"
          />
          <TrendChart
            title="Average class size"
            subtitle="Students per class"
            data={classSize}
            series={CLASS_SIZES}
            format={value => value.toFixed(1)}
            axisFormat={value => formatCompact(value)}
            note={classSizeNote || undefined}
            csvName="nh-class-size"
            csvUnit="students per class"
          />
        </Box>

        <Divider />

        <TrendChart
          title="Teachers' highest degree"
          subtitle="Percentage of teachers"
          data={degreeShares.rows}
          series={DEGREES}
          note={degreeShares.skipped.length
            ? `${degreeShares.skipped.map(formatSchoolYear).join(', ')} left out: that year's degree counts add up to far more teachers than the state's staffing report.`
            : undefined}
          format={value => formatPercent(value, 1)}
          axisFormat={value => formatPercent(value)}
          yDomain={[0, 100]}
          csvName="nh-teacher-degrees"
          csvUnit="% of teachers"
        />
      </Box>
    </StatePage>
  );
};

export default StateStaff;
