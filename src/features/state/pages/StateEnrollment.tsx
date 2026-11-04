import React, { useMemo } from 'react';
import { Box, Divider } from '@mui/material';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import StatePage from '../components/StatePage';
import StateTable from '../components/StateTable';
import TrendChart, { ENTITY_COLORS } from '../components/TrendChart';
import KeyFigures, { KeyFigure } from '../components/KeyFigures';
import { useStateLoads } from '../hooks/useStateLoads';
import { useStateEnrollmentData } from '../hooks/useStatewideData';
import {
  changeSince,
  describeChange,
  formatCompact,
  formatCount,
  formatSchoolYear,
  formatSignedPercent,
  latestPoint,
  mergeSeries,
  REMOTE_SCHOOL_YEAR,
  toSeries,
} from '../utils/stateMetrics';
import { capitalize, changeText } from '../utils/phrases';

const PAGE = PAGE_REGISTRY.state.enrollment;
const TREND_YEARS = 10;
const GRADE_CHANGE_YEARS = 5;
const REMOTE_BAND = [{ from: REMOTE_SCHOOL_YEAR - 1, to: REMOTE_SCHOOL_YEAR, label: 'COVID' }];

const LEVELS = [
  { key: 'elementary', name: 'Elementary', color: ENTITY_COLORS.elementary },
  { key: 'middle', name: 'Middle', color: ENTITY_COLORS.middle },
  { key: 'high', name: 'High', color: ENTITY_COLORS.high },
] as const;

/**
 * The year to compare grades against: five years back, or the year before that when five years
 * back is 2020-21, when enrollment (kindergarten especially) dipped during the pandemic.
 */
const compareYearFor = (latestYear: number) => {
  const year = latestYear - GRADE_CHANGE_YEARS;
  return year === REMOTE_SCHOOL_YEAR ? year - 1 : year;
};

