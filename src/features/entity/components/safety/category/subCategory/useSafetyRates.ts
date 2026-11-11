import { useCallback, useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';
import { totalsByYear, YearRow } from '@/features/state/utils/stateMetrics';
import { EntityKind, useCurrentEntity } from '@/features/entity/entity';
import { SAFETY, STATE_SAFETY, IdFallback, safetyParams } from '@/features/entity/bindings/safety';
import { enrolledByYear, ratesByYear } from '@/features/entity/trends';

type RateDataset = 'disciplineCount' | 'bullying' | 'harassment' | 'restraint' | 'seclusion' | 'truancy';

/** A row of the dataset as the state reports it; the district's and school's rows add their ids */
type RowOf<D extends RateDataset> = ReturnType<(typeof STATE_SAFETY.data)[D]>[number];

/**
 * Rates per 100 students from a safety dataset: given what to count in each row, the district's or
 * school's rate ("entity") and the state's for each year the district or school reported.
 */
export const useSafetyRates = <D extends RateDataset>(kind: EntityKind, dataset: D, fallback: IdFallback) => {
  const entityParams = safetyParams(useCurrentEntity(kind), fallback);
  const entityRows = useAppSelector(state => SAFETY[kind].data[dataset](state, entityParams)) as RowOf<D>[];
  const stateRows = useAppSelector(state => STATE_SAFETY.data[dataset](state, {})) as RowOf<D>[];
  const entityEnrollment = useAppSelector(state => SAFETY[kind].data.enrollment(state, entityParams));
  const stateEnrollment = useAppSelector(state => STATE_SAFETY.data.enrollment(state, {}));

  const enrolled = useMemo(
    () => ({ entity: enrolledByYear(entityEnrollment), state: enrolledByYear(stateEnrollment) }),
    [entityEnrollment, stateEnrollment]
  );
  return useCallback(
    (count: (row: RowOf<D>) => number): YearRow[] =>
      ratesByYear(totalsByYear(entityRows, count), totalsByYear(stateRows, count), enrolled.entity, enrolled.state),
    [entityRows, stateRows, enrolled]
  );
};
