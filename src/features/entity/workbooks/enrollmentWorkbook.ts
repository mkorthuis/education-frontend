import { Measurement } from '@/store/slices/measurementSlice';
import {
  ENROLLMENT_MEASUREMENT_TYPES,
  ENROLLMENT_MEASUREMENT_TYPE_NAMES,
  ENROLLMENT_MEASUREMENT_TYPE_ORDER,
} from '@/features/district/utils/enrollmentDataProcessing';
import { COUNT, ExcelSheet, ExcelValue, notesSheet } from '@/features/state/utils/excel';
import { formatSchoolYear } from '@/features/state/utils/stateMetrics';
import { EnrollmentRow, GRADE_IDS, projectEnrollment } from '@/utils/enrollmentProjection';
import { entityTitle } from '../excel';

// Students by grade, from a town's or a school's rows; the grade's own name names any grade the
// page's tables don't list (preschool)
export interface GradeEnrollmentRow extends EnrollmentRow {
  grade?: { id: number; name: string };
}

export interface DistrictEnrollmentData {
  name: string;
  displayName: string;
  towns: { id: number; name: string }[];
  townEnrollment: (GradeEnrollmentRow & { town_id: number })[];
  measurements: Measurement[];
}

export interface SchoolEnrollmentData {
  name: string;
  displayName: string;
  /** The grades the school offers, as the projection's rules take them */
  gradeIds: number[];
  enrollment: GradeEnrollmentRow[];
}

// Projections to 2 places, as the page shows them
const PROJECTED = '#,##0.00';
// As far ahead as the page's projection picker goes
const PROJECTED_YEARS = 15;

const GRADE_NAMES: Record<number, string> = {
  1: 'Preschool',
  [GRADE_IDS.KINDERGARTEN]: 'Kindergarten',
  ...Object.fromEntries(Array.from({ length: 12 }, (_, n) => [GRADE_IDS.GRADE_1 + n, `Grade ${n + 1}`])),
};
const gradeName = (gradeId: number, rows: GradeEnrollmentRow[]) =>
  GRADE_NAMES[gradeId] ?? rows.find(row => row.grade_id === gradeId)?.grade?.name ?? `Grade ID ${gradeId}`;

const yearsIn = (rows: { year: number }[]) => [...new Set(rows.map(row => row.year))].sort((a, b) => a - b);
const sumOf = (rows: EnrollmentRow[]) => rows.reduce((sum, row) => sum + (row.enrollment || 0), 0);
const round2 = (value: number | undefined): ExcelValue => (typeof value === 'number' ? Number(value.toFixed(2)) : null);

/** Every grade (rows) by every year (columns), with each year's total under them */
const byGradeSheet = (name: string, title: string, subtitle: string, rows: GradeEnrollmentRow[]): ExcelSheet => {
  const years = yearsIn(rows);
  const gradeIds = [...new Set(rows.map(row => row.grade_id))].sort((a, b) => a - b);
  const count = (year: number, gradeId?: number) => {
    const matching = rows.filter(row => row.year === year && (gradeId === undefined || row.grade_id === gradeId));
    return matching.length ? sumOf(matching) : null;
  };
  return {
    name,
    title,
    subtitle,
    columns: [{ header: 'Grade', width: 16 }, ...years.map(year => ({ header: formatSchoolYear(year), format: COUNT }))],
    rows: gradeIds.map(gradeId => [gradeName(gradeId, rows), ...years.map(year => count(year, gradeId))]),
    totalRow: years.length ? ['All Grades', ...years.map(year => count(year))] : undefined,
  };
};

/**
 * The page's projection at its default years (the latest five years of changes, from the latest
 * year) for every year its picker offers: K and grade 1 at their averages, each later grade the
 * grade below plus its average change. `supportedGrades` is null for a district, or the school's
 * grades (see projectEnrollment).
 */
