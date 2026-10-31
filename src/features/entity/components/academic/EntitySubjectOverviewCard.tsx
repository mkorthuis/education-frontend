import React, { useEffect, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCurrentAssessmentStateData,
  selectSelectedGradeId,
  selectSelectedSubgroupId,
  selectSelectedSubjectId,
  fetchAssessmentStateData
} from '@/store/slices/assessmentSlice';
import { filterAssessmentResults } from '@/features/district/utils/assessmentDataProcessing';
import { ASSESSMENT_YEAR } from '@/utils/environment';
import SubjectOverviewCardUI from '@/components/ui/academic/SubjectOverviewCard';
import { EntityKind } from '@/features/entity/entity';
import { ASSESSMENT, EntityAssessmentData } from '@/features/entity/bindings/assessment';

const EntitySubjectOverviewCard: React.FC<{ kind: EntityKind }> = ({ kind }) => {
  const dispatch = useAppDispatch();
  
  // Get data and filter selections from Redux store
  const entityData: EntityAssessmentData[] = useAppSelector(state => ASSESSMENT[kind].selectCurrentData(state));
  const stateData = useAppSelector(selectCurrentAssessmentStateData);
  const selectedGradeId = useAppSelector(selectSelectedGradeId);
  const selectedSubgroupId = useAppSelector(selectSelectedSubgroupId);
  const selectedSubjectId = useAppSelector(selectSelectedSubjectId);
  
  // Create filter object for consistency
  const filterParams = useMemo(() => ({
    year: ASSESSMENT_YEAR,
    assessment_subject_id: selectedSubjectId || undefined,
    grade_id: selectedGradeId || undefined,
    assessment_subgroup_id: selectedSubgroupId || undefined
  }), [selectedSubjectId, selectedGradeId, selectedSubgroupId]);
  
  // Fetch state assessment data if not available
  useEffect(() => {
    if (selectedSubjectId && stateData.length === 0) {
      dispatch(fetchAssessmentStateData(filterParams));
    }
  }, [dispatch, selectedSubjectId, stateData.length, filterParams]);
  
  // Filter data based on selected criteria
  const filteredEntityData = useMemo(() => 
    filterAssessmentResults(entityData, filterParams),
  [entityData, filterParams]);
  
  const filteredStateData = useMemo(() => 
    filterAssessmentResults(stateData, filterParams),
  [stateData, filterParams]);
  
  // Get first item from filtered data or null if not available
  const assessmentData = filteredEntityData.length > 0 ? filteredEntityData[0] : null;
  const stateAssessmentData = filteredStateData.length > 0 ? filteredStateData[0] : null;
  
  return (
    <SubjectOverviewCardUI
      assessmentData={assessmentData}
      stateAssessmentData={stateAssessmentData}
      selectedGradeId={selectedGradeId}
      selectedSubgroupId={selectedSubgroupId}
      entityType={kind}
    />
  );
};

export default EntitySubjectOverviewCard;
