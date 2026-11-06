import React, { useMemo, useState } from 'react';
import { Box, Divider, FormControl, MenuItem, Select } from '@mui/material';
import StatePage from '../components/StatePage';
import StateTable from '../components/StateTable';
import TrendChart, { ENTITY_COLORS, SERIES_COLORS } from '../components/TrendChart';
import KeyFigures, { KeyFigure } from '../components/KeyFigures';
import { keepYearsTogether } from '../components/chartText';
import { COUNT, downloadWorkbook, ExcelSheet, PERCENT } from '../utils/excel';
import { useStateLoads } from '../hooks/useStateLoads';
import { useStateEnrollmentByTypeData } from '../hooks/useStatewideData';
import {
  changeFrom,
  describeChange,
  formatCompact,
  formatCount,
  formatPercent,
  formatSchoolYear,
  formatSignedPercent,
  latestPoint,
  mergeSeries,
  publicStudents,
  REMOTE_SCHOOL_YEAR,
} from '../utils/stateMetrics';
import { formatThousands, shortYear, tileDelta } from '../utils/phrases';

// 2014-15: the year the key figures and the type of school table compare with
const SINCE_YEAR = 2015;
// Axes cut close to the lines rather than from zero, so the decline shows: every year since 2007-08
// is in range (all students 157,617 to 200,772; the levels 36,256 to 84,403)
const STUDENT_TICKS = [150000, 160000, 170000, 180000, 190000, 200000, 210000];
const LEVEL_TICKS = [30000, 40000, 50000, 60000, 70000, 80000, 90000];
// Preschool 2,614 to grade 12 15,918
const ENTERING_TICKS = [2000, 4000, 6000, 8000, 10000, 12000, 14000, 16000];
const REMOTE_BAND = [{ from: REMOTE_SCHOOL_YEAR - 1, to: REMOTE_SCHOOL_YEAR, label: 'COVID' }];

// School levels, from the grades in the state's October 1 counts (preschool and post-graduate
// students aren't in a level)
const gradeRange = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, index) => `Grade ${from + index}`);
const LEVELS = [
  { key: 'elementary', name: 'Elementary (K-5)', shortName: 'Elementary', color: ENTITY_COLORS.elementary, grades: ['Kindergarten', ...gradeRange(1, 5)] },
  { key: 'middle', name: 'Middle (6-8)', shortName: 'Middle', color: ENTITY_COLORS.middle, grades: gradeRange(6, 8) },
  { key: 'high', name: 'High (9-12)', shortName: 'High', color: ENTITY_COLORS.high, grades: gradeRange(9, 12) },
];

// The state's types of school, in the order the table lists them, with the names the page uses.
// Interstate schools are a few dozen New Hampshire students in schools shared with Vermont.
const PUBLIC_TYPES = [
  { name: 'Public District Schools', label: 'District Schools' },
  { name: 'Public Academies and Joint Maintenance Agreement Schools', label: 'Academies' },
  { name: 'Public Charter Schools', label: 'Charter Schools' },
  { name: 'Interstate Schools', label: 'Interstate Schools' },
];
const NONPUBLIC = 'Nonpublic Schools';

