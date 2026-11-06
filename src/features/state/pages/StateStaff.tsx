import React, { useMemo, useState } from 'react';
import { Box, Divider, FormControl, MenuItem, Select, ToggleButton, Tooltip } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import StatePage from '../components/StatePage';
import { keepYearsTogether } from '../components/chartText';
import { COUNT, DOLLARS, downloadWorkbook, ExcelSheet, PERCENT } from '../utils/excel';
import StateTable, { StateTableColumn } from '../components/StateTable';
import TrendChart, { CONTEXT_COLOR, ENTITY_COLORS } from '../components/TrendChart';
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
  YearRow,
} from '../utils/stateMetrics';
import {
  STAFF_TYPE_MOBILE_NAMES,
  STAFF_TYPE_ORDER,
  STAFF_TYPE_TOOLTIPS,
  STAFF_TYPES_WITH_TOOLTIP,
} from '@/features/district/utils/staffDataProcessing';
import { formatThousands, realPercentChange, shortYear, tileDelta } from '../utils/phrases';

const PAGE = PAGE_REGISTRY.state.staff;
const TREND_YEARS = 10;
// The year the staff and teacher education tables compare with until the reader picks another, as on
// the other State pages
const SINCE_YEAR = 2015;
// Degree counts cover full- and part-time teachers, so they can run a little above teacher FTEs
const MAX_DEGREE_COUNT_RATIO = 1.25;
// A class-size drop this large over two years gets a note, since the state's data doesn't explain it
const CLASS_SIZE_DROP = 0.15;

const DEGREES = [
  { key: 'Bachelor', name: "Bachelor's" },
  { key: 'Masters', name: "Master's" },
  { key: 'Beyond Masters', name: "Beyond Master's" },
  { key: 'None', name: 'None' },
];

interface ComparisonRow {
  type: string;
  count: number;
  before: number | null;
  change: number | null;
}

/**
 * The latest year by type next to an earlier year, with the percent change, like the district Staff
 * page's tables. Types come in `order` when given (names as in the data), otherwise largest first.
 */
const compareByType = (
  byYear: YearRow[],
  compareYear: number | null,
  label: (type: string) => string,
  totalLabel: string,
  order?: string[]
) => {
  const latest = byYear[byYear.length - 1];
  if (!latest) return { year: null as number | null, rows: [] as ComparisonRow[], total: undefined };
  const earlier = byYear.find(row => row.year === compareYear);
  const percentChange = (now: number, then: number | null) => (then ? ((now - then) / then) * 100 : null);
  const types = order ?? Object.keys(latest).filter(key => key !== 'year');
  const rows = types
    .map(type => {
      const count = latest[type] ?? 0;
      const before = earlier ? earlier[type] ?? null : null;
      return { type: label(type), count, before, change: percentChange(count, before) };
    })
    .sort((a, b) => (order ? 0 : b.count - a.count));
  const count = rows.reduce((sum, row) => sum + row.count, 0);
  const before = earlier ? rows.reduce((sum, row) => sum + (row.before ?? 0), 0) : null;
  return { year: latest.year, rows, total: rows.length ? { type: totalLabel, count, before, change: percentChange(count, before) } : undefined };
};

/** Every year before the latest, newest first, and the one to compare with: the reader's pick, or 2014-15. */
const useCompareYear = (byYear: YearRow[]) => {
  const years = useMemo(() => byYear.slice(0, -1).map(row => row.year).reverse(), [byYear]);
  const [picked, setPicked] = useState<number | null>(null);
  const year = picked ?? (years.includes(SINCE_YEAR) ? SINCE_YEAR : years[years.length - 1] ?? null);
  return { years, year, setYear: setPicked };
};

/** The district Staff page's year picker: "Compare 14/15" */
const CompareYearPicker: React.FC<{ years: number[]; year: number; onChange: (year: number) => void; label: string }> = ({ years, year, onChange, label }) => (
  <FormControl size="small" sx={{ minWidth: 150 }}>
    <Select value={year} onChange={event => onChange(Number(event.target.value))} inputProps={{ 'aria-label': label }}>
      {years.map(option => (
        <MenuItem key={option} value={option}>Compare {shortYear(option)}</MenuItem>
      ))}
    </Select>
  </FormControl>
);

