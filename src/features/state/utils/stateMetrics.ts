import { calculateInflationAdjustedAmount } from '@/utils/calculations';
import type { StateEnrollmentByTypeData } from '@/services/api/endpoints/enrollments';

// Statewide figures for the State pages. Every function is pure: it takes the rows the API returns
// and gives chart-ready series (one object per year, oldest first) or single values.

export interface YearValue {
  year: number;
  value: number;
}

export type YearRow = { year: number } & Record<string, number | null>;

export interface Change {
  from: YearValue;
  to: YearValue;
  change: number;
  percentChange: number;
}

export const ALL_STUDENTS_SUBGROUP_ID = 1;

// Assessment subject ids, in display order
export const SUBJECTS = [
  { id: 1, key: 'math', name: 'Math' },
  { id: 2, key: 'reading', name: 'Reading' },
  { id: 3, key: 'science', name: 'Science' },
] as const;

// Years the state changed its test (NECAP to Smarter Balanced, then to the NH SAS); scores before
// and after a change aren't comparable
export const ASSESSMENT_CHANGE_YEARS = [2015, 2018];
// Spring 2020: no state tests were given
export const NO_TEST_YEAR = 2020;
// 2020-21: many schools were remote or hybrid, so attendance, enrollment and safety counts dipped
export const REMOTE_SCHOOL_YEAR = 2021;
// The chart band that marks it
export const REMOTE_BAND = [{ from: REMOTE_SCHOOL_YEAR - 1, to: REMOTE_SCHOOL_YEAR, label: 'COVID' }];

// Figures the state has published as preliminary. Keep in step with the notes on the Data Sources
// page (src/pages/DataSources.tsx).
export const PRELIMINARY = {
  graduationClass: 2025,
  efaYear: 2027,
  efaAsOf: 'August 2, 2026',
};

export const sortByYear = <T extends { year: number }>(rows: T[]): T[] =>
  [...rows].sort((a, b) => a.year - b.year);

export const toSeries = <T extends { year: number }>(rows: T[], value: (row: T) => number | null | undefined): YearValue[] =>
  sortByYear(rows)
    .map(row => ({ year: row.year, value: value(row) }))
    .filter((point): point is YearValue => typeof point.value === 'number' && !isNaN(point.value));

export const latestPoint = (series: YearValue[]): YearValue | null =>
  series.length ? series.reduce((latest, point) => (point.year > latest.year ? point : latest)) : null;

/**
 * Change from `yearsBack` years before the latest point to the latest point. Falls back to the
 * earliest point when the series doesn't go back that far; null with fewer than two points.
 */
export const changeSince = (series: YearValue[], yearsBack: number): Change | null => {
  const to = latestPoint(series);
  if (!to) return null;
  const candidates = series.filter(point => point.year >= to.year - yearsBack && point.year < to.year);
  if (!candidates.length) return null;
  const from = candidates.reduce((earliest, point) => (point.year < earliest.year ? point : earliest));
  const change = to.value - from.value;
  return { from, to, change, percentChange: from.value === 0 ? 0 : (change / from.value) * 100 };
};

/** The change from a given year to the latest, or null when the series doesn't have that year. */
export const changeFrom = (series: YearValue[], fromYear: number): Change | null => {
  const to = latestPoint(series);
  const from = series.find(point => point.year === fromYear);
  if (!to || !from || to.year <= fromYear) return null;
  const change = to.value - from.value;
  return { from, to, change, percentChange: from.value === 0 ? 0 : (change / from.value) * 100 };
};

/** Percent change from `then` to `now`; null when there's nothing (or zero) to compare with. */
export const percentChange = (now: number, then: number | null): number | null =>
  (then ? ((now - then) / then) * 100 : null);

/** A series' value for one year, or null when it has none. */
export const valueIn = (series: YearValue[], year: number): number | null =>
  series.find(point => point.year === year)?.value ?? null;

/** Each value restated in `toYear` dollars. */
export const adjustSeriesForInflation = (series: YearValue[], toYear: number): YearValue[] =>
  series.map(point => ({ year: point.year, value: calculateInflationAdjustedAmount(point.value, point.year, toYear) }));

/** Percent change of each point from the first point at or after `baseYear`, for putting unlike series on one chart. */
export const percentChangeSeries = (series: YearValue[], baseYear: number): YearValue[] => {
  const sorted = sortByYear(series).filter(point => point.year >= baseYear);
  if (!sorted.length || sorted[0].value === 0) return [];
  const base = sorted[0].value;
  return sorted.map(point => ({ year: point.year, value: ((point.value - base) / base) * 100 }));
};

