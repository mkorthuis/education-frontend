import React, { useEffect, useMemo } from 'react';
import { Card, CardContent, Typography, Paper, Box, Divider } from '@mui/material';
import { setSelectedSubjectId, fetchAssessmentStateData, fetchAssessmentDistrictData, selectAssessmentDistrictDataByParams } from '@/store/slices/assessmentSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { 
  selectCurrentAssessmentDistrictData, 
  selectCurrentAssessmentStateData,
  selectSelectedGradeId,
  selectSelectedSubgroupId
} from '@/store/slices/assessmentSlice';
import {
  filterAssessmentResults,
  ALL_STUDENTS_SUBGROUP_ID,
  ALL_GRADES_ID,
  getDistrictRankInfo
} from '@/features/district/utils/assessmentDataProcessing';
import { FISCAL_YEAR } from '@/utils/environment';
import { useParams } from 'react-router-dom';

interface MeasurementCardProps {
  assessment_subject_id: number;
}

const MeasurementCard: React.FC<MeasurementCardProps> = ({
  assessment_subject_id
}) => {
  const { id } = useParams<{ id: string }>();
  const currentDistrictId = id ? parseInt(id) : null;
  const dispatch = useAppDispatch();
  
  // Get data from Redux store
  const districtData = useAppSelector(selectCurrentAssessmentDistrictData);
  const stateData = useAppSelector(selectCurrentAssessmentStateData);
  
  const districtAssessmentData = useAppSelector(selectAssessmentDistrictDataByParams({
    year: FISCAL_YEAR,
    assessment_subgroup_id: ALL_STUDENTS_SUBGROUP_ID,
    assessment_subject_id: assessment_subject_id,
    grade_id: ALL_GRADES_ID
  }));

  useEffect(() => {
    if(districtAssessmentData.length === 0) {
        dispatch(fetchAssessmentDistrictData({
        year: FISCAL_YEAR,
        assessment_subgroup_id: ALL_STUDENTS_SUBGROUP_ID,
        assessment_subject_id: assessment_subject_id,
        grade_id: ALL_GRADES_ID
        }));
    }
  }, [dispatch, districtAssessmentData]);


  const handleCardClick = () => {
    dispatch(setSelectedSubjectId(assessment_subject_id));
  };

  // Filter the district data based on selected grade and subgroup
  const filteredDistrictData = filterAssessmentResults(districtData, {
    year: FISCAL_YEAR,
    assessment_subject_id: assessment_subject_id,
    grade_id: ALL_GRADES_ID,
    assessment_subgroup_id: ALL_STUDENTS_SUBGROUP_ID
  });
  
  // Filter state data to match the current selected grade and subgroup
  const filteredStateData = filterAssessmentResults(stateData, {
    year: FISCAL_YEAR,
    assessment_subject_id: assessment_subject_id,
    grade_id: ALL_GRADES_ID,
    assessment_subgroup_id: ALL_STUDENTS_SUBGROUP_ID
  });
  
  
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
 
    // Calculate district rank
    const { rank, total } = useMemo(() => {
        return getDistrictRankInfo(districtAssessmentData, currentDistrictId);
      }, [districtAssessmentData, currentDistrictId]);

    const previousYearData = filterAssessmentResults(districtData, {
        year: '2019',
        assessment_subject_id: assessment_subject_id,
        grade_id: ALL_GRADES_ID,
        assessment_subgroup_id: ALL_STUDENTS_SUBGROUP_ID
    })[0];

    const scoreDelta = (assessmentData.above_proficient_percentage && previousYearData.above_proficient_percentage) ?
    assessmentData.above_proficient_percentage - previousYearData.above_proficient_percentage : null;

    // Generate the appropriate message based on scoreDelta value
    const getScoreDeltaText = () => {
      if (scoreDelta === null) return '';
      
      if (scoreDelta === 0) {
        return 'No Change in Proficient Students Since 2019';
      } else if (scoreDelta < 0) {
        return (
          <Typography component="span" variant="body2" color="error">
            {Math.abs(scoreDelta)}% Decrease
          </Typography>
        );
      } else {
        return (
          <Typography component="span" variant="body2" color="success.main">
            {scoreDelta}% Increase
          </Typography>
        );
      }
    };


  return (
    <Card 
      elevation={2}
      sx={{
        minWidth: 200,
        height: '100%',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
          cursor: 'pointer'
        }
      }}
      onClick={handleCardClick}
    >
      <CardContent>
        <Typography variant="h6" component="div" fontWeight="bold" sx={{ mb: 1.5 }}>
          {assessmentData.assessment_subject?.description}
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="bold">
          {proficiencyPercentage} Students Proficient
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            {statePercentage} State Average
          </Typography>
        </Box>
        
        <Divider sx={{ my: 1 }} />
        
        <Box>
          <Typography variant="body2">
           {rank !== null && total > 0 ? `Ranked #${rank} out of ${total} districts` : ''}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            {scoreDelta === 0 || scoreDelta === null ? 
              getScoreDeltaText() : 
              <>{getScoreDeltaText()} Since 2019</>
            }
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default MeasurementCard;
