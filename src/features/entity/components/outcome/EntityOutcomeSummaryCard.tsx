import React from 'react';
import { useAppSelector } from '@/store/hooks';
import * as outcomeSlice from '@/store/slices/outcomeSlice';
import { FISCAL_YEAR } from '@/utils/environment';
import SharedOutcomeSummaryCard from '@/components/ui/outcomes/OutcomeSummaryCard';
import { EntityKind, ENTITY_LABEL, SELECT_CURRENT_ENTITY, useRouteId } from '@/features/entity/entity';
import { OUTCOME } from '@/features/entity/bindings/outcome';

const EntityOutcomeSummaryCard: React.FC<{ kind: EntityKind }> = ({ kind }) => {
  const entityId = useRouteId();
  const entityParams = OUTCOME[kind].params(entityId);
  const stateParams = {};

  // Subscribed but unused, as in the school and district copies this replaces.
  useAppSelector(SELECT_CURRENT_ENTITY[kind]);

  const entityData = useAppSelector(state =>
    OUTCOME[kind].select.graduationCohort(state, entityParams));
  const stateData = useAppSelector(state =>
    outcomeSlice.selectStateGraduationCohortData(state, stateParams));
  const entityPostGradData = useAppSelector(state =>
    OUTCOME[kind].select.postGraduation(state, entityParams));
  const statePostGradData = useAppSelector(state =>
    outcomeSlice.selectStatePostGraduationData(state, stateParams));
  const postGraduationTypes = useAppSelector(outcomeSlice.selectPostGraduationTypes);

  const fiscalYear = parseInt(FISCAL_YEAR);

  const entityStats = entityData.find(d => d.year === fiscalYear) ||
    { graduate: 0, earned_hiset: 0, dropped_out: 0, cohort_size: 0 };
  const stateStats = stateData.find(d => d.year === fiscalYear) ||
    { graduate: 0, earned_hiset: 0, dropped_out: 0, cohort_size: 0 };

  return (
    <SharedOutcomeSummaryCard
      entityLabel={ENTITY_LABEL[kind]}
      entityStats={entityStats}
      stateStats={stateStats}
      entityPostGradData={entityPostGradData}
      statePostGradData={statePostGradData}
      postGraduationTypes={postGraduationTypes}
      fiscalYear={fiscalYear}
    />
  );
};

export default EntityOutcomeSummaryCard;
