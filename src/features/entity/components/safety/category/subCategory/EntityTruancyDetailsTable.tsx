import React from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  selectStateTruancyData,
  selectStateEnrollmentData
} from '@/store/slices/safetySlice';
import { calculatePer100Students, EARLIEST_YEAR } from '@/utils/safetyCalculations';
import SharedTruancyDetailsTable from '@/components/ui/safety/TruancyDetailsTable';
import { EntityKind, ENTITY_LABEL, useCurrentEntity } from '@/features/entity/entity';
import { SAFETY, IdFallback, safetyParams } from '@/features/entity/bindings/safety';

const ID_FALLBACK: Record<EntityKind, IdFallback> = { school: 'none', district: 'none' };

interface EntityTruancyDetailsTableProps {
  kind: EntityKind;
  className?: string;
}

const EntityTruancyDetailsTable: React.FC<EntityTruancyDetailsTableProps> = ({ kind, className }) => {
  // Get the current entity
  const entity = useCurrentEntity(kind);
  const entityParams = safetyParams(entity, ID_FALLBACK[kind]);

  // Get the entity and state truancy data
  const entityTruancyData = useAppSelector(state => SAFETY[kind].data.truancy(state, entityParams));
  const stateTruancyData = useAppSelector(state => selectStateTruancyData(state, {}));

  // Get enrollment data for percentage calculations
  const entityEnrollmentData = useAppSelector(state => SAFETY[kind].data.enrollment(state, entityParams));
  const stateEnrollmentData = useAppSelector(state => selectStateEnrollmentData(state, {}));

  return (
    <SharedTruancyDetailsTable
      entityName={entity.name || ''}
      entityTruancyData={entityTruancyData}
      stateTruancyData={stateTruancyData}
      entityEnrollmentData={entityEnrollmentData}
      stateEnrollmentData={stateEnrollmentData}
      calculatePer100Students={calculatePer100Students}
      earliestYear={EARLIEST_YEAR}
      entityLabel={ENTITY_LABEL[kind]}
      className={className}
    />
  );
};

export default EntityTruancyDetailsTable;
