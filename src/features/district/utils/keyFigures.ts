import {
  Change,
  describeChange,
  efaTotals,
  formatCount,
  formatDollars,
  formatPercent,
  graduationRates,
  latestPoint,
  normalizeAssessmentRows,
  postGraduationShares,
  proficiencyBySubject,
  StoredAssessmentRow,
  SubjectFigures,
  subjectFigures,
  tileChange,
  tileTrend,
  toSeries,
  totalsByYear,
  YearValue,
} from '@/features/state/utils/stateMetrics';
import { capitalize, formatThousands, realPercentChange, shortYear, tileDelta } from '@/features/state/utils/phrases';
import { comparison, noteLines, plansUnknownNote, subjectTileModel, TileGroupModel, TileModel } from '@/features/entity/overview/tileModels';

// A district's key figures and the overview's tiles for them, from the API's rows. Plain functions:
// the overview (useDistrictKeyFigures) and the pages written at build time (src/seo) both use them.

export interface DistrictKeyFigures {
  /** Public school students living in the district's towns (October 1) */
  students: YearValue[];
  perPupil: YearValue[];
  salary: YearValue[];
  efaStudents: YearValue[];
  math: SubjectFigures;
  reading: SubjectFigures;
  graduation: YearValue[];
  college: YearValue[];
  /** Graduates whose plans the district didn't report, as a share of all its graduates */
  plansUnknown: YearValue[];
  state: {
    perPupil: YearValue[];
    salary: YearValue[];
    math: YearValue[];
    reading: YearValue[];
    graduation: YearValue[];
    college: YearValue[];
  };
}

/** The API's rows the figures come from: the district's, and the state's to compare */
export interface DistrictFigureRows {
  townEnrollment: { year: number; enrollment: number }[];
  perPupil: { year: number; total: number }[];
  salary: { year: number; salary: number }[];
  efaEntries: Parameters<typeof efaTotals>[0];
  efaEntryTypes: Parameters<typeof efaTotals>[1];
  /** Test results for all students */
  assessments: StoredAssessmentRow[];
  cohorts: Parameters<typeof graduationRates>[0];
  plans: Parameters<typeof postGraduationShares>[0];
  state: {
    perPupil: { year: number; total: number }[];
    salary: { year: number; salary: number }[];
    assessments: StoredAssessmentRow[];
    cohorts: Parameters<typeof graduationRates>[0];
    plans: Parameters<typeof postGraduationShares>[0];
  };
}

export const districtKeyFigures = (rows: DistrictFigureRows): DistrictKeyFigures => {
  const districtTests = normalizeAssessmentRows(rows.assessments);
  const stateTests = proficiencyBySubject(normalizeAssessmentRows(rows.state.assessments));
  const planShares = postGraduationShares(rows.plans);
  return {
    students: totalsByYear(rows.townEnrollment, row => row.enrollment),
    perPupil: toSeries(rows.perPupil, row => row.total),
    salary: toSeries(rows.salary, row => row.salary),
    efaStudents: toSeries(efaTotals(rows.efaEntries, rows.efaEntryTypes), row => row.students),
    math: subjectFigures(districtTests, 'math'),
    reading: subjectFigures(districtTests, 'reading'),
    graduation: toSeries(graduationRates(rows.cohorts), row => row.graduated),
    college: toSeries(planShares, row => row.college),
    plansUnknown: toSeries(planShares, row => row.Unknown ?? 0),
    state: {
      perPupil: toSeries(rows.state.perPupil, row => row.total),
      salary: toSeries(rows.state.salary, row => row.salary),
      math: toSeries(stateTests, row => row.math),
      reading: toSeries(stateTests, row => row.reading),
      graduation: toSeries(graduationRates(rows.state.cohorts), row => row.graduated),
      college: toSeries(postGraduationShares(rows.state.plans), row => row.college),
    },
  };
};

export const DISTRICT_TILE_GROUPS = ['Students and Spending', 'Results'];

/** A dollar tile's note: the state's figure and, as on the statewide tiles, the change after inflation */
const dollarNote = (state: string | undefined, change: Change | null) =>
  noteLines(state, change ? `${capitalize(describeChange(realPercentChange(change)))} after inflation` : undefined);