type StaffTypeName = keyof typeof STAFF_TYPE_TOOLTIPS;

// Staff types as groups of people, for the share chart's title and picker; the support types already are
const STAFF_TYPE_PLURALS: Record<string, string> = { Teacher: 'Teachers', Specialist: 'Specialists', Librarian: 'Librarians' };
const staffTypePlural = (type: string) => STAFF_TYPE_PLURALS[type] ?? type;

/** A staff type as the district Staff page shows it: its short name on phones, and a ? explaining the vaguer types */
const StaffTypeCell: React.FC<{ name: string }> = ({ name }) => {
  const shortName = STAFF_TYPE_MOBILE_NAMES[name as StaffTypeName] ?? name;
  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
      <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{name}</Box>
      <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>{shortName}</Box>
      {(STAFF_TYPES_WITH_TOOLTIP as readonly string[]).includes(name) && (
        <Tooltip title={STAFF_TYPE_TOOLTIPS[name as StaffTypeName]} arrow placement="right">
          <HelpOutlineIcon fontSize="small" aria-label={STAFF_TYPE_TOOLTIPS[name as StaffTypeName]} sx={{ width: 16, height: 16, color: 'text.secondary' }} />
        </Tooltip>
      )}
    </Box>
  );
};

/** Type, the latest year, the year compared with (a dash where it has no count) and the change */
const comparisonColumns = (
  typeLabel: string,
  year: number | null,
  compareYear: number | null,
  renderType?: (row: ComparisonRow) => React.ReactNode
): StateTableColumn<ComparisonRow>[] => [
  { key: 'type', label: typeLabel, render: renderType },
  ...(year ? [{
    key: 'count',
    label: formatSchoolYear(year),
    shortLabel: shortYear(year),
    align: 'right' as const,
    format: (row: ComparisonRow) => formatCount(row.count),
  }] : []),
  ...(compareYear !== null ? [{
    key: 'before',
    label: formatSchoolYear(compareYear),
    shortLabel: shortYear(compareYear),
    align: 'right' as const,
    format: (row: ComparisonRow) => (row.before === null ? '—' : formatCount(row.before)),
  }] : []),
  { key: 'change', label: '% Change', shortLabel: 'Change', align: 'right', format: row => formatSignedPercent(row.change) },
];

/** Round ticks from just under the lowest value to just over the highest, `step` apart: a tight axis that still fits new years */
const ticksAround = (values: number[], step: number): number[] | undefined => {
  if (!values.length) return undefined;
  const low = Math.floor(Math.min(...values) / step) * step;
  const high = Math.ceil(Math.max(...values) / step) * step;
  return Array.from({ length: Math.round((high - low) / step) + 1 }, (_, index) => low + index * step);
};
// Salary axis steps: actual pay spans about $25K, the inflation-adjusted pay under $10K
const SALARY_STEP = 5000;
const ADJUSTED_SALARY_STEP = 2000;

// Class size axis steps: whole students for the all-grades average, two for the grade levels, which spread wider
const ALL_GRADES_STEP = 1;
const GRADE_LEVELS_STEP = 2;

const CLASS_SIZES = [
  { key: 'grades_1_2', name: 'Grades 1-2' },
  { key: 'grades_3_4', name: 'Grades 3-4' },
  { key: 'grades_5_8', name: 'Grades 5-8' },
];