/**
 * Rows for `years` that the data skips, with every key null, so a chart keeps a gap there
 * (e.g. the spring 2020 test year) instead of drawing a line across it.
 */
export const withEmptyYears = (rows: YearRow[], years: number[], keys: string[]): YearRow[] => {
  if (!rows.length) return rows;
  const first = rows[0].year;
  const last = rows[rows.length - 1].year;
  const missing = years.filter(year => year > first && year < last && !rows.some(row => row.year === year));
  const empty = missing.map(year => ({ year, ...Object.fromEntries(keys.map(key => [key, null])) }) as YearRow);
  return sortByYear([...rows, ...empty]);
};

/** Counts as a percentage of enrollment, matching years. */
export const shareOfEnrollment = (counts: YearValue[], enrollment: YearValue[]): YearValue[] => {
  const enrolled = new Map(enrollment.map(point => [point.year, point.value]));
  return counts
    .filter(point => (enrolled.get(point.year) ?? 0) > 0)
    .map(point => ({ year: point.year, value: (point.value / enrolled.get(point.year)!) * 100 }));
};

/** Joins named series into one row per year (a year missing from a series has null there). */
export const mergeSeries = (seriesByKey: Record<string, YearValue[]>): YearRow[] => {
  const rows = new Map<number, YearRow>();
  Object.entries(seriesByKey).forEach(([key, series]) => {
    series.forEach(point => {
      const row = rows.get(point.year) ?? ({ year: point.year } as YearRow);
      row[key] = point.value;
      rows.set(point.year, row);
    });
  });
  const keys = Object.keys(seriesByKey);
  return sortByYear([...rows.values()]).map(row => {
    keys.forEach(key => { if (!(key in row)) row[key] = null; });
    return row;
  });
};

/** Sums rows by year and a category name, giving one row per year with a column per category. */
export const pivotByYear = <T extends { year: number }>(
  rows: T[],
  category: (row: T) => string,
  value: (row: T) => number
): YearRow[] => {
  const byYear = new Map<number, YearRow>();
  const categories = new Set<string>();
  rows.forEach(row => {
    const name = category(row);
    categories.add(name);
    const yearRow = byYear.get(row.year) ?? ({ year: row.year } as YearRow);
    yearRow[name] = ((yearRow[name] as number | undefined) ?? 0) + value(row);
    byYear.set(row.year, yearRow);
  });
  return sortByYear([...byYear.values()]).map(yearRow => {
    categories.forEach(name => { if (!(name in yearRow)) yearRow[name] = null; });
    return yearRow;
  });
};

// ================ Graduation and after ================

export interface GraduationCohortRow {
  year: number;
  cohort_size: number;
  graduate: number;
  earned_hiset: number;
  dropped_out: number;
}

/** Four-year cohort outcomes as percentages of each cohort. */
export const graduationRates = (cohorts: GraduationCohortRow[]): YearRow[] =>
  sortByYear(cohorts)
    .filter(cohort => cohort.cohort_size > 0)
    .map(cohort => ({
      year: cohort.year,
      graduated: (cohort.graduate / cohort.cohort_size) * 100,
      hiset: (cohort.earned_hiset / cohort.cohort_size) * 100,
      droppedOut: (cohort.dropped_out / cohort.cohort_size) * 100,
    }));

export interface PostGraduationRow {
  year: number;
  value: number;
  post_graduation_type: { id: number; name: string };
}

export const COLLEGE_TYPES = ['4 Year College', 'Less 4 Year College'];

/** Each post-graduation plan as a share of that year's reported graduates. */
export const postGraduationShares = (rows: PostGraduationRow[]): YearRow[] => {
  const counts = pivotByYear(rows, row => row.post_graduation_type.name, row => row.value);
  return counts.map(({ year, ...byType }) => {
    const total = Object.values(byType).reduce<number>((sum, count) => sum + (count ?? 0), 0);
    const shares: YearRow = { year };
    Object.entries(byType).forEach(([name, count]) => {
      shares[name] = total > 0 && count !== null ? (count / total) * 100 : null;
    });
    shares.college = total > 0
      ? COLLEGE_TYPES.reduce((sum, name) => sum + ((byType[name] ?? 0) / total) * 100, 0)
      : null;
    return shares;
  });
};