const StateEnrollment: React.FC = () => {
  const publicEnrollment = useStateEnrollmentByTypeData();
  const { status, retry } = useStateLoads(publicEnrollment.loads);
  const byType = publicEnrollment.byType;

  // October 1 students in every public school (district, academy, charter, interstate), all grades
  const students = useMemo(() => publicStudents(byType), [byType]);
  const total = useMemo(() => students.map(point => ({ year: point.year, total: point.value })), [students]);
  // The students chart shows all students or the three school levels
  const [studentsView, setStudentsView] = useState<'all' | 'levels'>('all');
  const studentsChart = useMemo(() => {
    if (studentsView === 'levels') {
      return {
        data: mergeSeries(Object.fromEntries(LEVELS.map(level => [level.key, publicStudents(byType, { grades: level.grades })]))),
        series: LEVELS.map(({ key, name, shortName, color }) => ({ key, name, shortName, color })),
        subtitle: '# of Students By Level',
        yTicks: LEVEL_TICKS,
      };
    }
    return { data: total, series: [{ key: 'total', name: 'Students' }], subtitle: '# of Students, All Grades', yTicks: STUDENT_TICKS };
  }, [studentsView, byType, total]);

  // Students starting school (preschool, kindergarten, grade 1) and finishing it (grade 12) each year
  const gradeSeries = useMemo(() => ({
    preschool: publicStudents(byType, { grade: 'Preschool' }),
    kindergarten: publicStudents(byType, { grade: 'Kindergarten' }),
    grade1: publicStudents(byType, { grade: 'Grade 1' }),
    grade12: publicStudents(byType, { grade: 'Grade 12' }),
  }), [byType]);
  const entering = useMemo(() => mergeSeries(gradeSeries), [gradeSeries]);

  // Every grade in the latest year, against 2014-15 like the key figures and the type of school table
  const gradeTable = useMemo(() => {
    const years = [...new Set(byType.map(row => row.year))];
    if (!years.length) return { year: null as number | null, compareYear: null as number | null, rows: [] };
    const year = Math.max(...years);
    const compareYear = SINCE_YEAR;
    // Every grade, preschool through post-graduate, so the total matches the Students tile
    const grades = [...new Map(byType.map(row => [row.grade.id, row.grade.name])).entries()].sort((a, b) => a[0] - b[0]);
    const count = (grade: string, forYear: number) =>
      publicStudents(byType, { grade }).find(point => point.year === forYear)?.value ?? null;
    const rows = grades.flatMap(([, grade]) => {
      const now = count(grade, year);
      if (now === null) return [];
      const earlier = count(grade, compareYear);
      return [{ grade, students: now, earlier, change: earlier ? ((now - earlier) / earlier) * 100 : null }];
    });
    return { year, compareYear, rows };
  }, [byType]);
  const gradeTotals = useMemo(() => {
    const studentsTotal = gradeTable.rows.reduce((sum, row) => sum + row.students, 0);
    const earlierRows = gradeTable.rows.filter(row => row.earlier !== null);
    const earlierTotal = earlierRows.length === gradeTable.rows.length ? earlierRows.reduce((sum, row) => sum + (row.earlier ?? 0), 0) : null;
    return {
      grade: 'All Grades',
      students: studentsTotal,
      earlier: earlierTotal,
      change: earlierTotal ? ((studentsTotal - earlierTotal) / earlierTotal) * 100 : null,
    };
  }, [gradeTable.rows]);

  const keyFigures = useMemo(() => {
    const figures: KeyFigure[] = [];
    const takeaway: string[] = [];
    const latestStudents = latestPoint(students);
    const studentChange = changeFrom(students, SINCE_YEAR);
    if (latestStudents) {
      figures.push({
        label: 'Students',
        value: formatCount(latestStudents.value),
        shortValue: formatThousands(latestStudents.value),
        period: shortYear(latestStudents.year),
        delta: tileDelta(studentChange, { unit: 'percent', higherIsBetter: true }),
      });
      if (studentChange) {
        takeaway.push(`${formatCount(latestStudents.value)} students were enrolled in public schools in ${formatSchoolYear(latestStudents.year)}, ${describeChange(studentChange.percentChange)} from ${formatSchoolYear(studentChange.from.year)}.`);
      }
    }
    const kindergarten = latestPoint(gradeSeries.kindergarten);
    const grade12 = latestPoint(gradeSeries.grade12);
    if (kindergarten) {
      figures.push({
        label: 'Kindergarten',
        value: formatCount(kindergarten.value),
        period: shortYear(kindergarten.year),
        delta: tileDelta(changeFrom(gradeSeries.kindergarten, SINCE_YEAR), { unit: 'percent', higherIsBetter: true }),
      });
    }
    if (grade12) {
      figures.push({
        label: 'Grade 12',
        value: formatCount(grade12.value),
        period: shortYear(grade12.year),
        delta: tileDelta(changeFrom(gradeSeries.grade12, SINCE_YEAR), { unit: 'percent', higherIsBetter: true }),
      });
      if (kindergarten && kindergarten.year === grade12.year) {
        takeaway.push(`This year's kindergarten class (${formatCount(kindergarten.value)}) is ${kindergarten.value < grade12.value ? 'smaller' : 'larger'} than the graduating class (${formatCount(grade12.value)}).`);
      }
    }
    return { figures, takeaway };
  }, [students, gradeSeries]);

  const compareText = gradeTable.compareYear ? formatSchoolYear(gradeTable.compareYear) : 'earlier';

  // October 1 students (all grades) by year and type of school
  const typeTotals = useMemo(() => {
    const totals = new Map<number, Map<string, number>>();
    byType.forEach(row => {
      const year = totals.get(row.year) ?? new Map<string, number>();
      year.set(row.enrollment_type.name, (year.get(row.enrollment_type.name) ?? 0) + row.enrollment);
      totals.set(row.year, year);
    });
    return totals;
  }, [byType]);
  const publicTotal = (year: number) => PUBLIC_TYPES.reduce((sum, type) => sum + (typeTotals.get(year)?.get(type.name) ?? 0), 0);


  // Public and private schools in the latest year with both (private counts come out a year after
  // public ones), against 2014-15 like the key figures
  const typeTable = useMemo(() => {
    const years = [...typeTotals.keys()];
    const complete = years.filter(year => typeTotals.get(year)?.has(NONPUBLIC));
    if (!years.length) return { year: null as number | null, latestPublicYear: null as number | null, sinceYear: null as number | null, rows: [], total: null };
    const year = Math.max(...(complete.length ? complete : years));
    const sinceYear = typeTotals.has(SINCE_YEAR) ? SINCE_YEAR : null;
    const count = (forYear: number | null, name: string) => (forYear === null ? null : typeTotals.get(forYear)?.get(name) ?? null);
    const allSchools = (forYear: number) => publicTotal(forYear) + (count(forYear, NONPUBLIC) ?? 0);
    const everyone = allSchools(year);
    const row = (label: string, value: number, earlier: number | null, subtotal = false) => ({
      type: label,
      students: value,
      change: earlier ? ((value - earlier) / earlier) * 100 : null,
      share: everyone ? (value / everyone) * 100 : null,
      subtotal,
    });
    const rows = [
      ...PUBLIC_TYPES
        .filter(type => count(year, type.name) !== null)
        .map(type => row(type.label, count(year, type.name)!, count(sinceYear, type.name))),
      row('All Public Schools', publicTotal(year), sinceYear ? publicTotal(sinceYear) : null, true),
      ...(count(year, NONPUBLIC) !== null ? [row('Private Schools', count(year, NONPUBLIC)!, count(sinceYear, NONPUBLIC))] : []),
    ];
    return {
      year,
      latestPublicYear: Math.max(...years),
      sinceYear,
      rows,
      total: count(year, NONPUBLIC) !== null ? row('All Schools', everyone, sinceYear && count(sinceYear, NONPUBLIC) !== null ? allSchools(sinceYear) : null) : null,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeTotals]);
  const sinceText = typeTable.sinceYear ? formatSchoolYear(typeTable.sinceYear) : 'earlier';

  // Everything on the page in one workbook: a sheet per tile row, chart and table, then notes
  const downloadExcel = () => {
    const percent = (value: number | null | undefined) => (typeof value === 'number' ? value / 100 : null);
    const valueIn = (series: { year: number; value: number }[], year: number) => series.find(point => point.year === year)?.value ?? null;
    const years = students.map(point => point.year);
    const levelSeries = LEVELS.map(level => publicStudents(byType, { grades: level.grades }));
    const sinceLabel = formatSchoolYear(SINCE_YEAR);
    const tileRow = (series: { year: number; value: number }[]) => {
      const latest = latestPoint(series);
      const change = changeFrom(series, SINCE_YEAR);
      return [latest?.value ?? null, change ? change.percentChange / 100 : null];
    };
    const latestYear = latestPoint(students)?.year;
    const typeYears = [...typeTotals.keys()].sort((a, b) => a - b);
    const sheets: ExcelSheet[] = [
      {
        name: 'Key Figures',
        subtitle: latestYear ? `Public school students, ${formatSchoolYear(latestYear)}` : undefined,
        columns: [
          { header: 'School Year', width: 12 },
          { header: 'Students', format: COUNT },
          { header: `Change Since ${sinceLabel}`, width: 20, format: PERCENT },
          { header: 'Kindergarten', format: COUNT },
          { header: `Change Since ${sinceLabel}`, width: 20, format: PERCENT },
          { header: 'Grade 12', format: COUNT },
          { header: `Change Since ${sinceLabel}`, width: 20, format: PERCENT },
        ],
        rows: latestYear ? [[formatSchoolYear(latestYear), ...tileRow(students), ...tileRow(gradeSeries.kindergarten), ...tileRow(gradeSeries.grade12)]] : [],
      },
      {
        name: 'Public School Students',
        subtitle: '# of students, all grades and by level (elementary K-5, middle 6-8, high 9-12)',
        columns: [
          { header: 'School Year', width: 12 },
          { header: 'All Students', format: COUNT },
          ...LEVELS.map(level => ({ header: level.name, width: 18, format: COUNT })),
        ],
        rows: years.map(year => [formatSchoolYear(year), valueIn(students, year), ...levelSeries.map(series => valueIn(series, year))]),
      },
      {
        name: typeTable.year ? `By Type of School ${formatSchoolYear(typeTable.year)}` : 'By Type of School',
        title: typeTable.year ? `Enrollment by Type of School, ${formatSchoolYear(typeTable.year)}` : 'Enrollment by Type of School',
        subtitle: '# of students, all grades',
        columns: [
          { header: 'Type of School', width: 24 },
          { header: 'Students', format: COUNT },
          { header: `Change Since ${sinceText}`, width: 20, format: PERCENT },
          { header: 'Share of Total', width: 16, format: PERCENT },
        ],
        rows: typeTable.rows.map(row => [row.type, row.students, percent(row.change), percent(row.share)]),
        subtotalRows: typeTable.rows.flatMap((row, index) => (row.subtotal ? [index] : [])),
        totalRow: typeTable.total ? [typeTable.total.type, typeTable.total.students, percent(typeTable.total.change), percent(typeTable.total.share)] : undefined,
      },
      {
        name: 'Type of School By Year',
        title: 'Enrollment by Type of School By Year',
        subtitle: '# of students, all grades; private school counts come out a year after public ones',
        columns: [
          { header: 'School Year', width: 12 },
          ...PUBLIC_TYPES.map(type => ({ header: type.label, width: 16, format: COUNT })),
          { header: 'All Public Schools', width: 18, format: COUNT },
          { header: 'Private Schools', width: 16, format: COUNT },
          { header: 'All Schools', width: 14, format: COUNT },
        ],
        rows: typeYears.map(year => {
          const privateCount = typeTotals.get(year)?.get(NONPUBLIC) ?? null;
          return [
            formatSchoolYear(year),
            ...PUBLIC_TYPES.map(type => typeTotals.get(year)?.get(type.name) ?? null),
            publicTotal(year),
            privateCount,
            privateCount === null ? null : publicTotal(year) + privateCount,
          ];
        }),
      },
      {
        name: 'Starting and Finishing School',
        title: 'Students Starting and Finishing School',
        subtitle: '# of public school students in preschool, kindergarten, grade 1 and grade 12',
        columns: [
          { header: 'School Year', width: 12 },
          { header: 'Preschool', format: COUNT },
          { header: 'Kindergarten', format: COUNT },
          { header: 'Grade 1', format: COUNT },
          { header: 'Grade 12', format: COUNT },
        ],
        rows: entering.map(row => [formatSchoolYear(row.year), row.preschool, row.kindergarten, row.grade1, row.grade12].map(value => (value ?? null) as string | number | null)),
      },
      {
        name: gradeTable.year ? `By Grade ${formatSchoolYear(gradeTable.year)}` : 'By Grade',
        title: gradeTable.year ? `Public School Enrollment By Grade, ${formatSchoolYear(gradeTable.year)}` : 'Public School Enrollment By Grade',
        columns: [
          { header: 'Grade', width: 18 },
          { header: 'Students', format: COUNT },
          { header: `In ${compareText}`, format: COUNT },
          { header: `Change Since ${compareText}`, width: 22, format: PERCENT },
        ],
        rows: gradeTable.rows.map(row => [row.grade, row.students, row.earlier, percent(row.change)]),
        totalRow: gradeTable.rows.length ? [gradeTotals.grade, gradeTotals.students, gradeTotals.earlier, percent(gradeTotals.change)] : undefined,
      },
      {
        name: 'Notes',
        title: 'About This Data',
        subtitle: 'Statewide Enrollment',
        columns: [{ header: 'Notes', width: 100, wrap: true }],
        rows: [[[
          `From NH Education Facts (${window.location.href}), downloaded ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.`,
          'Source: NH Department of Education, State Totals Ten Years Public and Private Fall Enrollments (October 1 enrollment by type of school and grade).',
          'Public schools are district, academy (and joint maintenance agreement), charter and interstate schools. Interstate schools are shared with Vermont; these are their New Hampshire students.',
          'School levels: elementary is kindergarten to grade 5, middle grades 6 to 8, high grades 9 to 12. Preschool and post-graduate students aren\'t in a level.',
          'Private school counts come out a year after public ones. Education Freedom Account students aren\'t counted.',
        ].join('\n\n')]],
      },
    ];
    return downloadWorkbook('nh-enrollment.xlsx', sheets);
  };

  return (
    <StatePage
      // The title says statewide itself, so no "for New Hampshire" after it
      displayName="Statewide Enrollment"
      entityName=""
      status={status}
      onRetry={retry}
      errorMessage="Statewide enrollment data could not be loaded."
      intro={(
        <>
          How many students New Hampshire's public schools serve, and how that is changing grade by grade.
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
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, '& > *': { flex: 1, minWidth: 0 } }}>
          <TrendChart
            title="Public School Students"
            showViewToggle={false}
            subtitle={studentsChart.subtitle}
            control={(
              <FormControl size="small" sx={{ minWidth: { xs: 130, sm: 150 } }}>
                <Select
                  value={studentsView}
                  onChange={event => setStudentsView(event.target.value as 'all' | 'levels')}
                  inputProps={{ 'aria-label': 'Show public school students' }}
                >
                  <MenuItem value="all">All Students</MenuItem>
                  <MenuItem value="levels">By Level</MenuItem>
                </Select>
              </FormControl>
            )}
            data={studentsChart.data}
            series={studentsChart.series}
            yTicks={studentsChart.yTicks}
            format={formatCount}
            axisFormat={value => formatCompact(value)}
          />
          {typeTable.year && (
            <StateTable
              // Full school year from tablets up, the short year on phones
              title={`Enrollment by Type of School, ${formatSchoolYear(typeTable.year)}`}
              shortTitle={`Enrollment by Type of School, ${shortYear(typeTable.year)}`}
              subtitle="# of Students, All Grades"
              columns={[
                { key: 'type', label: 'Type of School' },
                { key: 'students', label: 'Students', align: 'right', format: row => formatCount(row.students) },
                { key: 'change', label: `Change Since ${sinceText}`, shortLabel: `% Since ${shortYear(SINCE_YEAR)}`, align: 'right', format: row => formatSignedPercent(row.change) },
                { key: 'share', label: 'Share of Total', align: 'right', format: row => (row.share !== null && row.share > 0 && row.share < 0.05 ? '<0.1%' : formatPercent(row.share, 1)), hideOnPhone: true },
              ]}
              rows={typeTable.rows}
              isSubtotal={row => row.subtotal}
              totalRow={typeTable.total ?? undefined}
              // Private school counts come out a year after public ones
              note={[
                typeTable.latestPublicYear && typeTable.latestPublicYear > typeTable.year
                  ? `Private School Counts unavailable for ${shortYear(typeTable.latestPublicYear)}. Displaying ${shortYear(typeTable.year)}.`
                  : '',
                'EFA Students not counted here.',
              ].filter(Boolean).join(' ')}
            />
          )}
        </Box>

        <Divider />

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, '& > *': { flex: 1, minWidth: 0 } }}>
          <TrendChart
            title="Students Starting and Finishing School"
            showViewToggle={false}
            subtitle="Public School Students"
            data={entering}
            // Kindergarten and grade 12 keep the colors they've had; preschool and grade 1 take the others
            series={[
              { key: 'preschool', name: 'Preschool', color: SERIES_COLORS[2] },
              { key: 'kindergarten', name: 'Kindergarten', color: SERIES_COLORS[0] },
              { key: 'grade1', name: 'Grade 1', color: SERIES_COLORS[3] },
              { key: 'grade12', name: 'Grade 12', color: SERIES_COLORS[1] },
            ]}
            yTicks={ENTERING_TICKS}
            format={formatCount}
            axisFormat={value => formatCompact(value)}
            bands={REMOTE_BAND}
            note="Early grades dipped in 20/21, when many schools were remote/hybrid. As a percentage of students, more students are attending Preschool and Kindergarten."
          />
          <StateTable
            title={gradeTable.year ? `Public School Enrollment By Grade, ${formatSchoolYear(gradeTable.year)}` : 'Public School Enrollment By Grade'}
            shortTitle={gradeTable.year ? `Public School Enrollment By Grade, ${shortYear(gradeTable.year)}` : undefined}
            columns={[
              { key: 'grade', label: 'Grade' },
              { key: 'students', label: 'Students', align: 'right', format: row => formatCount(row.students) },
              { key: 'earlier', label: `In ${compareText}`, align: 'right', format: row => formatCount(row.earlier), hideOnPhone: true },
              { key: 'change', label: `Change Since ${compareText}`, shortLabel: `% Since ${shortYear(SINCE_YEAR)}`, align: 'right', format: row => formatSignedPercent(row.change) },
            ]}
            rows={gradeTable.rows}
            totalRow={gradeTable.rows.length ? gradeTotals : undefined}
          />
        </Box>
      </Box>
    </StatePage>
  );
};

export default StateEnrollment;
