import React from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  selectStateRestraintData,
  selectStateEnrollmentData
} from '@/store/slices/safetySlice';
import { calculatePer100Students } from '@/utils/safetyCalculations';
import SharedRestraintTrendChart from '@/components/ui/safety/RestraintTrendChart';
import { EntityKind, useCurrentEntity } from '@/features/entity/entity';
import { SAFETY, IdFallback, safetyParams } from '@/features/entity/bindings/safety';

const ID_FALLBACK: Record<EntityKind, IdFallback> = { school: 'zero', district: 'zero' };

interface EntityRestraintTrendChartProps {
  kind: EntityKind;
  className?: string;
}

const EntityRestraintTrendChart: React.FC<EntityRestraintTrendChartProps> = ({ kind, className }) => {
  // Get the current entity
  const entity = useCurrentEntity(kind);
  const entityParams = safetyParams(entity, ID_FALLBACK[kind]);
  const stateParams = {};

  // Get the entity and state restraint data
  const entityRestraintData = useAppSelector(state => SAFETY[kind].data.restraint(state, entityParams));
  const stateRestraintData = useAppSelector(state => selectStateRestraintData(state, stateParams));

  // Get enrollment data for rate calculations
  const entityEnrollmentData = useAppSelector(state => SAFETY[kind].data.enrollment(state, entityParams));
  const stateEnrollmentData = useAppSelector(state => selectStateEnrollmentData(state, stateParams));

  return (
    <SharedRestraintTrendChart
      entityName={entity.name || ''}
      isDistrict={kind === 'district'}
      entityRestraintData={entityRestraintData}
      stateRestraintData={stateRestraintData}
      entityEnrollmentData={entityEnrollmentData}
      stateEnrollmentData={stateEnrollmentData}
      calculatePer100Students={calculatePer100Students}
      className={className}
    />
  );
};

export default EntityRestraintTrendChart;
