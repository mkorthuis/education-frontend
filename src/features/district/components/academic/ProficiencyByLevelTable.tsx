import React from 'react';
import { useAppSelector } from '@/store/hooks';
import { 
  selectCurrentAssessmentDistrictData,
  selectCurrentAssessmentStateData,
  selectSelectedSubjectId,
  selectSelectedGradeId,
  selectSelectedSubgroupId,
} from '@/store/slices/assessmentSlice';
import { filterAssessmentResults } from '@/features/district/utils/assessmentDataProcessing';
import { ASSESSMENT_YEAR } from '@/utils/environment';
import ProficiencyByLevelTableUI from '@/components/ui/academic/ProficiencyByLevelTable';

interface ProficiencyByLevelTableProps {
  districtName?: string;
}

const ProficiencyByLevelTable: React.FC<ProficiencyByLevelTableProps> = ({ 
  districtName = 'District'
}) => {
  // Get data from Redux store
  const districtData = useAppSelector(selectCurrentAssessmentDistrictData);
  const stateData = useAppSelector(selectCurrentAssessmentStateData);
  const selectedSubjectId = useAppSelector(selectSelectedSubjectId);
  const selectedGradeId = useAppSelector(selectSelectedGradeId);
  const selectedSubgroupId = useAppSelector(selectSelectedSubgroupId);
  
  // Filter both district and state data based on current selections
  const filteredDistrictData = filterAssessmentResults(districtData, {
    year: ASSESSMENT_YEAR,
    assessment_subject_id: selectedSubjectId || undefined,
    grade_id: selectedGradeId || undefined,
    assessment_subgroup_id: selectedSubgroupId || undefined
  });

  const filteredStateData = filterAssessmentResults(stateData, {
    year: ASSESSMENT_YEAR,
    assessment_subject_id: selectedSubjectId || undefined,
    grade_id: selectedGradeId || undefined,
    assessment_subgroup_id: selectedSubgroupId || undefined
  });

  // Aggregate data - use the first result since we're filtering to specific criteria
  const districtAggregated = filteredDistrictData.length > 0 ? filteredDistrictData[0] : null;
  const stateAggregated = filteredStateData.length > 0 ? filteredStateData[0] : null;
  
  return (
    <ProficiencyByLevelTableUI
      entityData={districtAggregated}
      stateData={stateAggregated}
      entityType="district"
      entityName={districtName}
    />
  );
};

export default ProficiencyByLevelTable; 