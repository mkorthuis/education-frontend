import React from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  selectStateSeclusionData,
  selectStateEnrollmentData
} from '@/store/slices/safetySlice';
import { calculatePer100Students } from '@/utils/safetyCalculations';
import SharedSeclusionTrendChart from '@/components/ui/safety/SeclusionTrendChart';
import { EntityKind, useCurrentEntity } from '@/features/entity/entity';
import { SAFETY, IdFallback, safetyParams } from '@/features/entity/bindings/safety';

const ID_FALLBACK: Record<EntityKind, IdFallback> = { school: 'zero', district: 'zero' };

interface EntitySeclusionTrendChartProps {
  kind: EntityKind;
  className?: string;
}

const EntitySeclusionTrendChart: React.FC<EntitySeclusionTrendChartProps> = ({ kind, className }) => {
  // Get the current entity
  const entity = useCurrentEntity(kind);
  const entityParams = safetyParams(entity, ID_FALLBACK[kind]);
  const stateParams = {};

  // Get the entity and state seclusion data
  const entitySeclusionData = useAppSelector(state => SAFETY[kind].data.seclusion(state, entityParams));
  const stateSeclusionData = useAppSelector(state => selectStateSeclusionData(state, stateParams));

  // Get enrollment data for rate calculations
  const entityEnrollmentData = useAppSelector(state => SAFETY[kind].data.enrollment(state, entityParams));
  const stateEnrollmentData = useAppSelector(state => selectStateEnrollmentData(state, stateParams));

  return (
    <SharedSeclusionTrendChart
      entityName={entity.name || ''}
      isDistrict={kind === 'district'}
      entitySeclusionData={entitySeclusionData}
      stateSeclusionData={stateSeclusionData}
      entityEnrollmentData={entityEnrollmentData}
      stateEnrollmentData={stateEnrollmentData}
      calculatePer100Students={calculatePer100Students}
      className={className}
    />
  );
};

export default EntitySeclusionTrendChart;
