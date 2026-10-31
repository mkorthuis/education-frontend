import React from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  selectStateBullyingData,
  selectBullyingTypes,
  selectStateEnrollmentData
} from '@/store/slices/safetySlice';
import SharedBullyTrendChart from '@/components/ui/safety/BullyTrendChart';
import { EntityKind, useCurrentEntity } from '@/features/entity/entity';
import { SAFETY, IdFallback, safetyParams } from '@/features/entity/bindings/safety';

const ID_FALLBACK: Record<EntityKind, IdFallback> = { school: 'zero', district: 'none' };

interface EntityBullyTrendChartProps {
  kind: EntityKind;
  className?: string;
}

const EntityBullyTrendChart: React.FC<EntityBullyTrendChartProps> = ({ kind, className }) => {
  // Get the data from the store
  const entity = useCurrentEntity(kind);
  const entityParams = safetyParams(entity, ID_FALLBACK[kind]);
  const stateParams = {};

  const entityBullyingData = useAppSelector(state =>
    SAFETY[kind].data.bullying(state, entityParams));
  const stateBullyingData = useAppSelector(state =>
    selectStateBullyingData(state, stateParams));
  const bullyingTypes = useAppSelector(selectBullyingTypes);
  const entityEnrollmentData = useAppSelector(state =>
    SAFETY[kind].data.enrollment(state, entityParams));
  const stateEnrollmentData = useAppSelector(state =>
    selectStateEnrollmentData(state, stateParams));

  return (
    <SharedBullyTrendChart
      className={className}
      entityData={entityBullyingData}
      stateData={stateBullyingData}
      bullyingTypes={bullyingTypes}
      entityEnrollmentData={entityEnrollmentData}
      stateEnrollmentData={stateEnrollmentData}
      entityName={entity.name}
      isDistrict={kind === 'district'}
    />
  );
};

export default EntityBullyTrendChart;