const projectionSheet = (title: string, rows: EnrollmentRow[], gradeIds: number[], supportedGrades: number[] | null): ExcelSheet => {
  const years = yearsIn(rows);
  const endYear = years[years.length - 1] ?? 0;
  const startYear = Math.max(endYear - 5, years[0] ?? 0);
  const futureYears = Array.from({ length: PROJECTED_YEARS }, (_, n) => endYear + n + 1);
  const projections = futureYears.map(futureYear => projectEnrollment(rows, { startYear, endYear, futureYear }, supportedGrades));
  const first = projections[0];
  // As the page's table reads each grade: the averages for K and grade 1
  const projected = (projection: typeof first, gradeId: number) => {
    if (gradeId === GRADE_IDS.KINDERGARTEN) return round2(projection.avgKClass);
    if (gradeId === GRADE_IDS.GRADE_1) return round2(projection.avgG1Class);
    return round2(projection.projectedClassSizes[gradeId]);
  };
  return {
    name: 'Enrollment Projection',
    title,
    subtitle: years.length
      ? `Projected from the average changes ${formatSchoolYear(startYear)} to ${formatSchoolYear(endYear)}, the page's default years`
      : undefined,
    columns: [
      { header: 'Grade', width: 16 },
      { header: `Current (${formatSchoolYear(endYear)})`, width: 16, format: COUNT },
      ...futureYears.map(year => ({ header: `Projected ${formatSchoolYear(year)}`, width: 14, format: PROJECTED })),
    ],
    rows: years.length
      ? gradeIds.map(gradeId => [GRADE_NAMES[gradeId], first.currentSum(gradeId), ...projections.map(projection => projected(projection, gradeId))])
      : [],
    totalRow: years.length
      ? ['Total Students', first.currentTotalEnrollment, ...projections.map(projection => round2(projection.projectedTotalEnrollment))]
      : undefined,
  };
};

const PROJECTION_NOTE = 'The projection uses the page\'s default years: the average changes over the latest five years, from the latest year. Kindergarten and grade 1 are projected at their average class sizes; each later grade is the grade below\'s size the year before plus the average change as students move up. Each projected year carries the one before it forward. Choose other years on the page to project from a different range.';

// The district profile's shares, as the page's table shows them: 10% or less as "<10%", 90% or
// more as ">90%" (the state reports only that), otherwise the share
const groupShare = (value: number | undefined): ExcelValue => {
  if (value === undefined) return null;
  if (value <= 10) return '<10%';
  if (value >= 90) return '>90%';
  return value / 100;
};

const schoolEnrollmentSheet = (measurements: Measurement[]): ExcelSheet => {
  const years = [...new Set(measurements.map(item => parseInt(item.year)))].sort((a, b) => a - b);
  const value = (year: number, typeId: number) =>
    measurements.find(item => parseInt(item.year) === year && Number(item.measurement_type?.id) === typeId)?.value;
  const groups = ENROLLMENT_MEASUREMENT_TYPE_ORDER.filter(typeId => typeId !== ENROLLMENT_MEASUREMENT_TYPES.TOTAL_ENROLLMENT);
  return {
    name: 'District School Enrollment',
    title: 'District School Enrollment By Category',
    subtitle: 'Students enrolled in the district\'s schools, and the share and estimated number in each group',
    columns: [
      { header: 'School Year', width: 12 },
      { header: 'Total Enrollment', width: 14, format: COUNT },
      ...groups.flatMap(typeId => [
        { header: `${ENROLLMENT_MEASUREMENT_TYPE_NAMES[typeId]} (%)`, width: 18, format: '0.0%' },
        { header: `${ENROLLMENT_MEASUREMENT_TYPE_NAMES[typeId]} (Students, Est.)`, width: 18, format: COUNT },
      ]),
    ],
    rows: years.map(year => {
      const total = value(year, ENROLLMENT_MEASUREMENT_TYPES.TOTAL_ENROLLMENT);
      return [
        formatSchoolYear(year),
        total ?? null,
        ...groups.flatMap(typeId => {
          const share = groupShare(value(year, typeId));
          // The chart's estimate: the share of the total, where the share is known
          return [share, typeof share === 'number' && typeof total === 'number' ? Math.round(share * total) : null];
        }),
      ];
    }),
  };
};

