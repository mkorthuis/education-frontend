import React, { useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';
import { 
  selectCurrentAssessmentSchoolData, 
  selectCurrentAssessmentStateData,
  selectSelectedSubjectId,
  selectSelectedGradeId,
  selectSelectedSubgroupId,
  selectAssessmentSubgroups
} from '@/store/slices/assessmentSlice';
import { ALL_STUDENTS_SUBGROUP_ID } from '@/features/district/utils/assessmentDataProcessing';
import AcademicHistoryChartUI from '@/components/ui/academic/AcademicHistoryChart';

const AcademicHistoryChart: React.FC = () => {
  // Get assessment data and filter selections
  const assessmentData = useAppSelector(selectCurrentAssessmentSchoolData);
  const stateAssessmentData = useAppSelector(selectCurrentAssessmentStateData);
  const selectedSubjectId = useAppSelector(selectSelectedSubjectId);
  const selectedGradeId = useAppSelector(selectSelectedGradeId);
  const selectedSubgroupId = useAppSelector(selectSelectedSubgroupId);
  const subgroups = useAppSelector(selectAssessmentSubgroups);
  
  // Determine subgroup name for display
  const selectedSubgroupName = useMemo(() => {
    if (!selectedSubgroupId || selectedSubgroupId === ALL_STUDENTS_SUBGROUP_ID) return null;
    return subgroups.find(sg => sg.id === selectedSubgroupId)?.name || null;
  }, [selectedSubgroupId, subgroups]);
  
  return (
    <AcademicHistoryChartUI
      assessmentData={assessmentData}
      stateAssessmentData={stateAssessmentData}
      selectedSubjectId={selectedSubjectId}
      selectedGradeId={selectedGradeId}
      selectedSubgroupId={selectedSubgroupId}
      selectedSubgroupName={selectedSubgroupName}
      entityType="school"
    />
  );
};

export default AcademicHistoryChart; 