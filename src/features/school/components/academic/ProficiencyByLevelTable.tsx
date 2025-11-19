import React, { useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';
import { 
  selectCurrentAssessmentSchoolData,
  selectCurrentAssessmentStateData,
  selectSelectedSubjectId,
  selectSelectedGradeId,
  selectSelectedSubgroupId,
} from '@/store/slices/assessmentSlice';
import { filterAssessmentResults } from '@/features/district/utils/assessmentDataProcessing';
import { ASSESSMENT_YEAR } from '@/utils/environment';
import ProficiencyByLevelTableUI from '@/components/ui/academic/ProficiencyByLevelTable';

interface ProficiencyByLevelTableProps {
  schoolName?: string;
}

const ProficiencyByLevelTable: React.FC<ProficiencyByLevelTableProps> = ({ 
  schoolName = 'School'
}) => {
  // Get data from Redux store
  const schoolData = useAppSelector(selectCurrentAssessmentSchoolData);
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

  // Filter both school and state data based on current selections
  const filteredSchoolData = useMemo(() => 
    filterAssessmentResults(schoolData, filterParams),
  [schoolData, filterParams]);

  const filteredStateData = useMemo(() => 
    filterAssessmentResults(stateData, filterParams),
  [stateData, filterParams]);

  // Get the first item from filtered data or null if not available
  const schoolAggregated = filteredSchoolData.length > 0 ? filteredSchoolData[0] : null;
  const stateAggregated = filteredStateData.length > 0 ? filteredStateData[0] : null;
  
  return (
    <ProficiencyByLevelTableUI
      entityData={schoolAggregated}
      stateData={stateAggregated}
      entityType="school"
      entityName={schoolName}
    />
  );
};

export default ProficiencyByLevelTable; 