import React, { useEffect, useMemo } from 'react';
import { Card, CardContent, Typography, Box, Divider, CardActionArea, useMediaQuery } from '@mui/material';
import { 
  setSelectedSubjectId, 
  fetchAssessmentDistrictData, 
  selectCurrentAssessmentDistrictData, 
  selectCurrentAssessmentStateData,
  selectSelectedSubjectId,
  selectAssessmentDistrictLoadingStatus,
  selectAssessmentDistrictData
} from '@/store/slices/assessmentSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  filterAssessmentResults,
  ALL_STUDENTS_SUBGROUP_ID,
  ALL_GRADES_ID,
  getDistrictRankInfo,
  EARLIEST_YEAR
} from '@/features/district/utils/assessmentDataProcessing';
import { FISCAL_YEAR } from '@/utils/environment';
import { useParams } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';

interface MeasurementCardProps {
  assessment_subject_id: number;
  totalCount?: number;
  index?: number;
}

const MeasurementCard: React.FC<MeasurementCardProps> = ({
  assessment_subject_id,
  totalCount = 1
}) => {
  const { id } = useParams<{ id: string }>();
  const currentDistrictId = id ? parseInt(id) : null;
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Get data from Redux store
  const districtData = useAppSelector(selectCurrentAssessmentDistrictData);
  const stateData = useAppSelector(selectCurrentAssessmentStateData);
  const selectedSubjectId = useAppSelector(selectSelectedSubjectId);
  
  // Create params object for this card's data
  const queryParams = useMemo(() => ({
    year: FISCAL_YEAR,
    assessment_subgroup_id: ALL_STUDENTS_SUBGROUP_ID,
    assessment_subject_id: assessment_subject_id,
    grade_id: ALL_GRADES_ID
  }), [assessment_subject_id]);
  
  // Use parameterized loading selector
  const isDistrictDataLoading = useAppSelector(state => selectAssessmentDistrictLoadingStatus(state, queryParams));
  
  // Check if any subject is selected and if we're on mobile
  const isCollapsed = isMobile && selectedSubjectId !== null;
  
  // Check if this card is the selected one
  const isSelected = selectedSubjectId === assessment_subject_id;
  
  // Use the memoized selector
  const districtAssessmentData = useAppSelector(state => selectAssessmentDistrictData(state, queryParams));

  useEffect(() => {
    if(districtAssessmentData.length === 0 && !isDistrictDataLoading) {
      dispatch(fetchAssessmentDistrictData(queryParams));
    }
  }, [dispatch, districtAssessmentData, queryParams, isDistrictDataLoading]);

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
  const proficiencyPercentage = assessmentData?.above_proficient_percentage !== null && assessmentData?.above_proficient_percentage !== undefined
    ? `${assessmentData.above_proficient_percentage.toFixed(1)}%`
    : (assessmentData?.above_proficient_percentage_exception === 'SCORE_UNDER_10'
      ? '<10%'
      : assessmentData?.above_proficient_percentage_exception === 'SCORE_OVER_90'
        ? '>90%'
        : assessmentData?.above_proficient_percentage_exception || 'N/A');
  
  const statePercentage = stateAssessmentData?.above_proficient_percentage !== null && stateAssessmentData?.above_proficient_percentage !== undefined
    ? `${stateAssessmentData.above_proficient_percentage.toFixed(1)}%`
    : (stateAssessmentData?.above_proficient_percentage_exception === 'SCORE_UNDER_10'
      ? '<10%'
      : stateAssessmentData?.above_proficient_percentage_exception === 'SCORE_OVER_90'
        ? '>90%'
        : stateAssessmentData?.above_proficient_percentage_exception || 'N/A');
 
  // Calculate district rank
  const { rank, total } = useMemo(() => {
    return getDistrictRankInfo(districtAssessmentData, currentDistrictId);
  }, [districtAssessmentData, currentDistrictId]);

  const previousYearData = filterAssessmentResults(districtData, {
    year: EARLIEST_YEAR.toString(),
    assessment_subject_id: assessment_subject_id,
    grade_id: ALL_GRADES_ID,
    assessment_subgroup_id: ALL_STUDENTS_SUBGROUP_ID
  })[0];

  const scoreDelta = (assessmentData?.above_proficient_percentage && previousYearData?.above_proficient_percentage) 
    ? assessmentData.above_proficient_percentage - previousYearData.above_proficient_percentage 
    : null;

  // Generate the appropriate message based on scoreDelta value
  const getScoreDeltaText = () => {
    if (scoreDelta === null) return '';
    
    if (scoreDelta === 0) {
      return 'No Change in Proficient Students Since ' + EARLIEST_YEAR;
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

  const cardStyles = {
    border: '1px solid', 
    borderColor: 'divider', 
    backgroundColor: isSelected ? 'grey.300' : 'grey.100', 
    mb: isCollapsed ? 0 : 2,
    flex: isCollapsed ? { xs: '1 1 0', md: '1 0 auto' } : '1 0 auto',
    minWidth: isCollapsed ? { xs: 0, md: '100%' } : '100%',
    marginRight: isCollapsed ? { xs: '8px', md: 0 } : 0,
    '&:last-child': {
      marginRight: 0
    },
    transition: 'all 0.3s ease'
  };

  const contentStyles = { 
    py: isCollapsed ? 1 : 2,
    px: 2,
    '&:last-child': { pb: isCollapsed ? 1 : 2 }
  };

  const titleStyles = {
    whiteSpace: isCollapsed ? 'normal' : 'initial',
    textAlign: isCollapsed ? 'center' : 'left'
  };

  return (
    <Card 
      sx={cardStyles}
      onClick={handleCardClick}
    >
      <CardActionArea>
        <CardContent sx={contentStyles}>
          <Typography 
            variant="body1"
            fontWeight="bold" 
            gutterBottom={!isCollapsed}
            noWrap={isCollapsed}
            sx={titleStyles}
          >
            {assessmentData?.assessment_subject?.description || "Unknown Subject"}
          </Typography>
          
          {/* Only show detailed content when not collapsed */}
          {!isCollapsed && (
            <>
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
                    <>{getScoreDeltaText()} Since {EARLIEST_YEAR}</>
                  }
                </Typography>
              </Box>
            </>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default MeasurementCard;
