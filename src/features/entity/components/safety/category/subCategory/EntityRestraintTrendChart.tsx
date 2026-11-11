import React, { useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  selectStateRestraintData,
  selectStateEnrollmentData
} from '@/store/slices/safetySlice';
import { EntityKind, useCurrentEntity } from '@/features/entity/entity';
import { SAFETY, IdFallback, safetyParams } from '@/features/entity/bindings/safety';
import SafetyTrendChart from './SafetyTrendChart';
import { countsByYear, ratesByYear } from './safetyTrends';

const ID_FALLBACK: Record<EntityKind, IdFallback> = { school: 'zero', district: 'zero' };

const EntityRestraintTrendChart: React.FC<{ kind: EntityKind }> = ({ kind }) => {
  const entity = useCurrentEntity(kind);
  const entityParams = safetyParams(entity, ID_FALLBACK[kind]);

  const entityRestraintData = useAppSelector(state => SAFETY[kind].data.restraint(state, entityParams));
  const stateRestraintData = useAppSelector(state => selectStateRestraintData(state, {}));
  const entityEnrollment = useAppSelector(state => SAFETY[kind].data.enrollment(state, entityParams));
  const stateEnrollment = useAppSelector(state => selectStateEnrollmentData(state, {}));

  // Restraints reported per 100 students
  const rows = useMemo(() => ratesByYear(
    entityRestraintData.map(row => row.year),
    countsByYear(entityRestraintData, row => row.generated),
    countsByYear(stateRestraintData, row => row.generated),
    entityEnrollment,
    stateEnrollment
  ), [entityRestraintData, stateRestraintData, entityEnrollment, stateEnrollment]);

  return <SafetyTrendChart kind={kind} title="Restraint Reports By Year" rows={rows} />;
};

export default EntityRestraintTrendChart;