// ================ Assessments ================

export interface AssessmentRow {
  year: number;
  assessment_subgroup_id: number;
  assessment_subject_id: number;
  grade_id: number | null;
  above_proficient_percentage: number | null;
  /** The highest of the four achievement levels ("above proficient" on the district pages) */
  level_4_percentage?: number | null;
}

// Rows as the assessment slice stores them: its enrichment replaces the id fields with the
// related objects (the grade's id may be a string), even though the slice's type still lists the ids.
export interface StoredAssessmentRow {
  year: number;
  above_proficient_percentage: number | null;
  level_4_percentage?: number | null;
  assessment_subgroup_id?: number;
  assessment_subject_id?: number;
  grade_id?: number | null;
  assessment_subgroup?: { id: number } | null;
  assessment_subject?: { id: number } | null;
  grade?: { id: number | string; name: string } | null;
}

export interface NamedAssessmentRow extends AssessmentRow {
  grade_name: string | null;
}

/** Ids back on every row, whichever form the row is in; rows with an unknown subject or subgroup are dropped. */
export const normalizeAssessmentRows = (rows: StoredAssessmentRow[]): NamedAssessmentRow[] =>
  rows
    .map(row => ({
      year: row.year,
      above_proficient_percentage: row.above_proficient_percentage,
      level_4_percentage: row.level_4_percentage ?? null,
      assessment_subgroup_id: row.assessment_subgroup?.id ?? row.assessment_subgroup_id ?? NaN,
      assessment_subject_id: row.assessment_subject?.id ?? row.assessment_subject_id ?? NaN,
      grade_id: row.grade ? Number(row.grade.id) : row.grade_id ?? null,
      grade_name: row.grade?.name ?? null,
    }))
    .filter(row => !isNaN(row.assessment_subgroup_id) && !isNaN(row.assessment_subject_id));

const subjectKey = (subjectId: number) => SUBJECTS.find(subject => subject.id === subjectId)?.key;

/** Percent proficient by year for one subgroup, all grades together, with a column per subject. */
export const proficiencyBySubject = (rows: AssessmentRow[], subgroupId = ALL_STUDENTS_SUBGROUP_ID): YearRow[] => {
  const seriesByKey: Record<string, YearValue[]> = {};
  SUBJECTS.forEach(subject => {
    seriesByKey[subject.key] = toSeries(
      rows.filter(row => row.grade_id === null && row.assessment_subgroup_id === subgroupId && row.assessment_subject_id === subject.id),
      row => row.above_proficient_percentage
    );
  });
  return mergeSeries(seriesByKey);
};

/** The most recent year with any proficiency figure, or null. */
export const latestAssessmentYear = (rows: AssessmentRow[]): number | null => {
  const years = rows.filter(row => row.above_proficient_percentage !== null).map(row => row.year);
  return years.length ? Math.max(...years) : null;
};

export interface ProficiencyTableRow {
  id: number;
  name: string;
  math: number | null;
  reading: number | null;
  science: number | null;
}

const proficiencyRow = (id: number, name: string, rows: AssessmentRow[]): ProficiencyTableRow => {
  const row: ProficiencyTableRow = { id, name, math: null, reading: null, science: null };
  rows.forEach(assessment => {
    const key = subjectKey(assessment.assessment_subject_id);
    if (key) row[key] = assessment.above_proficient_percentage;
  });
  return row;
};

/** One year's percent proficient for each subgroup (all grades), in the order the subgroups are given. */
export const proficiencyBySubgroup = (
  rows: AssessmentRow[],
  year: number,
  subgroups: { id: number; name: string }[]
): ProficiencyTableRow[] =>
  subgroups
    .map(subgroup => proficiencyRow(subgroup.id, subgroup.name, rows.filter(row =>
      row.year === year && row.grade_id === null && row.assessment_subgroup_id === subgroup.id)))
    .filter(row => row.math !== null || row.reading !== null || row.science !== null);

/** One year's percent proficient for each tested grade (all students), in grade order. */
export const proficiencyByGrade = (
  rows: AssessmentRow[],
  year: number,
  grades: { id: number; name: string }[]
): ProficiencyTableRow[] =>
  [...grades]
    .sort((a, b) => a.id - b.id)
    .map(grade => proficiencyRow(grade.id, grade.name, rows.filter(row =>
      row.year === year && row.grade_id === grade.id && row.assessment_subgroup_id === ALL_STUDENTS_SUBGROUP_ID)))
    .filter(row => row.math !== null || row.reading !== null || row.science !== null);

