import React from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  selectStateDisciplineIncidentData,
  selectDisciplineIncidentTypes,
  selectStateEnrollmentData
} from '@/store/slices/safetySlice';
import { calculatePer100Students } from '@/utils/safetyCalculations';
import SharedDisciplineIncidentTable from '@/components/ui/safety/DisciplineIncidentTable';
import { EntityKind, useCurrentEntity } from '@/features/entity/entity';
import { SAFETY, IdFallback, safetyParams } from '@/features/entity/bindings/safety';

const ID_FALLBACK: Record<EntityKind, IdFallback> = { school: 'zero', district: 'zero' };

interface EntityDisciplineIncidentTableProps {
  kind: EntityKind;
  fiscalYear: number;
}

const EntityDisciplineIncidentTable: React.FC<EntityDisciplineIncidentTableProps> = ({ kind, fiscalYear }) => {
  // Get data from store using selectors
  const entity = useCurrentEntity(kind);
  const entityParams = safetyParams(entity, ID_FALLBACK[kind]);
  const stateParams = {};

  const entityData = useAppSelector(state =>
    SAFETY[kind].data.disciplineIncident(state, entityParams));
  const stateData = useAppSelector(state =>
    selectStateDisciplineIncidentData(state, stateParams));
  const disciplineIncidentTypes = useAppSelector(selectDisciplineIncidentTypes);

  // Get enrollment data for calculating per 100 student rates
  const entityEnrollmentData = useAppSelector(state =>
    SAFETY[kind].data.enrollment(state, entityParams));
  const stateEnrollmentData = useAppSelector(state =>
    selectStateEnrollmentData(state, stateParams));

  return (
    <SharedDisciplineIncidentTable
      fiscalYear={fiscalYear}
      entityName={entity.name || ''}
      entityType={kind}
      disciplineData={entityData}
      stateData={stateData}
      incidentTypes={disciplineIncidentTypes}
      entityEnrollmentData={entityEnrollmentData}
      stateEnrollmentData={stateEnrollmentData}
      calculatePer100Students={calculatePer100Students}
      entityLabel={`this ${kind}`}
    />
  );
};

export default EntityDisciplineIncidentTable;
