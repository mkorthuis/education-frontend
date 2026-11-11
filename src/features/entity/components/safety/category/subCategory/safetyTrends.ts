import { YearRow } from '@/features/state/utils/stateMetrics';
import { calculatePer100Students } from '@/utils/safetyCalculations';

interface Enrollment {
  year: number;
  total_enrollment: number;
}

/** A year's count, or null when nothing was reported that year */
export type CountFor = (year: number) => number | null;

/**
 * Sums `value` over a year's rows, or over those `include` keeps (0 when it keeps none). A year with
 * no rows at all has no count.
 */
export const countsByYear = <T extends { year: number }>(
  rows: T[],
  value: (row: T) => number,
  include: (row: T) => boolean = () => true
): CountFor => {
  const totals = new Map<number, number>();
  rows.forEach(row => {
    totals.set(row.year, (totals.get(row.year) ?? 0) + (include(row) ? value(row) || 0 : 0));
  });
  return year => totals.get(year) ?? null;
};

/**
 * The district's or school's rate ("entity") and the state's ("state") for each year, per 100
 * students: incidents per 100, or the percentage of students for counts of students. A year without a
 * count or an enrollment has no rate, rather than a rate of zero.
 */
export const ratesByYear = (
  years: number[],
  entityCount: CountFor,
  stateCount: CountFor,
  entityEnrollment: Enrollment[],
  stateEnrollment: Enrollment[],
  decimals = 2
): YearRow[] => {
  const entityEnrolled = new Map(entityEnrollment.map(row => [row.year, row.total_enrollment]));
  const stateEnrolled = new Map(stateEnrollment.map(row => [row.year, row.total_enrollment]));
  const rate = (count: number | null, enrolled: number | undefined) =>
    count === null || !enrolled ? null : calculatePer100Students(count, enrolled, decimals);
  return [...new Set(years)].sort((a, b) => a - b).map(year => ({
    year,
    entity: rate(entityCount(year), entityEnrolled.get(year)),
    state: rate(stateCount(year), stateEnrolled.get(year)),
  }));
};

/** The district's or school's line alone, for a comparison drawn beside its rate for one type */
export const entityOnly = (rows: YearRow[]): YearRow[] => rows.map(({ year, entity }) => ({ year, entity }));
