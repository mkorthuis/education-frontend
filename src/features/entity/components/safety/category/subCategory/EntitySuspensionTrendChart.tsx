import React from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  selectStateDisciplineCountData,
  selectDisciplineCountTypes,
  selectStateEnrollmentData
} from '@/store/slices/safetySlice';
import {
  calculatePer100Students,
  IN_SCHOOL_SUSPENSION_TYPE,
  OUT_OF_SCHOOL_SUSPENSION_TYPE
} from '@/utils/safetyCalculations';
import SharedSuspensionTrendChart from '@/components/ui/safety/SuspensionTrendChart';
import { EntityKind, ENTITY_LABEL, useCurrentEntity } from '@/features/entity/entity';
import { SAFETY, IdFallback, safetyParams } from '@/features/entity/bindings/safety';

const ID_FALLBACK: Record<EntityKind, IdFallback> = { school: 'zero', district: 'none' };

interface EntitySuspensionTrendChartProps {
  kind: EntityKind;
  className?: string;
}

const EntitySuspensionTrendChart: React.FC<EntitySuspensionTrendChartProps> = ({ kind, className }) => {
  // Get the data from the store
  const entity = useCurrentEntity(kind);
  const entityParams = safetyParams(entity, ID_FALLBACK[kind]);
  const stateParams = {};

  const entityDisciplineCountData = useAppSelector(state =>
    SAFETY[kind].data.disciplineCount(state, entityParams));
  const stateDisciplineCountData = useAppSelector(state =>
    selectStateDisciplineCountData(state, stateParams));
  const disciplineCountTypes = useAppSelector(selectDisciplineCountTypes);
  const entityEnrollmentData = useAppSelector(state =>
    SAFETY[kind].data.enrollment(state, entityParams));
  const stateEnrollmentData = useAppSelector(state =>
    selectStateEnrollmentData(state, stateParams));

  // The legend uses the literal 'School' / 'District', not the entity's name.
  return (
    <SharedSuspensionTrendChart
      entityName={ENTITY_LABEL[kind]}
      entityDisciplineCountData={entityDisciplineCountData}
      stateDisciplineCountData={stateDisciplineCountData}
      disciplineCountTypes={disciplineCountTypes}
      entityEnrollmentData={entityEnrollmentData}
      stateEnrollmentData={stateEnrollmentData}
      calculatePer100Students={calculatePer100Students}
      inSchoolSuspensionType={IN_SCHOOL_SUSPENSION_TYPE}
      outOfSchoolSuspensionType={OUT_OF_SCHOOL_SUSPENSION_TYPE}
      className={className}
    />
  );
};

export default EntitySuspensionTrendChart;