const StateEnrollment: React.FC = () => {
  const { loads, adm, byGrade } = useStateEnrollmentData();
  const { status, retry } = useStateLoads(loads);

  const students = useMemo(() => toSeries(adm, row => row.total), [adm]);
  const total = useMemo(() => students.map(point => ({ year: point.year, total: point.value })), [students]);
  const byLevel = useMemo(() => mergeSeries(Object.fromEntries(LEVELS.map(level => [level.key, toSeries(adm, row => row[level.key])]))), [adm]);

  // Students entering (kindergarten) and leaving (grade 12) each year
  const entering = useMemo(() => {
    const gradeSeries = (name: string) => toSeries(byGrade.filter(row => row.grade?.name === name), row => row.total_enrollment);
    return mergeSeries({ kindergarten: gradeSeries('Kindergarten'), grade12: gradeSeries('Grade 12') });
  }, [byGrade]);

  const gradeTable = useMemo(() => {
    if (!byGrade.length) return { year: null as number | null, compareYear: null as number | null, rows: [] };
    const year = Math.max(...byGrade.map(row => row.year));
    const compareYear = compareYearFor(year);
    const count = (gradeId: number, forYear: number) =>
      byGrade.find(row => row.grade_id === gradeId && row.year === forYear)?.total_enrollment ?? null;
    const rows = byGrade
      .filter(row => row.year === year)
      .sort((a, b) => a.grade_id - b.grade_id)
      .map(row => {
        const earlier = count(row.grade_id, compareYear);
        return {
          grade: row.grade?.name ?? String(row.grade_id),
          students: row.total_enrollment,
          earlier,
          change: earlier ? ((row.total_enrollment - earlier) / earlier) * 100 : null,
        };
      });
    return { year, compareYear, rows };
  }, [byGrade]);
  const gradeTotals = useMemo(() => {
    const studentsTotal = gradeTable.rows.reduce((sum, row) => sum + row.students, 0);
    const earlierRows = gradeTable.rows.filter(row => row.earlier !== null);
    const earlierTotal = earlierRows.length === gradeTable.rows.length ? earlierRows.reduce((sum, row) => sum + (row.earlier ?? 0), 0) : null;
    return {
      grade: 'All grades',
      students: studentsTotal,
      earlier: earlierTotal,
      change: earlierTotal ? ((studentsTotal - earlierTotal) / earlierTotal) * 100 : null,
    };
  }, [gradeTable.rows]);

  const keyFigures = useMemo(() => {
    const latestStudents = latestPoint(students);
    const studentChange = changeSince(students, TREND_YEARS);
    const kindergarten = gradeTable.rows.find(row => row.grade === 'Kindergarten');
    const grade12 = gradeTable.rows.find(row => row.grade === 'Grade 12');
    const figures: KeyFigure[] = [];
    const takeaway: string[] = [];
    if (latestStudents) {
      figures.push({
        label: 'Students',
        value: formatCount(latestStudents.value),
        period: formatSchoolYear(latestStudents.year),
        change: changeText(studentChange),
        detail: 'Average enrolled over the year',
      });
      if (studentChange) {
        takeaway.push(`${formatCount(latestStudents.value)} students attended public schools in ${formatSchoolYear(latestStudents.year)}, ${describeChange(studentChange.percentChange)} from ${formatSchoolYear(studentChange.from.year)}.`);
      }
    }
    if (kindergarten && gradeTable.year && gradeTable.compareYear) {
      figures.push({
        label: 'Kindergarten',
        value: formatCount(kindergarten.students),
        period: formatSchoolYear(gradeTable.year),
        change: kindergarten.change === null ? undefined : `${capitalize(describeChange(kindergarten.change))} since ${formatSchoolYear(gradeTable.compareYear)}`,
        detail: 'October 1 enrollment',
      });
    }
    if (grade12 && gradeTable.year) {
      figures.push({ label: 'Grade 12', value: formatCount(grade12.students), period: formatSchoolYear(gradeTable.year), detail: 'October 1 enrollment' });
      if (kindergarten) {
        takeaway.push(`This year's kindergarten class (${formatCount(kindergarten.students)}) is ${kindergarten.students < grade12.students ? 'smaller' : 'larger'} than the graduating class (${formatCount(grade12.students)}).`);
      }
    }
    return { figures, takeaway };
  }, [students, gradeTable]);

  const compareText = gradeTable.compareYear ? formatSchoolYear(gradeTable.compareYear) : 'earlier';

  return (
    <StatePage
      displayName={PAGE.displayName}
      status={status}
      onRetry={retry}
      errorMessage="Statewide enrollment data could not be loaded."
      intro="How many students New Hampshire's public schools serve, and how that is changing grade by grade."
      keyFigures={<KeyFigures takeaway={keyFigures.takeaway} figures={keyFigures.figures} />}
      districtSection="enrollment"
      notCovered="Public pre-K and preschool special education, full-day versus half-day kindergarten, enrollment by race or ethnicity, and enrollment projections aren't on the site yet."
      source="NH Department of Education, average daily membership and town enrollment by grade reports"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, '& > *': { flex: 1, minWidth: 0 } }}>
          <TrendChart
            title="Public school students"
            subtitle="Average daily membership"
            data={total}
            series={[{ key: 'total', name: 'Students' }]}
            format={formatCount}
            axisFormat={value => formatCompact(value)}
            note="Average daily membership is the average number of students enrolled over the school year; cost per student is based on it."
            csvName="nh-students"
            csvUnit="average daily membership"
          />
          <TrendChart
            title="Students by school level"
            subtitle="Average daily membership"
            data={byLevel}
            series={[...LEVELS]}
            format={formatCount}
            axisFormat={value => formatCompact(value)}
            csvName="nh-students-by-level"
            csvUnit="average daily membership"
          />
        </Box>

        <Divider />

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, '& > *': { flex: 1, minWidth: 0 } }}>
          <TrendChart
            title="Students starting and finishing school"
            subtitle="October 1 enrollment in kindergarten and grade 12"
            data={entering}
            series={[{ key: 'kindergarten', name: 'Kindergarten' }, { key: 'grade12', name: 'Grade 12' }]}
            format={formatCount}
            axisFormat={value => formatCompact(value)}
            bands={REMOTE_BAND}
            note="When the kindergarten class is smaller than the graduating class, total enrollment falls as those classes move through school. Kindergarten dipped in 2020-21, when many schools were remote or hybrid."
            csvName="nh-kindergarten-grade-12"
            csvUnit="students"
          />
          <StateTable
            title={gradeTable.year ? `Enrollment by grade, ${formatSchoolYear(gradeTable.year)}` : 'Enrollment by grade'}
            subtitle="October 1 enrollment of students living in New Hampshire towns"
            columns={[
              { key: 'grade', label: 'Grade' },
              { key: 'students', label: 'Students', align: 'right', format: row => formatCount(row.students) },
              { key: 'earlier', label: `In ${compareText}`, align: 'right', format: row => formatCount(row.earlier), hideOnPhone: true },
              { key: 'change', label: `Change since ${compareText}`, align: 'right', format: row => formatSignedPercent(row.change) },
            ]}
            rows={gradeTable.rows}
            totalRow={gradeTable.rows.length ? gradeTotals : undefined}
            note={`${gradeTable.year && gradeTable.year - GRADE_CHANGE_YEARS === REMOTE_SCHOOL_YEAR ? `Compared with ${compareText}, before the pandemic, because 2020-21 enrollment was unusually low. ` : ''}`
              + 'This count (October 1, students living in New Hampshire towns) differs from average daily membership, which averages enrollment across the year and is the figure used elsewhere on these pages.'}
            csvName={`nh-enrollment-by-grade-${gradeTable.year ?? ''}`}
          />
        </Box>
      </Box>
    </StatePage>
  );
};

export default StateEnrollment;
