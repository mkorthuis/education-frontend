import React, { useEffect, useMemo } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { useParams } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  Label
} from 'recharts';
import { Paper, Typography, Box } from '@mui/material';
import { useAppSelector } from '@/store/hooks';
import { 
  fetchAssessmentDistrictData, 
  fetchAssessmentStateData,
  selectAssessmentDistrictDataByParams, 
  selectCurrentAssessmentStateData,
  selectSelectedGradeId, 
  selectSelectedSubgroupId, 
  selectSelectedSubjectId 
} from '@/store/slices/assessmentSlice';
import { FISCAL_YEAR } from '@/utils/environment';
import { filterAssessmentResults } from '@/features/district/utils/assessmentDataProcessing';

// Color constants for better consistency
const COLOR_CURRENT_DISTRICT = '#1976d2'; // Blue for current district
const COLOR_STATE_AVERAGE = '#4CAF50'; // Green for state average
const COLOR_OTHER_DISTRICTS = '#9e9e9e'; // Grey for other districts

// Function to get the proficiency range index for a percentage value
const getProficiencyRangeIndex = (percentage: number | null, exception: string | null) => {
  if (exception === 'SCORE_UNDER_10') {
    return 9; // Treat as 9%
  } else if (exception === 'SCORE_OVER_90') {
    return 91; // Treat as 91%
  } else if (percentage !== null) {
    // Round to the nearest integer (1% increment)
    return Math.round(percentage);
  }
  return -1; // Invalid or missing data
};

// Function to calculate state average proficiency percentage
const calculateStateAverage = (stateData: any[]) => {
  if (!stateData || stateData.length === 0) return null;
  
  // Handle special cases first
  const stateItem = stateData[0]; // Assuming we're using the first state record
  
  if (stateItem.above_proficient_percentage_exception === 'SCORE_UNDER_10') {
    return 9; // Treat as 9%
  } else if (stateItem.above_proficient_percentage_exception === 'SCORE_OVER_90') {
    return 91; // Treat as 91%
  } else if (stateItem.above_proficient_percentage !== null) {
    return Math.round(stateItem.above_proficient_percentage);
  }
  
  return null;
};

// Function to process district data into 1% increment bars
const processDistrictData = (districtData: any[], currentDistrictId: number | null) => {
  // Initialize 100 bars (0% to 100%)
  const percentageBars = Array.from({ length: 101 }, (_, i) => ({
    percentage: i,
    count: 0,
    isCurrentDistrict: false
  }));

  // Find the current district and its proficiency percentage
  let currentDistrictPercentage = -1;
  if (currentDistrictId) {
    const currentDistrict = districtData.find(d => d.district_id === currentDistrictId);
    if (currentDistrict) {
      currentDistrictPercentage = getProficiencyRangeIndex(
        currentDistrict.above_proficient_percentage, 
        currentDistrict.above_proficient_percentage_exception
      );
    }
  }

  // Count districts at each percentage level
  districtData.forEach(district => {
    const percentageIndex = getProficiencyRangeIndex(
      district.above_proficient_percentage,
      district.above_proficient_percentage_exception
    );
    
    if (percentageIndex >= 0 && percentageIndex <= 100) {
      percentageBars[percentageIndex].count++;
    }
  });

  // Mark the bar that contains the current district
  if (currentDistrictPercentage >= 0 && currentDistrictPercentage <= 100) {
    percentageBars[currentDistrictPercentage].isCurrentDistrict = true;
  }

  // Return all bars including zeros to show the complete spectrum
  return percentageBars;
};

// Custom X-axis tick formatter to show ticks only at 10% intervals
const formatXAxisTick = (value: number) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  if (value % 10 === 0) {
    // For the value 100, don't add the percentage sign on mobile
    if (value === 100 && isMobile) {
      return '100';
    }
    return `${value}%`;
  }
  return '';
};

// Function to get district rank information
const getDistrictRankInfo = (districtData: any[], currentDistrictId: number | null) => {
  if (!districtData || districtData.length === 0 || !currentDistrictId) {
    return { rank: null, total: 0 };
  }
  
  // Only count districts with valid proficiency data
  const districtsWithData = districtData.filter(d => 
    d.above_proficient_percentage !== null || 
    d.above_proficient_percentage_exception === 'SCORE_UNDER_10' || 
    d.above_proficient_percentage_exception === 'SCORE_OVER_90'
  );
  
  const total = districtsWithData.length;
  
  // Find current district
  const currentDistrict = districtsWithData.find(d => d.district_id === currentDistrictId);
  if (!currentDistrict) {
    return { rank: null, total };
  }
  
  // Get normalized proficiency percentage for current district
  const currentProficiency = getProficiencyRangeIndex(
    currentDistrict.above_proficient_percentage,
    currentDistrict.above_proficient_percentage_exception
  );
  
  if (currentProficiency === -1) {
    return { rank: null, total };
  }
  
  // Count districts with higher proficiency
  // (rank 1 is the highest proficiency)
  const districtsWithHigherProficiency = districtsWithData.filter(d => {
    const proficiency = getProficiencyRangeIndex(
      d.above_proficient_percentage,
      d.above_proficient_percentage_exception
    );
    return proficiency > currentProficiency;
  }).length;
  
  // Calculate rank (1 is best - highest proficiency)
  const rank = districtsWithHigherProficiency + 1;
  
  return { rank, total };
};

