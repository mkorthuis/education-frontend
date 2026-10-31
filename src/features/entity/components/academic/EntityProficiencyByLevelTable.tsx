import React, { useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';
import { 
  selectCurrentAssessmentStateData,
  selectSelectedSubjectId,
  selectSelectedGradeId,
  selectSelectedSubgroupId,
} from '@/store/slices/assessmentSlice';
import { filterAssessmentResults } from '@/features/district/utils/assessmentDataProcessing';
import { ASSESSMENT_YEAR } from '@/utils/environment';
import ProficiencyByLevelTableUI from '@/components/ui/academic/ProficiencyByLevelTable';
import { EntityKind, ENTITY_LABEL } from '@/features/entity/entity';
import { ASSESSMENT, EntityAssessmentData } from '@/features/entity/bindings/assessment';

export interface EntityProficiencyByLevelTableProps {
  kind: EntityKind;
  entityName?: string;
}

const EntityProficiencyByLevelTable: React.FC<EntityProficiencyByLevelTableProps> = ({ 
  kind,
  entityName = ENTITY_LABEL[kind]
}) => {
  // Get data from Redux store
  const entityData: EntityAssessmentData[] = useAppSelector(state => ASSESSMENT[kind].selectCurrentData(state));
  const stateData = useAppSelector(selectCurrentAssessmentStateData);
  const selectedSubjectId = useAppSelector(selectSelectedSubjectId);
  const selectedGradeId = useAppSelector(selectSelectedGradeId);
  const selectedSubgroupId = useAppSelector(selectSelectedSubgroupId);
  
  // Create filter object for consistency
  const filterParams = useMemo(() => ({
    year: ASSESSMENT_YEAR,
    assessment_subject_id: selectedSubjectId || undefined,
    grade_id: selectedGradeId || undefined,
    assessment_subgroup_id: selectedSubgroupId || undefined
  }), [selectedSubjectId, selectedGradeId, selectedSubgroupId]);

  // Filter both entity and state data based on current selections
  const filteredEntityData = useMemo(() => 
    filterAssessmentResults(entityData, filterParams),
  [entityData, filterParams]);

  const filteredStateData = useMemo(() => 
    filterAssessmentResults(stateData, filterParams),
  [stateData, filterParams]);

  // Get the first item from filtered data or null if not available
  const entityAggregated = filteredEntityData.length > 0 ? filteredEntityData[0] : null;
  const stateAggregated = filteredStateData.length > 0 ? filteredStateData[0] : null;
  
  return (
    <ProficiencyByLevelTableUI
      entityData={entityAggregated}
      stateData={stateAggregated}
      entityType={kind}
      entityName={entityName}
    />
  );
};

export default EntityProficiencyByLevelTable;
