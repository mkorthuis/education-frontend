import React from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  selectStateHarassmentData,
  selectHarassmentClassification,
  selectStateEnrollmentData
} from '@/store/slices/safetySlice';
import SharedHarassmentTrendChart from '@/components/ui/safety/HarassmentTrendChart';
import { EntityKind, useCurrentEntity } from '@/features/entity/entity';
import { SAFETY, IdFallback, safetyParams } from '@/features/entity/bindings/safety';

const ID_FALLBACK: Record<EntityKind, IdFallback> = { school: 'zero', district: 'none' };

interface EntityHarassmentTrendChartProps {
  kind: EntityKind;
  className?: string;
}

const EntityHarassmentTrendChart: React.FC<EntityHarassmentTrendChartProps> = ({ kind, className }) => {
  // Get the data from the store
  const entity = useCurrentEntity(kind);
  const entityParams = safetyParams(entity, ID_FALLBACK[kind]);
  const stateParams = {};

  const entityHarassmentData = useAppSelector(state =>
    SAFETY[kind].data.harassment(state, entityParams));
  const stateHarassmentData = useAppSelector(state =>
    selectStateHarassmentData(state, stateParams));
  const harassmentClassifications = useAppSelector(selectHarassmentClassification);
  const entityEnrollmentData = useAppSelector(state =>
    SAFETY[kind].data.enrollment(state, entityParams));
  const stateEnrollmentData = useAppSelector(state =>
    selectStateEnrollmentData(state, stateParams));

  return (
    <SharedHarassmentTrendChart
      className={className}
      entityData={entityHarassmentData}
      stateData={stateHarassmentData}
      harassmentClassifications={harassmentClassifications}
      entityEnrollmentData={entityEnrollmentData}
      stateEnrollmentData={stateEnrollmentData}
      entityName={entity.name}
      isDistrict={kind === 'district'}
    />
  );
};

export default EntityHarassmentTrendChart;