// ================ Money ================

export interface RevenueRow {
  year: number;
  entry_type_id: number;
  value: number;
}

export interface RevenueEntryType {
  id: number;
  category?: { super_category?: { name: string } };
}

export const REVENUE_SOURCES = [
  { key: 'local', name: 'Local' },
  { key: 'state', name: 'State' },
  { key: 'federal', name: 'Federal' },
  // The DOE-25 "Other Financing Sources": bond sales, transfers between funds and from trust funds
  { key: 'other', name: 'Borrowing and transfers' },
] as const;

// Same grouping as the district Revenue card: by the entry type's super category name
const revenueSource = (superCategoryName: string | undefined) => {
  const name = superCategoryName ?? '';
  if (name.includes('Local')) return 'local';
  if (name.includes('State')) return 'state';
  if (name.includes('Federal')) return 'federal';
  return 'other';
};

/** Statewide district revenue by year, summed into local, state, federal and other sources. */
export const revenueBySource = (rows: RevenueRow[], entryTypes: RevenueEntryType[]): YearRow[] => {
  const sourceByType = new Map(entryTypes.map(type => [type.id, revenueSource(type.category?.super_category?.name)]));
  const byYear = pivotByYear(rows, row => sourceByType.get(row.entry_type_id) ?? 'other', row => row.value);
  return byYear.map(row => {
    REVENUE_SOURCES.forEach(source => { row[source.key] = row[source.key] ?? 0; });
    return row;
  });
};

export interface EfaStateRow {
  year: number;
  entry_type_id: number;
  value: number;
}

export interface EfaEntryTypeRow {
  id: number;
  name: string;
  year: number;
  value: number;
}

export const EFA_BASE_AID = 'Base Aid';

/**
 * EFA students by year (students receiving base aid; every EFA student does) and the estimated
 * state cost: each aid type's student count times that year's per-student amount for the type.
 */
export const efaTotals = (rows: EfaStateRow[], entryTypes: EfaEntryTypeRow[]): YearRow[] => {
  const baseAidId = entryTypes.find(type => type.name === EFA_BASE_AID)?.id;
  const amounts = new Map(entryTypes.map(type => [`${type.id}-${type.year}`, type.value]));
  const byYear = new Map<number, YearRow>();
  rows.forEach(row => {
    const yearRow = byYear.get(row.year) ?? { year: row.year, students: 0, estimatedCost: 0 };
    if (row.entry_type_id === baseAidId) yearRow.students = (yearRow.students ?? 0) + row.value;
    const amount = amounts.get(`${row.entry_type_id}-${row.year}`);
    if (amount !== undefined) yearRow.estimatedCost = (yearRow.estimatedCost ?? 0) + row.value * amount;
    byYear.set(row.year, yearRow);
  });
  return sortByYear([...byYear.values()]);
};

// ================ Staff ================

/** Students (average daily membership) per teacher (full-time equivalents), matched by year. */
export const studentsPerTeacher = (adm: YearValue[], teachers: YearValue[]): YearValue[] => {
  const teachersByYear = new Map(teachers.map(point => [point.year, point.value]));
  return sortByYear(adm)
    .filter(point => (teachersByYear.get(point.year) ?? 0) > 0)
    .map(point => ({ year: point.year, value: point.value / teachersByYear.get(point.year)! }));
};

// ================ Formatting ================

/** School or fiscal year ending in `year`, written out: 2025 -> "2024-25". */
export const formatSchoolYear = (year: number): string => `${year - 1}-${String(year).slice(-2)}`;

export const formatPercent = (value: number | null | undefined, digits = 0): string =>
  value === null || value === undefined || isNaN(value) ? 'N/A' : `${value.toFixed(digits)}%`;

export const formatCount = (value: number | null | undefined): string =>
  value === null || value === undefined || isNaN(value) ? 'N/A' : Math.round(value).toLocaleString('en-US');

export const formatDollars = (value: number | null | undefined): string =>
  value === null || value === undefined || isNaN(value)
    ? 'N/A'
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

const NICE_STEPS = [1, 2, 2.5, 5, 10];

export type AxisMode = 'zero' | 'fit' | 'span';

