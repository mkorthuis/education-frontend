import React from 'react';
import { useAppSelector } from '@/store/hooks';
import { 
  selectCurrentAssessmentDistrictData, 
  selectSelectedSubjectId,
  selectSelectedGradeId,
  selectSelectedSubgroupId,
  selectAssessmentSubgroups,
  selectCurrentAssessmentStateData
} from '@/store/slices/assessmentSlice';
import { ALL_STUDENTS_SUBGROUP_ID } from '@/features/district/utils/assessmentDataProcessing';
import AcademicHistoryChartUI from '@/components/ui/academic/AcademicHistoryChart';

const AcademicHistoryChart: React.FC = () => {
  // Get assessment data from Redux store
  const assessmentData = useAppSelector(selectCurrentAssessmentDistrictData);
  const stateAssessmentData = useAppSelector(selectCurrentAssessmentStateData);
  const selectedSubjectId = useAppSelector(selectSelectedSubjectId);
  const selectedGradeId = useAppSelector(selectSelectedGradeId);
  const selectedSubgroupId = useAppSelector(selectSelectedSubgroupId);
  const subgroups = useAppSelector(selectAssessmentSubgroups);
  
  // Find selected subgroup name
  const selectedSubgroupName = !selectedSubgroupId || selectedSubgroupId === ALL_STUDENTS_SUBGROUP_ID 
    ? null
    : subgroups.find(sg => sg.id === selectedSubgroupId)?.name || null;
  
  return (
    <AcademicHistoryChartUI
      assessmentData={assessmentData}
      stateAssessmentData={stateAssessmentData}
      selectedSubjectId={selectedSubjectId}
      selectedGradeId={selectedGradeId}
      selectedSubgroupId={selectedSubgroupId}
      selectedSubgroupName={selectedSubgroupName}
      entityType="district"
    />
  );
};

export default AcademicHistoryChart; 