const StateStaff: React.FC = () => {
  const staffData = useStateStaffData();
  const enrollment = useStateEnrollmentData();
  const { status, retry } = useStateLoads([...staffData.loads, ...staffData.detailLoads, ...enrollment.loads]);

  const [salaryAdjusted, setSalaryAdjusted] = useState(false);
  const salary = useMemo(() => {
    const nominal = toSeries(staffData.salary, row => row.salary);
    const latestYear = latestPoint(nominal)?.year;
    return { latestYear, nominal, adjusted: latestYear ? adjustSeriesForInflation(nominal, latestYear) : [] };
  }, [staffData.salary]);

  const staffByType = useMemo(() => pivotByYear(staffData.staff, row => row.staff_type.name, row => row.value), [staffData.staff]);
  const teachers = useMemo(() => toSeries(staffByType, row => row.Teacher), [staffByType]);
  const otherStaff = useMemo(
    () => toSeries(staffByType, row => Object.entries(row).reduce((sum, [key, value]) => (key === 'year' || key === 'Teacher' ? sum : sum + (value ?? 0)), 0)),
    [staffByType]
  );
  // One staff type's share of all staff each year, picked like the district Staff page's chart
  const [shareType, setShareType] = useState<string>('Teacher');
  const typeShare = useMemo(() => staffByType.flatMap(({ year, ...byType }) => {
    const total = Object.values(byType).reduce<number>((sum, value) => sum + (value ?? 0), 0);
    const count = byType[shareType];
    return total && typeof count === 'number' ? [{ year, share: (count / total) * 100 }] : [];
  }), [staffByType, shareType]);
  const students = useMemo(() => toSeries(enrollment.adm, row => row.total), [enrollment.adm]);
  const ratio = useMemo(() => studentsPerTeacher(students, teachers), [students, teachers]);

  // Students and staff as percent change over the last ten years both cover
  const studentsVsStaff = useMemo(() => {
    const latest = Math.min(latestPoint(students)?.year ?? 0, latestPoint(teachers)?.year ?? 0);
    if (!latest) return { rows: [], baseYear: null as number | null };
    const baseYear = Math.max(latest - TREND_YEARS, students[0]?.year ?? 0, teachers[0]?.year ?? 0);
    return {
      baseYear,
      rows: mergeSeries({
        students: percentChangeSeries(students, baseYear),
        teachers: percentChangeSeries(teachers, baseYear),
        other: percentChangeSeries(otherStaff, baseYear),
      }).filter(row => row.year <= latest),
    };
  }, [students, teachers, otherStaff]);

  const staffCompare = useCompareYear(staffByType);
  const staffTable = useMemo(
    // The state's staff type names in the district Staff page's order
    () => compareByType(staffByType, staffCompare.year, type => type, 'All Staff', [...STAFF_TYPE_ORDER]),
    [staffByType, staffCompare.year]
  );

  // Teachers by highest degree. Years whose degree counts add up to far more teachers than the
  // staffing report (2011-12 in the current data) can't be compared with, so they're left out.
  const degreesByYear = useMemo(() => {
    const counts = pivotByYear(staffData.education, row => row.teacher_type.name, row => row.value);
    const teacherCount = new Map(teachers.map(point => [point.year, point.value]));
    return counts.filter(({ year, ...byDegree }) => {
      const total = Object.values(byDegree).reduce<number>((sum, value) => sum + (value ?? 0), 0);
      const reported = teacherCount.get(year);
      return reported === undefined || total <= reported * MAX_DEGREE_COUNT_RATIO;
    });
  }, [staffData.education, teachers]);
  const degreeCompare = useCompareYear(degreesByYear);
  const degreeTable = useMemo(() => compareByType(
    degreesByYear,
    degreeCompare.year,
    type => DEGREES.find(degree => degree.key === type)?.name ?? type,
    'All Teachers',
    DEGREES.map(degree => degree.key)
  ), [degreesByYear, degreeCompare.year]);

  const [classSizeView, setClassSizeView] = useState<'all' | 'levels' | 'ratio'>('all');
  const classSize = useMemo(() => sortByYear(staffData.classSize).map(row => ({
    year: row.year,
    grades_1_2: row.grades_1_2,
    grades_3_4: row.grades_3_4,
    grades_5_8: row.grades_5_8,
    all_grades: typeof row.all_grades === 'number' ? row.all_grades : null,
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
    const latestSalary = latestPoint(salary.nominal);
    const latestRatio = latestPoint(ratio);
    const salaryChange = changeSince(salary.nominal, TREND_YEARS);
    const figures: KeyFigure[] = [];
    const takeaway: string[] = [];
    if (latestSalary) {
      figures.push({
        label: 'Average Teacher Salary',
        shortLabel: 'Avg. Teacher Salary',
        value: formatDollars(latestSalary.value),
        shortValue: `$${formatThousands(latestSalary.value)}`,
        period: shortYear(latestSalary.year),
        delta: tileDelta(salaryChange, { unit: 'percent', higherIsBetter: true }),
      });
      if (salaryChange) {
        takeaway.push(`The average teacher earned ${formatDollars(latestSalary.value)} in ${formatSchoolYear(latestSalary.year)}, ${describeChange(salaryChange.percentChange)} from ${formatSchoolYear(salaryChange.from.year)}`
          + `, which is ${describeChange(realPercentChange(salaryChange))} once inflation is taken into account.`);
      }
    }
    if (latestRatio) {
      figures.push({
        label: 'Students per Teacher',
        value: latestRatio.value.toFixed(1),
        period: shortYear(latestRatio.year),
        // Fewer students per teacher counts as the good direction, like class size
        delta: tileDelta(changeSince(ratio, TREND_YEARS), { unit: 'percent', higherIsBetter: false }),
      });
    }
    // NH DOE's statewide average for all grades; smaller classes count as the good direction, as on
    // the district Staff page
    const allGrades = toSeries(classSize, row => row.all_grades);
    const latestClass = latestPoint(allGrades);
    if (latestClass) {
      figures.push({
        label: 'Average Class Size',
        value: latestClass.value.toFixed(1),
        period: shortYear(latestClass.year),
        delta: tileDelta(changeSince(allGrades, TREND_YEARS), { unit: 'percent', higherIsBetter: false }),
      });
    }
    return { figures, takeaway };
  }, [teachers, salary.nominal, ratio, classSize]);

  const salaryDollars = salary.latestYear ? `${formatSchoolYear(salary.latestYear)} Dollars` : 'Today\'s Dollars';

  // Everything on the page as one workbook: a sheet per chart or table, and the notes the page leaves out
  const downloadExcel = () => {
    const percent = (value: number | null | undefined) => (typeof value === 'number' ? value / 100 : null);
    const valueIn = (series: { year: number; value: number }[], year: number) => series.find(point => point.year === year)?.value ?? null;
    const allGradesSeries = toSeries(classSize, row => row.all_grades);
    const tileRow = (figure: string, series: { year: number; value: number }[], text: (value: number) => string): (string | number | null)[] => {
      const latest = latestPoint(series);
      const change = changeSince(series, TREND_YEARS);
      return [figure, latest ? formatSchoolYear(latest.year) : null, latest ? text(latest.value) : null, change ? change.percentChange / 100 : null, change ? formatSchoolYear(change.from.year) : null];
    };
    const typeTotal = (row: YearRow) => STAFF_TYPE_ORDER.reduce((sum, type) => sum + (row[type] ?? 0), 0);
    const classYears = [...new Set([...classSize.map(row => row.year), ...ratio.map(point => point.year)])].sort((a, b) => a - b);
    const sheets: ExcelSheet[] = [
      {
        name: 'Key Figures',
        columns: [
          { header: 'Figure', width: 24 },
          { header: 'School Year', width: 12 },
          { header: 'Value', width: 12 },
          { header: 'Change', format: PERCENT },
          { header: 'Since', width: 12 },
        ],
        rows: [
          tileRow('Average Teacher Salary', salary.nominal, formatDollars),
          tileRow('Students per Teacher', ratio, value => value.toFixed(1)),
          tileRow('Average Class Size', allGradesSeries, value => value.toFixed(1)),
        ],
      },
      {
        name: 'Average Teacher Salary',
        subtitle: `Annual salary, actual and in ${salaryDollars.toLowerCase()}`,
        columns: [
          { header: 'School Year', width: 12 },
          { header: 'Average Salary', width: 16, format: DOLLARS },
          { header: `In ${salaryDollars}`, width: 22, format: DOLLARS },
        ],
        rows: salary.nominal.map(point => [formatSchoolYear(point.year), point.value, valueIn(salary.adjusted, point.year)]),
      },
      {
        name: 'Percent Change in Staff',
        subtitle: studentsVsStaff.baseYear ? `Since ${formatSchoolYear(studentsVsStaff.baseYear)}; students are average daily membership` : undefined,
        columns: [
          { header: 'School Year', width: 12 },
          { header: 'Students', format: PERCENT },
          { header: 'Teachers', format: PERCENT },
          { header: 'All Other Staff', width: 16, format: PERCENT },
        ],
        rows: studentsVsStaff.rows.map(row => [formatSchoolYear(row.year), percent(row.students), percent(row.teachers), percent(row.other)]),
      },
      {
        name: 'Staff By Type By Year',
        subtitle: 'Full-time equivalents',
        columns: [
          { header: 'School Year', width: 12 },
          ...STAFF_TYPE_ORDER.map(type => ({ header: type, width: 16, format: COUNT })),
          { header: 'All Staff', width: 12, format: COUNT },
        ],
        rows: staffByType.map(row => [formatSchoolYear(row.year), ...STAFF_TYPE_ORDER.map(type => row[type] ?? null), typeTotal(row)]),
      },
      {
        name: 'Staff Types As % of Staff',
        subtitle: 'Each staff type as a percentage of all staff',
        columns: [
          { header: 'School Year', width: 12 },
          ...STAFF_TYPE_ORDER.map(type => ({ header: staffTypePlural(type), width: 16, format: PERCENT })),
        ],
        rows: staffByType.map(row => {
          const total = typeTotal(row);
          return [formatSchoolYear(row.year), ...STAFF_TYPE_ORDER.map(type => (total && typeof row[type] === 'number' ? (row[type] as number) / total : null))];
        }),
      },
      {
        name: 'Teacher Education By Year',
        subtitle: 'Teachers by highest degree',
        columns: [
          { header: 'School Year', width: 12 },
          ...DEGREES.map(degree => ({ header: degree.name, width: 16, format: COUNT })),
          { header: 'All Teachers', width: 14, format: COUNT },
        ],
        rows: degreesByYear.map(row => [
          formatSchoolYear(row.year),
          ...DEGREES.map(degree => row[degree.key] ?? null),
          DEGREES.reduce((sum, degree) => sum + (row[degree.key] ?? 0), 0),
        ]),
      },
      {
        name: 'Class Size By Year',
        title: 'Average Class Size and Students per Teacher',
        subtitle: 'Students per class, all grades and by grade level; students per full-time-equivalent teacher',
        columns: [
          { header: 'School Year', width: 12 },
          { header: 'All Grades', format: '0.0' },
          ...CLASS_SIZES.map(size => ({ header: size.name, format: '0.0' })),
          { header: 'Students per Teacher', width: 20, format: '0.0' },
        ],
        rows: classYears.map(year => {
          const row = classSize.find(item => item.year === year);
          return [
            formatSchoolYear(year),
            row?.all_grades ?? null,
            ...CLASS_SIZES.map(size => (row?.[size.key as keyof typeof row] as number | null | undefined) ?? null),
            valueIn(ratio, year),
          ];
        }),
      },
      {
        name: 'Notes',
        title: 'About This Data',
        subtitle: 'Staff for New Hampshire',
        columns: [{ header: 'Notes', width: 100, wrap: true }],
        rows: [[[
          `From NH Education Facts (${window.location.href}), downloaded ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.`,
          'Sources: NH Department of Education Full Time Equivalent Staff Count, Teacher Average Salary, Teacher Attainment and Average Class Size reports (iPlatform); the statewide all-grades average class size from iExplore; average daily membership for students.',
          'Staff are full-time equivalents as of October 1: part-time staff count as fractions. Teacher education counts teachers by highest degree; 2011-12 is left out because its degree counts add up to about twice the teachers in the staffing report.',
          `Salaries in ${salaryDollars.toLowerCase()} are adjusted with the consumer price index (CPI-U, U.S. city average).`,
          'Students per teacher is students (average daily membership) divided by full-time-equivalent teachers. It isn\'t class size: teachers include specialists and others who don\'t lead a regular class.',
          'The all-grades average class size is NH DOE\'s statewide figure, published from 2015-16; the grade levels come from the class size reports. NH DOE doesn\'t say which grades the all-grades figure covers.',
          'Percent change in staff ends in the latest year with both student and staff counts.',
        ].join('\n\n')]],
      },
    ];
    return downloadWorkbook('nh-staff.xlsx', sheets);
  };

  return (
    <StatePage
      displayName={PAGE.displayName}
      status={status}
      onRetry={retry}
      errorMessage="Statewide staff data could not be loaded."
      intro={(
        <>
          Who works in New Hampshire's public schools, what teachers are paid, and how many students there are for each teacher.
          {/* The takeaway as a second paragraph, so the tiles sit beside the text on wide screens */}
          {keyFigures.takeaway.length > 0 && (
            <Box component="span" sx={{ display: 'block', mt: 2 }}>{keepYearsTogether(keyFigures.takeaway.join(' '))}</Box>
          )}
        </>
      )}
      keyFigures={<KeyFigures figures={keyFigures.figures} centerLastTile />}
      keyFiguresBesideIntro
      onDownload={downloadExcel}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Side by side on desktop */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, '& > *': { flex: 1, minWidth: 0 } }}>
          <TrendChart
            title="Average Teacher Salary"
            shortTitle="Avg. Teacher Salary"
            subtitle={salaryAdjusted ? `(Annual Salary in ${salaryDollars})` : '(Annual Salary)'}
            control={(
              // Like the district Staff page's button
              <ToggleButton
                value="adjusted"
                size="small"
                selected={salaryAdjusted}
                onChange={() => setSalaryAdjusted(adjusted => !adjusted)}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Adj. For Inflation
              </ToggleButton>
            )}
            showViewToggle={false}
            data={(salaryAdjusted ? salary.adjusted : salary.nominal).map(point => ({ year: point.year, salary: point.value }))}
            series={[{ key: 'salary', name: 'State Average' }]}
            yTicks={salaryAdjusted
              ? ticksAround(salary.adjusted.map(point => point.value), ADJUSTED_SALARY_STEP)
              : ticksAround(salary.nominal.map(point => point.value), SALARY_STEP)}
            format={formatDollars}
            axisFormat={formatCompactDollars}
          />
          <TrendChart
            title="Percent Change in Staff"
            subtitle={studentsVsStaff.baseYear ? `Since ${formatSchoolYear(studentsVsStaff.baseYear)}` : undefined}
            showViewToggle={false}
            // Under the plot, so the plot lines up with the salary chart's beside it
            legendBelow
            data={studentsVsStaff.rows}
            series={[
              { key: 'students', name: 'Students', color: CONTEXT_COLOR },
              { key: 'teachers', name: 'Teachers', color: ENTITY_COLORS.teachers },
              { key: 'other', name: 'All Other Staff', shortName: 'Other Staff', color: ENTITY_COLORS.otherStaff },
            ]}
            format={value => formatSignedPercent(value)}
            axis="span"
          />
        </Box>

        <Divider />

        {/* The two compare tables side by side, like the district Staff page */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, '& > *': { flex: 1, minWidth: 0 } }}>
          <StateTable
            title="Staff By Type"
            control={staffCompare.year !== null && (
              <CompareYearPicker years={staffCompare.years} year={staffCompare.year} onChange={staffCompare.setYear} label="Compare staff with" />
            )}
            columns={comparisonColumns('Staff Type', staffTable.year, staffCompare.year, row => (
              row === staffTable.total ? row.type : <StaffTypeCell name={row.type} />
            ))}
            rows={staffTable.rows}
            totalRow={staffTable.total}
          />
          <StateTable
            title="Teacher Education"
            control={degreeCompare.year !== null && (
              <CompareYearPicker years={degreeCompare.years} year={degreeCompare.year} onChange={degreeCompare.setYear} label="Compare teacher education with" />
            )}
            columns={comparisonColumns('Education Type', degreeTable.year, degreeCompare.year)}
            rows={degreeTable.rows}
            totalRow={degreeTable.total}
          />
        </Box>

        {/* Side by side on desktop */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, '& > *': { flex: 1, minWidth: 0 } }}>
          <TrendChart
            title={staffTypePlural(shareType)}
            subtitle="As % of Staff"
            showViewToggle={false}
            control={(
              // The district Staff page's staff type picker
              <FormControl size="small" sx={{ minWidth: { xs: 130, sm: 170 } }}>
                <Select
                  value={shareType}
                  onChange={event => setShareType(event.target.value)}
                  inputProps={{ 'aria-label': 'Show staff type' }}
                >
                  {STAFF_TYPE_ORDER.map(type => <MenuItem key={type} value={type}>{staffTypePlural(type)}</MenuItem>)}
                </Select>
              </FormControl>
            )}
            data={typeShare}
            series={[{ key: 'share', name: staffTypePlural(shareType) }]}
            axis="span"
            format={value => formatPercent(value, 1)}
            // As few decimals as each tick needs: small shares like librarians' step by hundredths
            axisFormat={value => formatPercent(value, [0, 1, 2].find(digits => Math.abs(value * 10 ** digits - Math.round(value * 10 ** digits)) < 1e-6) ?? 2)}
          />
          <TrendChart
            // Like the Enrollment page's Public School Students chart: all students, by grade level, or
            // students per teacher, titled for what it shows (students per teacher isn't a class size)
            title={classSizeView === 'ratio' ? 'Students per Teacher' : 'Average Class Size'}
            subtitle={classSizeView === 'all'
              ? 'Students per Class, All Grades'
              : classSizeView === 'levels' ? 'Students per Class By Grade Level' : 'Students Divided By Full-Time-Equivalent Teachers'}
            showViewToggle={false}
            control={(
              <FormControl size="small" sx={{ minWidth: { xs: 130, sm: 150 } }}>
                <Select
                  value={classSizeView}
                  onChange={event => setClassSizeView(event.target.value as 'all' | 'levels' | 'ratio')}
                  inputProps={{ 'aria-label': 'Show average class size' }}
                >
                  <MenuItem value="all">All Students</MenuItem>
                  <MenuItem value="levels">By Grade Level</MenuItem>
                  <MenuItem value="ratio">Students per Teacher</MenuItem>
                </Select>
              </FormControl>
            )}
            {...(classSizeView === 'all'
              ? {
                // NH DOE's statewide average, published from 2015-16
                data: classSize.filter(row => row.all_grades !== null).map(row => ({ year: row.year, all_grades: row.all_grades })),
                series: [{ key: 'all_grades', name: 'All Students' }],
                yTicks: ticksAround(classSize.flatMap(row => (row.all_grades !== null ? [row.all_grades] : [])), ALL_GRADES_STEP),
              }
              : classSizeView === 'levels'
                ? {
                  data: classSize,
                  series: CLASS_SIZES,
                  yTicks: ticksAround(classSize.flatMap(row => [row.grades_1_2, row.grades_3_4, row.grades_5_8].filter((value): value is number => typeof value === 'number')), GRADE_LEVELS_STEP),
                  note: classSizeNote || undefined,
                }
                : {
                  data: ratio.map(point => ({ year: point.year, ratio: point.value })),
                  series: [{ key: 'ratio', name: 'Students per Teacher' }],
                  yTicks: ticksAround(ratio.map(point => point.value), ALL_GRADES_STEP),
                })}
            format={value => value.toFixed(1)}
            axisFormat={value => formatCompact(value)}
          />
        </Box>
      </Box>
    </StatePage>
  );
};

export default StateStaff;
