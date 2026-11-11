// What the district and school charts share, beside the State pages' metric helpers
import { TrendSeries } from '@/features/state/components/TrendChart';
import { shareOfEnrollment, totalsByYear, YearRow, YearValue } from '@/features/state/utils/stateMetrics';
import { EntityKind, ENTITY_LABEL } from './entity';

/** Students enrolled each year */
export const enrolledByYear = (rows: { year: number; total_enrollment: number }[]): YearValue[] =>
  totalsByYear(rows, row => row.total_enrollment);

/**
 * A district's or school's counts and the state's per 100 students enrolled (incidents per 100, or
 * the percentage for counts of students), a row for each year the district or school has a count:
 * "entity" and "state", null for a year without an enrollment.
 */
export const ratesByYear = (entity: YearValue[], state: YearValue[], entityEnrolled: YearValue[], stateEnrolled: YearValue[]): YearRow[] => {
  const entityRates = new Map(shareOfEnrollment(entity, entityEnrolled).map(point => [point.year, point.value]));
  const stateRates = new Map(shareOfEnrollment(state, stateEnrolled).map(point => [point.year, point.value]));
  return entity.map(({ year }) => ({ year, entity: entityRates.get(year) ?? null, state: stateRates.get(year) ?? null }));
};

/** The district's or school's line alone, for a comparison drawn beside one of its parts */
export const entityOnly = (rows: YearRow[]): YearRow[] => rows.map(({ year, entity }) => ({ year, entity }));

/** The lines ratesByYear's rows draw */
export const rateSeries = (kind: EntityKind): TrendSeries[] => [
  { key: 'entity', name: ENTITY_LABEL[kind] },
  { key: 'state', name: 'State Average' },
];

export const formatPer100 = (value: number) => value.toFixed(2);
// "0.5", not "0.50", on the axis
export const formatPer100Axis = (value: number) => String(Number(value.toFixed(2)));
