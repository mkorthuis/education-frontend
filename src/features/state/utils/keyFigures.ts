import type { StateEnrollmentByTypeData } from '@/services/api/endpoints/enrollments';
import type { TileGroupModel, TileModel } from '@/features/entity/overview/tileModels';
import {
  ALL_STUDENTS_SUBGROUP_ID,
  describeChange,
  efaTotals,
  formatCount,
  formatDollars,
  formatPercent,
  graduationRates,
  latestPoint,
  NamedAssessmentRow,
  postGraduationShares,
  proficiencyBySubject,
  publicStudents,
  tileChange,
  tileTrend,
  toSeries,
  YearValue,
} from './stateMetrics';
import { capitalize, formatDollarsShort, formatThousands, realPercentChange, shortYear, tileDelta } from './phrases';

// The statewide overview's key figures and tiles, from the API's rows. Plain functions: the overview
// and the pages written at build time (src/seo) both use them.

/** The API's statewide rows the figures come from */
export interface StateFigureRows {
  /** October 1 enrollment by type of school and grade */
  enrollmentByType: StateEnrollmentByTypeData[];
  perPupil: { year: number; total: number }[];
  /** Total school district spending */
  rollups: { year: number; total: number }[];
  staff: { year: number; value: number; staff_type: { name: string } }[];
  salary: { year: number; salary: number }[];
  /** Test results, normalized (normalizeAssessmentRows) */
  assessments: NamedAssessmentRow[];
  cohorts: Parameters<typeof graduationRates>[0];
  plans: Parameters<typeof postGraduationShares>[0];
  efaEntries: Parameters<typeof efaTotals>[0];
  efaEntryTypes: Parameters<typeof efaTotals>[1];
  /** Public schools and the districts running them, by year */
  schoolCounts: { year: number; schools: number; districts: number }[];
}

export interface StateKeyFigures {
  students: YearValue[];
  perPupil: YearValue[];
  spending: YearValue[];
  teachers: YearValue[];
  salary: YearValue[];
  math: YearValue[];
  reading: YearValue[];
  graduation: YearValue[];
  college: YearValue[];
  efaStudents: YearValue[];
  districts: YearValue[];
  schools: YearValue[];
}

export const stateKeyFigures = (rows: StateFigureRows): StateKeyFigures => {
  // Proficiency compares with 2014-15 like the other tiles, across the 2017-18 change of state test
  const proficiency = proficiencyBySubject(rows.assessments, ALL_STUDENTS_SUBGROUP_ID);
  return {
    // Students: October 1 enrollment in every public school, the latest count
    students: publicStudents(rows.enrollmentByType),
    perPupil: toSeries(rows.perPupil, row => row.total),
    spending: toSeries(rows.rollups, row => row.total),
    teachers: toSeries(rows.staff.filter(row => row.staff_type.name === 'Teacher'), row => row.value),
    salary: toSeries(rows.salary, row => row.salary),
    math: toSeries(proficiency, row => row.math),
    reading: toSeries(proficiency, row => row.reading),
    graduation: toSeries(graduationRates(rows.cohorts), row => row.graduated),
    college: toSeries(postGraduationShares(rows.plans), row => row.college),
    efaStudents: toSeries(efaTotals(rows.efaEntries, rows.efaEntryTypes), row => row.students),
    districts: toSeries(rows.schoolCounts, row => row.districts),
    schools: toSeries(rows.schoolCounts, row => row.schools),
  };
};

// The change after inflation, the only note the dollar tiles carry
const afterInflation = (change: ReturnType<typeof tileChange>) =>
  change ? `${capitalize(describeChange(realPercentChange(change)))} after inflation` : undefined;

/**
 * The overview's three tile groups, Schools, Financials and Results, each tile only when there's the
 * figure. A tile's page is a statewide page's key, or "districts" or "schools" for the lists of them.
 */