/**
 * A y-axis with about four round steps (1, 2, 2.5 or 5 times a power of ten).
 * - 'zero' starts at zero (or below it, for negative values)
 * - 'fit' starts a little under the lowest value, for charts where zero would flatten the trend
 * - 'span' starts at the lowest value rounded down, e.g. for percent change or a fixed range
 */
export const niceAxis = (min: number, max: number, mode: AxisMode = 'zero', padding = 0.05): { domain: [number, number]; ticks: number[]; step: number } => {
  const low = mode === 'zero' ? Math.min(0, min) : mode === 'fit' ? Math.max(0, min * (1 - padding)) : min;
  const high = Math.max(max, low);
  const rough = (high - low) / 4 || Math.abs(high) || 1;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = (NICE_STEPS.find(nice => nice * magnitude >= rough - 1e-9) ?? 10) * magnitude;
  const floor = Math.floor(low / step + 1e-9) * step;
  const ceiling = Math.max(Math.ceil(high / step - 1e-9) * step, floor + step);
  const ticks: number[] = [];
  for (let tick = floor; tick <= ceiling + step / 2; tick += step) ticks.push(Number(tick.toFixed(10)));
  return { domain: [floor, ceiling], ticks, step };
};

const trimZeros = (text: string) => text.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');

/** Short axis labels: 0, 950, 12K, 2.5M, 4B (with "$" for dollars); no trailing ".0". */
export const formatCompact = (value: number, prefix = ''): string => {
  const sign = value < 0 ? '−' : '';
  const size = Math.abs(value);
  const scaled = size >= 1e9 ? [size / 1e9, 'B'] : size >= 1e6 ? [size / 1e6, 'M'] : size >= 1e3 ? [size / 1e3, 'K'] : [size, ''];
  return `${sign}${prefix}${trimZeros((scaled[0] as number).toFixed(1))}${scaled[1]}`;
};

export const formatCompactDollars = (value: number): string => formatCompact(value, '$');

/** "$2.88 billion", "$54.4 million", "$12,500": for figures in sentences and summary tables. */
export const formatDollarsInWords = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  if (Math.abs(value) >= 1e9) return `$${trimZeros((value / 1e9).toFixed(2))} billion`;
  if (Math.abs(value) >= 1e6) return `$${trimZeros((value / 1e6).toFixed(1))} million`;
  return formatDollars(value);
};

/** "+12%", "−4%" (a true minus sign), "0%". */
export const formatSignedPercent = (value: number | null | undefined, digits = 0): string => {
  if (value === null || value === undefined || isNaN(value)) return '—';
  const rounded = Number(value.toFixed(digits));
  if (rounded === 0) return `${(0).toFixed(digits)}%`;
  return `${rounded > 0 ? '+' : '−'}${Math.abs(rounded).toFixed(digits)}%`;
};

/** "up 12%" / "down 3%" / "unchanged", for plain-language summaries. */
export const describeChange = (percentChange: number, digits = 0): string => {
  const rounded = Number(Math.abs(percentChange).toFixed(digits));
  if (rounded === 0) return 'unchanged';
  return `${percentChange > 0 ? 'up' : 'down'} ${rounded}%`;
};

// -------------------- October 1 enrollment by type of school --------------------

/** The public types of school in the state's enrollment totals; the other type is nonpublic (private) schools */
export const PUBLIC_ENROLLMENT_TYPES = [
  'Public District Schools',
  'Public Academies and Joint Maintenance Agreement Schools',
  'Public Charter Schools',
  'Interstate Schools',
];
const K12_EXCLUDED = new Set(['Preschool', 'Post Graduate']);

/**
 * October 1 public school students by year: every public school (district, academy, charter and
 * interstate), all grades by default, or kindergarten to grade 12 with `k12`, or one grade or a set.
 */
export const publicStudents = (
  rows: StateEnrollmentByTypeData[],
  options: { k12?: boolean; grade?: string; grades?: string[] } = {},
): YearValue[] => {
  const totals = new Map<number, number>();
  rows.forEach(row => {
    if (!PUBLIC_ENROLLMENT_TYPES.includes(row.enrollment_type.name)) return;
    if (options.k12 && K12_EXCLUDED.has(row.grade.name)) return;
    if (options.grade && row.grade.name !== options.grade) return;
    if (options.grades && !options.grades.includes(row.grade.name)) return;
    totals.set(row.year, (totals.get(row.year) ?? 0) + row.enrollment);
  });
  return sortByYear([...totals].map(([year, value]) => ({ year, value })));
};
