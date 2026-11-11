import React, { useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  selectStateSeclusionData,
  selectStateEnrollmentData
} from '@/store/slices/safetySlice';
import { EntityKind, useCurrentEntity } from '@/features/entity/entity';
import { SAFETY, IdFallback, safetyParams } from '@/features/entity/bindings/safety';
import { BaseSeclusionData } from '@/store/slices/safety/types';
import SafetyTrendChart from './SafetyTrendChart';
import { countsByYear, ratesByYear } from './safetyTrends';

const ID_FALLBACK: Record<EntityKind, IdFallback> = { school: 'zero', district: 'zero' };

const EntitySeclusionTrendChart: React.FC<{ kind: EntityKind }> = ({ kind }) => {
  const entity = useCurrentEntity(kind);
  const entityParams = safetyParams(entity, ID_FALLBACK[kind]);

  const entitySeclusionData = useAppSelector(state => SAFETY[kind].data.seclusion(state, entityParams));
  const stateSeclusionData = useAppSelector(state => selectStateSeclusionData(state, {}));
  const entityEnrollment = useAppSelector(state => SAFETY[kind].data.enrollment(state, entityParams));
  const stateEnrollment = useAppSelector(state => selectStateEnrollmentData(state, {}));

  // Seclusions reported per 100 students
  const rows = useMemo(() => ratesByYear(
    entitySeclusionData.map(row => row.year),
    countsByYear<BaseSeclusionData>(entitySeclusionData, row => row.generated),
    countsByYear(stateSeclusionData, row => row.generated),
    entityEnrollment,
    stateEnrollment
  ), [entitySeclusionData, stateSeclusionData, entityEnrollment, stateEnrollment]);

  return <SafetyTrendChart kind={kind} title="Seclusion Reports By Year" rows={rows} />;
};

export default EntitySeclusionTrendChart;
