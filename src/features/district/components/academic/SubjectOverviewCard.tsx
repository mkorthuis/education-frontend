import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCurrentAssessmentDistrictData, 
  selectCurrentAssessmentStateData,
  selectSelectedGradeId,
  selectSelectedSubgroupId,
  selectSelectedSubjectId,
  fetchAssessmentStateData
} from '@/store/slices/assessmentSlice';
import {
  filterAssessmentResults,
  ALL_STUDENTS_SUBGROUP_ID,
  ALL_GRADES_ID
} from '@/features/district/utils/assessmentDataProcessing';
import { ASSESSMENT_YEAR } from '@/utils/environment';
import SubjectOverviewCardUI from '@/components/ui/academic/SubjectOverviewCard';

const SubjectOverviewCard: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // Get data from Redux store
  const districtData = useAppSelector(selectCurrentAssessmentDistrictData);
  const stateData = useAppSelector(selectCurrentAssessmentStateData);
  const selectedGradeId = useAppSelector(selectSelectedGradeId);
  const selectedSubgroupId = useAppSelector(selectSelectedSubgroupId);
  const selectedSubjectId = useAppSelector(selectSelectedSubjectId);
  
  // Fetch state assessment data if not available
  useEffect(() => {
    if (selectedSubjectId && stateData.length === 0) {
      dispatch(fetchAssessmentStateData({
        year: ASSESSMENT_YEAR,
        assessment_subject_id: selectedSubjectId,
        grade_id: selectedGradeId || undefined,
        assessment_subgroup_id: selectedSubgroupId || undefined
      }));
    }
  }, [dispatch, selectedSubjectId, selectedGradeId, selectedSubgroupId, stateData.length]);
  
  // Filter the district data based on selected grade and subgroup
  const filteredDistrictData = filterAssessmentResults(districtData, {
    year: ASSESSMENT_YEAR,
    assessment_subject_id: selectedSubjectId || undefined,
    grade_id: selectedGradeId || undefined,
    assessment_subgroup_id: selectedSubgroupId || undefined
  });
  
  // Filter state data to match the current selected grade and subgroup
  const filteredStateData = filterAssessmentResults(stateData, {
    year: ASSESSMENT_YEAR,
    assessment_subject_id: selectedSubjectId || undefined,
    grade_id: selectedGradeId || undefined,
    assessment_subgroup_id: selectedSubgroupId || undefined
  });
  
  // Get the first item from filtered data or null if not available
  const assessmentData = filteredDistrictData.length > 0 ? filteredDistrictData[0] : null;
  const stateAssessmentData = filteredStateData.length > 0 ? filteredStateData[0] : null;
  
  return (
    <SubjectOverviewCardUI
      assessmentData={assessmentData}
      stateAssessmentData={stateAssessmentData}
      selectedGradeId={selectedGradeId}
      selectedSubgroupId={selectedSubgroupId}
      entityType="district"
    />
  );
};

export default SubjectOverviewCard; 