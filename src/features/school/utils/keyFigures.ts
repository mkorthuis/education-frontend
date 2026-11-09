import {
  formatCount,
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
import { formatThousands, shortYear, tileDelta } from '@/features/state/utils/phrases';
import { Comparison, comparison, noteLines, plansUnknownNote, subjectTileModel, TileGroupModel, TileModel } from '@/features/entity/overview/tileModels';

// A school's key figures and the overview's tiles for them, from the API's rows. Plain functions:
// the overview (useSchoolKeyFigures) and the pages written at build time (src/seo) both use them.

interface Results {
  math: YearValue[];
  reading: YearValue[];
  science: YearValue[];
  graduation: YearValue[];
  college: YearValue[];
}

export interface SchoolKeyFigures {
  /** Students enrolled in the school, all grades (October 1) */
  students: YearValue[];
  math: SubjectFigures;
  reading: SubjectFigures;
  science: SubjectFigures;
  graduation: YearValue[];
  college: YearValue[];
  /** Graduates whose plans the school didn't report, as a share of all its graduates */
  plansUnknown: YearValue[];
  district: Results;
  state: Results;
}

type Cohorts = Parameters<typeof graduationRates>[0];
type Plans = Parameters<typeof postGraduationShares>[0];

/** The API's rows the figures come from: the school's, its district's and the state's */
export interface SchoolFigureRows {
  enrollment: { year: number; enrollment: number }[];
  /** Test results for all students */
  tests: StoredAssessmentRow[];
  cohorts: Cohorts;
  plans: Plans;
  district: { tests: StoredAssessmentRow[]; cohorts: Cohorts; plans: Plans };
  state: { tests: StoredAssessmentRow[]; cohorts: Cohorts; plans: Plans };
}

const results = ({ tests, cohorts, plans }: SchoolFigureRows['state']): Results => {
  const shares = proficiencyBySubject(normalizeAssessmentRows(tests));
  return {
    math: toSeries(shares, row => row.math),
    reading: toSeries(shares, row => row.reading),
    science: toSeries(shares, row => row.science),
    graduation: toSeries(graduationRates(cohorts), row => row.graduated),
    college: toSeries(postGraduationShares(plans), row => row.college),
  };
};

export const schoolKeyFigures = (rows: SchoolFigureRows): SchoolKeyFigures => {
  const schoolTestRows = normalizeAssessmentRows(rows.tests);
  const planShares = postGraduationShares(rows.plans);
  return {
    students: totalsByYear(rows.enrollment, row => row.enrollment),
    math: subjectFigures(schoolTestRows, 'math'),
    reading: subjectFigures(schoolTestRows, 'reading'),
    science: subjectFigures(schoolTestRows, 'science'),
    graduation: toSeries(graduationRates(rows.cohorts), row => row.graduated),
    college: toSeries(planShares, row => row.college),
    plansUnknown: toSeries(planShares, row => row.Unknown ?? 0),
    district: results(rows.district),
    state: results(rows.state),
  };
};

/**
 * Whether the district's figures are compared: its test scores when it has other schools, its
 * graduation when it has another high school (otherwise they'd be this school's own figures again)
 */
export interface SchoolComparisons {
  compareDistrict: boolean;
  compareDistrictGraduation: boolean;
}

/** The overview's tiles (one untitled group), each only when the school has the figure */
export const schoolTileGroups = (figures: SchoolKeyFigures, { compareDistrict, compareDistrictGraduation }: SchoolComparisons): TileGroupModel[] => {
  // The district's figure, where it isn't just this school's, and the state's, for each result
  const others = (key: keyof SchoolKeyFigures['state']): Comparison[] => {
    const graduation = key === 'graduation' || key === 'college';
    return [
      ...((graduation ? compareDistrictGraduation : compareDistrict) ? [{ label: 'District', series: figures.district[key] }] : []),
      { label: 'Statewide', series: figures.state[key] },
    ];
  };
  // Those places' figures for the year, as note lines: "District 41%", "Statewide 44%"
  const compared = (key: keyof SchoolKeyFigures['state'], year: number, format: (value: number) => string) =>
    others(key).map(other => comparison(other.label, other.series, year, format));
  const latest = {
    students: latestPoint(figures.students),
    graduation: latestPoint(figures.graduation),
    college: latestPoint(figures.college),
  };
  const unknownPlans = latest.college ? plansUnknownNote(figures.plansUnknown, latest.college.year) : undefined;

  const tiles: (TileModel | null)[] = [
    latest.students && {
      key: 'students',
      label: 'Students',
      value: formatCount(latest.students.value),
      // Phones shorten only large counts: 12K, not 0.3K
      shortValue: latest.students.value >= 10000 ? formatThousands(latest.students.value) : undefined,
      period: shortYear(latest.students.year),
      delta: tileDelta(tileChange(figures.students), { unit: 'percent', higherIsBetter: true }),
      trend: tileTrend(figures.students),
      page: 'enrollment',
      linkLabel: 'enrollment',
    },
    subjectTileModel('Proficient in Math', figures.math, others('math'), 'academic'),
    subjectTileModel('Proficient in Reading', figures.reading, others('reading'), 'academic'),
    subjectTileModel('Proficient in Science', figures.science, others('science'), 'academic'),
    latest.graduation && {
      key: 'graduation',
      label: 'Four-Year Graduation Rate',
      shortLabel: 'Graduation Rate',
      value: formatPercent(latest.graduation.value, 1),
      // By school year like the other tiles: the class of 2025 graduated in 24/25
      period: shortYear(latest.graduation.year),
      delta: tileDelta(tileChange(figures.graduation), { unit: 'points', higherIsBetter: true }),
      detail: noteLines(...compared('graduation', latest.graduation.year, value => formatPercent(value, 1))),
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
      delta: tileDelta(tileChange(figures.college), { unit: 'points', higherIsBetter: true }),
      detail: noteLines(...compared('college', latest.college.year, value => formatPercent(value)), unknownPlans?.full),
      shortDetail: unknownPlans?.short,
      trend: tileTrend(figures.college),
      page: 'outcomes',
      linkLabel: "graduates' plans",
    },
  ];
  const kept = tiles.filter((tile): tile is TileModel => Boolean(tile));
  return kept.length ? [{ tiles: kept }] : [];
};
