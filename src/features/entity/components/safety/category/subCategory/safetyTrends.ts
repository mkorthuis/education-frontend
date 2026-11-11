import { TrendSeries } from '@/features/state/components/TrendChart';
import { YearRow } from '@/features/state/utils/stateMetrics';
import { EntityKind, ENTITY_LABEL } from '@/features/entity/entity';
import { calculatePer100Students } from '@/utils/safetyCalculations';

interface Enrollment {
  year: number;
  total_enrollment: number;
}

/** Each year's total of `value` over the rows `include` keeps; 0 for a year it keeps none of */
export const countsByYear = <T extends { year: number }>(
  rows: T[],
  value: (row: T) => number,
  include: (row: T) => boolean = () => true
): Map<number, number> => {
  const totals = new Map<number, number>();
  rows.forEach(row => totals.set(row.year, (totals.get(row.year) ?? 0) + (include(row) ? value(row) || 0 : 0)));
  return totals;
};

/**
 * For each year the district or school has counts, its rate ("entity") and the state's ("state") per
 * 100 students: incidents per 100, or the percentage for counts of students. A year without a count or
 * an enrollment has no rate, rather than a rate of zero.
 */
export const ratesByYear = (
  entityCounts: Map<number, number>,
  stateCounts: Map<number, number>,
  entityEnrollment: Enrollment[],
  stateEnrollment: Enrollment[],
  decimals = 2
): YearRow[] => {
  const entityEnrolled = new Map(entityEnrollment.map(row => [row.year, row.total_enrollment]));
  const stateEnrolled = new Map(stateEnrollment.map(row => [row.year, row.total_enrollment]));
  const rate = (count: number | undefined, enrolled: number | undefined) =>
    count === undefined || !enrolled ? null : calculatePer100Students(count, enrolled, decimals);
  return [...entityCounts.keys()].sort((a, b) => a - b).map(year => ({
    year,
    entity: rate(entityCounts.get(year), entityEnrolled.get(year)),
    state: rate(stateCounts.get(year), stateEnrolled.get(year)),
  }));
};

/** The district's or school's line alone, for the dashed line of all types beside one type */
export const entityOnly = (rows: YearRow[]): YearRow[] => rows.map(({ year, entity }) => ({ year, entity }));

/** The lines ratesByYear's rows draw */
export const rateSeries = (kind: EntityKind): TrendSeries[] => [
  { key: 'entity', name: ENTITY_LABEL[kind] },
  { key: 'state', name: 'State Average' },
];

export const formatPer100 = (value: number) => value.toFixed(2);
// "0.5", not "0.50", on the axis
export const formatPer100Axis = (value: number) => String(Number(value.toFixed(2)));
