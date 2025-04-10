import React, { useEffect } from 'react';
import { Card, CardContent, Typography, Box, Divider } from '@mui/material';
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
import { FISCAL_YEAR } from '@/utils/environment';

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
        year: FISCAL_YEAR,
        assessment_subject_id: selectedSubjectId,
        grade_id: selectedGradeId || undefined,
        assessment_subgroup_id: selectedSubgroupId || undefined
      }));
    }
  }, [dispatch, selectedSubjectId, selectedGradeId, selectedSubgroupId, stateData.length]);
  
  // Filter the district data based on selected grade and subgroup
  const filteredDistrictData = filterAssessmentResults(districtData, {
    year: FISCAL_YEAR,
    assessment_subject_id: selectedSubjectId || undefined,
    grade_id: selectedGradeId || undefined,
    assessment_subgroup_id: selectedSubgroupId || undefined
  });
  
  // Filter state data to match the current selected grade and subgroup
  const filteredStateData = filterAssessmentResults(stateData, {
    year: FISCAL_YEAR,
    assessment_subject_id: selectedSubjectId || undefined,
    grade_id: selectedGradeId || undefined,
    assessment_subgroup_id: selectedSubgroupId || undefined
  });
  
  // Return empty if no data is available
  if (filteredDistrictData.length === 0) {
    return null;
  }
  
  const assessmentData = filteredDistrictData[0];
  const stateAssessmentData = filteredStateData.length > 0 
    ? filteredStateData[0] 
    : { above_proficient_percentage: null, above_proficient_percentage_exception: null };
  
  // Handle potential null values and exceptions
  const proficiencyPercentage = assessmentData.above_proficient_percentage !== null
    ? `${assessmentData.above_proficient_percentage.toFixed(1)}%`
    : (assessmentData.above_proficient_percentage_exception === 'SCORE_UNDER_10'
      ? '<10%'
      : assessmentData.above_proficient_percentage_exception === 'SCORE_OVER_90'
        ? '>90%'
        : assessmentData.above_proficient_percentage_exception || 'N/A');
  
  const statePercentage = stateAssessmentData.above_proficient_percentage !== null
    ? `${stateAssessmentData.above_proficient_percentage.toFixed(1)}%`
    : (stateAssessmentData.above_proficient_percentage_exception === 'SCORE_UNDER_10'
      ? '<10%'
      : stateAssessmentData.above_proficient_percentage_exception === 'SCORE_OVER_90'
        ? '>90%'
        : stateAssessmentData.above_proficient_percentage_exception || 'N/A');
  
  const participationRate = assessmentData.participate_percentage !== null
    ? `${assessmentData.participate_percentage.toFixed(1)}%`
    : 'N/A';
  
  // Get grade name but don't display if it's All Grades
  const gradeId = assessmentData.grade?.id || selectedGradeId;
  const gradeName = (gradeId === ALL_GRADES_ID || gradeId === null) 
    ? '' 
    : `${assessmentData.grade?.name || ''} `;
  
  // Get subgroup name but don't display if it's All Students
  const subgroupId = assessmentData.assessment_subgroup?.id || selectedSubgroupId;
  const subgroupName = (subgroupId === ALL_STUDENTS_SUBGROUP_ID || subgroupId === null) 
    ? '' 
    : `${assessmentData.assessment_subgroup?.name || ''} `;
  
  const studentCount = assessmentData.total_fay_students_low === assessmentData.total_fay_students_high
    ? assessmentData.total_fay_students_low
    : `${assessmentData.total_fay_students_low}-${assessmentData.total_fay_students_high}`;

  return (
    <Card sx={{ border: '1px solid', borderColor: 'divider', backgroundColor: 'grey.100' }}>
      <CardContent>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" fontWeight="bold">
            {proficiencyPercentage} {gradeName}{subgroupName}Students Meet Grade Level Proficiency.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            {statePercentage} State Average
          </Typography>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box>
          <Typography variant="body1">
            {studentCount} {gradeName}{subgroupName}Students Took The Test.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            {participationRate} Participation Rate.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SubjectOverviewCard; 