/** The overview's tiles, in its two groups, each only when the district has the figure */
export const districtTileGroups = (figures: DistrictKeyFigures, towns: { name: string }[]): TileGroupModel[] => {
  const statewide = (series: YearValue[], year: number, format: (value: number) => string) => comparison('Statewide', series, year, format);
  const latest = {
    students: latestPoint(figures.students),
    perPupil: latestPoint(figures.perPupil),
    salary: latestPoint(figures.salary),
    efaStudents: latestPoint(figures.efaStudents),
    graduation: latestPoint(figures.graduation),
    college: latestPoint(figures.college),
  };
  const changes = {
    students: tileChange(figures.students),
    perPupil: tileChange(figures.perPupil),
    salary: tileChange(figures.salary),
    efaStudents: tileChange(figures.efaStudents),
    graduation: tileChange(figures.graduation),
    college: tileChange(figures.college),
  };
  const unknownPlans = latest.college ? plansUnknownNote(figures.plansUnknown, latest.college.year) : undefined;
  const livingIn = towns.length === 1 ? `living in ${towns[0].name}` : `living in its ${towns.length} towns`;

  const studentsAndSpending: (TileModel | null)[] = [
    latest.students && {
      key: 'students',
      label: 'Students',
      value: formatCount(latest.students.value),
      // Phones shorten only large counts: 12K, not 0.3K
      shortValue: latest.students.value >= 10000 ? formatThousands(latest.students.value) : undefined,
      period: shortYear(latest.students.year),
      delta: tileDelta(changes.students, { unit: 'percent', higherIsBetter: true }),
      detail: `Public school students ${livingIn}`,
      shortDetail: capitalize(livingIn),
      trend: tileTrend(figures.students),
      page: 'enrollment',
      linkLabel: 'enrollment',
    },
    latest.perPupil && {
      key: 'perPupil',
      label: 'Cost per Student',
      value: formatDollars(latest.perPupil.value),
      shortValue: `$${formatThousands(latest.perPupil.value)}`,
      period: shortYear(latest.perPupil.year),
      delta: tileDelta(changes.perPupil, { unit: 'percent', higherIsBetter: false }),
      detail: dollarNote(statewide(figures.state.perPupil, latest.perPupil.year, formatDollars), changes.perPupil),
      shortDetail: statewide(figures.state.perPupil, latest.perPupil.year, value => `$${formatThousands(value)}`),
      trend: tileTrend(figures.perPupil),
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
      detail: dollarNote(statewide(figures.state.salary, latest.salary.year, formatDollars), changes.salary),
      shortDetail: statewide(figures.state.salary, latest.salary.year, value => `$${formatThousands(value)}`),
      trend: tileTrend(figures.salary),
      page: 'staff',
      linkLabel: 'teacher pay',
    },
    latest.efaStudents && {
      key: 'efa',
      label: 'Education Freedom Accounts',
      shortLabel: "EFA's",
      value: formatCount(latest.efaStudents.value),
      period: shortYear(latest.efaStudents.year),
      delta: tileDelta(changes.efaStudents, { unit: 'percent', higherIsBetter: true }),
      detail: `Students ${livingIn}`,
      shortDetail: capitalize(livingIn),
      trend: figures.efaStudents,
      page: 'efa',
      linkLabel: 'EFAs',
    },
  ];

  const results: (TileModel | null)[] = [
    subjectTileModel('Proficient in Math', figures.math, [{ label: 'Statewide', series: figures.state.math }], 'academic'),
    subjectTileModel('Proficient in Reading', figures.reading, [{ label: 'Statewide', series: figures.state.reading }], 'academic'),
    latest.graduation && {
      key: 'graduation',
      label: 'Four-Year Graduation Rate',
      shortLabel: 'Graduation Rate',
      value: formatPercent(latest.graduation.value, 1),
      // By school year like the other tiles: the class of 2025 graduated in 24/25
      period: shortYear(latest.graduation.year),
      delta: tileDelta(changes.graduation, { unit: 'points', higherIsBetter: true }),
      detail: statewide(figures.state.graduation, latest.graduation.year, value => formatPercent(value, 1)),
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
      detail: noteLines(statewide(figures.state.college, latest.college.year, value => formatPercent(value)), unknownPlans?.full),
      shortDetail: unknownPlans?.short,
      trend: tileTrend(figures.college),
      page: 'outcomes',
      linkLabel: "graduates' plans",
    },
  ];

  return [
    { title: DISTRICT_TILE_GROUPS[0], tiles: studentsAndSpending.filter((tile): tile is TileModel => Boolean(tile)) },
    { title: DISTRICT_TILE_GROUPS[1], tiles: results.filter((tile): tile is TileModel => Boolean(tile)) },
  ].filter(group => group.tiles.length > 0);
};