const DistrictAcademicPerformance: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const currentDistrictId = id ? parseInt(id) : null;
  
  const selectedSubjectId = useAppSelector(selectSelectedSubjectId);
  const selectedSubgroupId = useAppSelector(selectSelectedSubgroupId);
  const selectedGradeId = useAppSelector(selectSelectedGradeId);
  const dispatch = useAppDispatch();
  
  const districtAssessmentData = useAppSelector(selectAssessmentDistrictDataByParams({
    year: FISCAL_YEAR,
    assessment_subgroup_id: selectedSubgroupId || undefined,
    assessment_subject_id: selectedSubjectId || undefined,
    grade_id: selectedGradeId || undefined
  }));
  
  const stateAssessmentData = useAppSelector(selectCurrentAssessmentStateData);

  useEffect(() => {
    if(selectedSubgroupId && selectedSubjectId && selectedGradeId) {
        if(districtAssessmentData.length === 0) {
          dispatch(fetchAssessmentDistrictData({
            year: FISCAL_YEAR,
            assessment_subgroup_id: selectedSubgroupId,
            assessment_subject_id: selectedSubjectId,
            grade_id: selectedGradeId
          }));
        }
        
        if(stateAssessmentData.length === 0) {
          dispatch(fetchAssessmentStateData({
            year: FISCAL_YEAR,
            assessment_subgroup_id: selectedSubgroupId,
            assessment_subject_id: selectedSubjectId,
            grade_id: selectedGradeId
          }));
        }
    }
  }, [selectedSubjectId, selectedSubgroupId, selectedGradeId, dispatch, districtAssessmentData, stateAssessmentData]);
  
  // Process the district data into ranges for the chart
  const chartData = useMemo(() => {
    return processDistrictData(districtAssessmentData, currentDistrictId);
  }, [districtAssessmentData, currentDistrictId]);
  
  // Calculate state average
  const stateAverage = useMemo(() => {
    // Filter state data using the utility function
    const filteredStateData = filterAssessmentResults(stateAssessmentData, {
      year: FISCAL_YEAR,
      assessment_subgroup_id: selectedSubgroupId || undefined,
      assessment_subject_id: selectedSubjectId || undefined,
      grade_id: selectedGradeId || undefined
    });
    
    return calculateStateAverage(filteredStateData);
  }, [stateAssessmentData, selectedSubjectId, selectedSubgroupId, selectedGradeId]);
  
  // Calculate district rank
  const { rank, total } = useMemo(() => {
    return getDistrictRankInfo(districtAssessmentData, currentDistrictId);
  }, [districtAssessmentData, currentDistrictId]);

  return (
    <Paper sx={{ p: 1, mt: 2, mb: 2 }}>
      <Typography variant="h6" sx={{ mb: 0.5 }}>
       % Students Proficient In Each District
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        Your district is <span style={{ color: COLOR_CURRENT_DISTRICT, fontWeight: 'bold' }}>blue</span>
        {rank !== null && total > 0 ? `. Ranked #${rank}/${total} districts` : ''}.
      </Typography>
      
      <Box sx={{ width: '100%', height: 350 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 15, // Increased top margin to accommodate the state average text
              right: 5,
              left: 5,
              bottom: 15,
            }}
            barCategoryGap={0}
            barGap={0}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="percentage" 
              domain={[0, 100]}
              tickFormatter={formatXAxisTick}
              ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
              tick={{ fontSize: 10 }}
              height={20}
            />
            <YAxis 
              allowDecimals={false}
              tick={{ fontSize: 10 }}
              width={25}
            />
            <Tooltip 
              formatter={(value) => [value, 'Districts']}
              labelFormatter={(percentage) => `Proficiency: ${percentage}%`}
            />
            {stateAverage !== null && (
              <ReferenceLine 
                x={stateAverage} 
                stroke={COLOR_STATE_AVERAGE} 
                strokeWidth={2}
                strokeDasharray="5 5"
                isFront={true}
              >
                <Label
                  value={`State Average: ${stateAverage}%`}
                  position="top"
                  fill={COLOR_STATE_AVERAGE}
                  fontSize={12}
                  fontWeight={600}
                  offset={0}
                  dx={65}
                  dy={20}
                />
              </ReferenceLine>
            )}
            <Bar dataKey="count" name="Districts" minPointSize={1}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.isCurrentDistrict ? COLOR_CURRENT_DISTRICT : COLOR_OTHER_DISTRICTS} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
      
      {districtAssessmentData.length === 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
          No data available. Please select filters to view district data.
        </Typography>
      )}
    </Paper>
  );
};

export default DistrictAcademicPerformance; 