/**
 * The district Enrollment page as one workbook: students living in the district's towns by year and
 * town, and by grade, the page's projection, and the students in the district's schools by group.
 */
export const districtEnrollmentWorkbook = (data: DistrictEnrollmentData): ExcelSheet[] => {
  const title = entityTitle('district', data.name);
  const oneTown = data.towns.length === 1 ? data.towns[0] : undefined;
  const years = yearsIn(data.townEnrollment);
  const townTotal = (year: number, townId?: number) => {
    const rows = data.townEnrollment.filter(row => row.year === year && (townId === undefined || row.town_id === townId));
    return rows.length ? sumOf(rows) : null;
  };
  return [
    {
      name: 'Students in District Towns',
      title: 'Students Living in the District\'s Towns',
      subtitle: '# of students, all grades, by the town they live in',
      columns: [
        { header: 'School Year', width: 12 },
        { header: oneTown ? oneTown.name : 'All Towns', width: 14, format: COUNT },
        ...(oneTown ? [] : data.towns.map(town => ({ header: town.name, width: 14, format: COUNT }))),
      ],
      rows: years.map(year => [formatSchoolYear(year), townTotal(year), ...(oneTown ? [] : data.towns.map(town => townTotal(year, town.id)))]),
    },
    byGradeSheet(
      'Town Students By Grade',
      oneTown ? `${oneTown.name} Students By Grade` : 'All District Towns Students By Grade',
      `# of students living in ${oneTown ? oneTown.name : 'the district\'s towns'}, by grade and year`,
      data.townEnrollment,
    ),
    projectionSheet(
      oneTown ? `Enrollment Projection For ${oneTown.name}` : 'Enrollment Projection For All Towns',
      data.townEnrollment,
      Object.values(GRADE_IDS),
      null,
    ),
    schoolEnrollmentSheet(data.measurements),
    notesSheet(`${data.displayName} for ${title}`, [
      'Sources: NH Department of Education town enrollment by grade (students by the town they live in), and the district profile\'s enrollment and shares of students who are economically disadvantaged, English language learners or have a disability.',
      'Students living in the district\'s towns and students enrolled in the district\'s schools often differ: many districts send students to, or take students from, other districts, especially in rural areas and the higher grades. Town counts include students attending school out of state and parent-paid students.',
      'Where the state reports a group\'s share only as under 10% or over 90%, the sheet shows "<10%" or ">90%" and no estimated number. Estimated numbers are the share of total enrollment, rounded.',
      PROJECTION_NOTE,
    ]),
  ];
};

/** The school Enrollment page as one workbook: students by year and by grade, and the page's projection. */
export const schoolEnrollmentWorkbook = (data: SchoolEnrollmentData): ExcelSheet[] => {
  const years = yearsIn(data.enrollment);
  return [
    {
      name: 'Students By Year',
      title: 'Current Students',
      subtitle: '# of students enrolled in the school, all grades',
      columns: [
        { header: 'School Year', width: 12 },
        { header: 'Total Students', width: 14, format: COUNT },
      ],
      rows: years.map(year => [formatSchoolYear(year), sumOf(data.enrollment.filter(row => row.year === year))]),
    },
    byGradeSheet('Students By Grade', 'Students By Grade', '# of students enrolled in the school, by grade and year', data.enrollment),
    projectionSheet(
      'Enrollment Projections',
      data.enrollment,
      Object.values(GRADE_IDS).filter(gradeId => data.gradeIds.includes(gradeId)),
      data.gradeIds,
    ),
    notesSheet(`${data.displayName} for ${entityTitle('school', data.name)}`, [
      'Source: NH Department of Education enrollment by school and grade.',
      PROJECTION_NOTE,
    ]),
  ];
};