export const stateTileGroups = (figures: StateKeyFigures): TileGroupModel[] => {
  const latest = {
    students: latestPoint(figures.students),
    perPupil: latestPoint(figures.perPupil),
    spending: latestPoint(figures.spending),
    teachers: latestPoint(figures.teachers),
    salary: latestPoint(figures.salary),
    math: latestPoint(figures.math),
    reading: latestPoint(figures.reading),
    graduation: latestPoint(figures.graduation),
    college: latestPoint(figures.college),
    efaStudents: latestPoint(figures.efaStudents),
    districts: latestPoint(figures.districts),
    schools: latestPoint(figures.schools),
  };
  const changes = {
    students: tileChange(figures.students),
    perPupil: tileChange(figures.perPupil),
    spending: tileChange(figures.spending),
    teachers: tileChange(figures.teachers),
    salary: tileChange(figures.salary),
    math: tileChange(figures.math),
    reading: tileChange(figures.reading),
    graduation: tileChange(figures.graduation),
    college: tileChange(figures.college),
    efaStudents: tileChange(figures.efaStudents),
    districts: tileChange(figures.districts),
    schools: tileChange(figures.schools),
  };
  const kept = (tiles: (TileModel | null)[]) => tiles.filter((tile): tile is TileModel => Boolean(tile));

  const schools = kept([
    latest.students && {
      key: 'students',
      label: 'Students',
      value: formatCount(latest.students.value),
      shortValue: formatThousands(latest.students.value),
      period: shortYear(latest.students.year),
      delta: tileDelta(changes.students, { unit: 'percent', higherIsBetter: true }),
      trend: tileTrend(figures.students),
      page: 'enrollment',
      linkLabel: 'enrollment',
    },
    latest.teachers && {
      key: 'teachers',
      label: 'Teachers',
      value: formatCount(latest.teachers.value),
      period: shortYear(latest.teachers.year),
      delta: tileDelta(changes.teachers, { unit: 'percent', higherIsBetter: true }),
      trend: tileTrend(figures.teachers),
      page: 'staff',
      linkLabel: 'staffing',
    },
    latest.districts && {
      key: 'districts',
      label: 'School Districts',
      value: formatCount(latest.districts.value),
      period: shortYear(latest.districts.year),
      delta: tileDelta(changes.districts, { unit: 'percent', higherIsBetter: true }),
      detail: `${formatCount(latest.districts.value)} run their own schools`,
      shortDetail: `${formatCount(latest.districts.value)} run schools`,
      trend: tileTrend(figures.districts),
      page: 'districts',
      linkLabel: 'all districts',
    },
    latest.schools && {
      key: 'schools',
      label: 'Public Schools',
      value: formatCount(latest.schools.value),
      period: shortYear(latest.schools.year),
      delta: tileDelta(changes.schools, { unit: 'percent', higherIsBetter: true }),
      detail: 'K-12, not counting charter schools',
      shortDetail: 'excl. charter',
      trend: tileTrend(figures.schools),
      page: 'schools',
      linkLabel: 'all schools',
    },
  ]);

  const financials = kept([
    latest.perPupil && {
      key: 'perPupil',
      label: 'Cost per Student',
      value: formatDollars(latest.perPupil.value),
      shortValue: `$${formatThousands(latest.perPupil.value)}`,
      period: shortYear(latest.perPupil.year),
      delta: tileDelta(changes.perPupil, { unit: 'percent', higherIsBetter: false }),
      detail: afterInflation(changes.perPupil),
      trend: tileTrend(figures.perPupil),
      page: 'financials',
      linkLabel: 'spending',
    },
    latest.spending && {
      key: 'spending',
      label: 'Total School District Spending',
      shortLabel: 'Total Spending',
      value: formatDollarsShort(latest.spending.value),
      shortValue: formatDollarsShort(latest.spending.value, 1),
      period: shortYear(latest.spending.year),
      delta: tileDelta(changes.spending, { unit: 'percent', higherIsBetter: false }),
      detail: afterInflation(changes.spending),
      trend: tileTrend(figures.spending),
      page: 'financials',
      linkLabel: 'spending',
    },
    latest.salary && {
      key: 'salary',
      label: 'Average Teacher Salary',
      shortLabel: 'Avg Teacher Salary',
      value: formatDollars(latest.salary.value),
      shortValue: `$${formatThousands(latest.salary.value)}`,
      period: shortYear(latest.salary.year),
      delta: tileDelta(changes.salary, { unit: 'percent', higherIsBetter: true }),
      detail: afterInflation(changes.salary),
      trend: tileTrend(figures.salary),
      page: 'staff',
      linkLabel: 'teacher pay',
    },
    latest.efaStudents && {
      key: 'efa',
      label: 'Education Freedom Accounts',
      shortLabel: "EFA's",
      value: formatCount(latest.efaStudents.value),
      shortValue: formatThousands(latest.efaStudents.value, 1),
      period: shortYear(latest.efaStudents.year),
      delta: tileDelta(changes.efaStudents, { unit: 'percent', higherIsBetter: true }),
      trend: figures.efaStudents,
      page: 'efa',
      linkLabel: 'EFAs',
    },
  ]);

  const results = kept([
    latest.math && {
      key: 'math',
      label: 'Proficient in Math',
      value: formatPercent(latest.math.value),
      period: shortYear(latest.math.year),
      delta: tileDelta(changes.math, { unit: 'points', higherIsBetter: true }),
      trend: figures.math,
      page: 'academic',
      linkLabel: 'test scores',
    },
    latest.reading && {
      key: 'reading',
      label: 'Proficient in Reading',
      value: formatPercent(latest.reading.value),
      period: shortYear(latest.reading.year),
      delta: tileDelta(changes.reading, { unit: 'points', higherIsBetter: true }),
      trend: figures.reading,
      page: 'academic',
      linkLabel: 'test scores',
    },
    latest.graduation && {
      key: 'graduation',
      label: 'Four-Year Graduation Rate',
      shortLabel: 'Graduation Rate',
      value: formatPercent(latest.graduation.value, 1),
      // By school year like the other tiles: the class of 2025 graduated in 24/25
      period: shortYear(latest.graduation.year),
      delta: tileDelta(changes.graduation, { unit: 'points', higherIsBetter: true }),
      trend: tileTrend(figures.graduation),
      page: 'outcomes',
      linkLabel: 'graduation',
    },
    latest.college && {
      key: 'college',
      label: 'Planning to Attend College',
      shortLabel: 'Planning College',
      value: formatPercent(latest.college.value),
      period: shortYear(latest.college.year),
      delta: tileDelta(changes.college, { unit: 'points', higherIsBetter: true }),
      trend: tileTrend(figures.college),
      page: 'outcomes',
      linkLabel: "graduates' plans",
    },
  ]);

  // All three, even empty, as the overview lays them out by position
  return [
    { title: 'Schools', tiles: schools },
    { title: 'Financials', tiles: financials },
    { title: 'Results', tiles: results },
  ];
};
