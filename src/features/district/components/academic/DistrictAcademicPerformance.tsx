import React, { useEffect, useMemo } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';
import { Paper, Typography, Box } from '@mui/material';
import { useAppSelector } from '@/store/hooks';
import { fetchAssessmentDistrictData, selectAssessmentDistrictDataByParams, selectSelectedGradeId, selectSelectedSubgroupId, selectSelectedSubjectId } from '@/store/slices/assessmentSlice';
import { FISCAL_YEAR } from '@/utils/environment';

// Function to process district data into proficiency ranges
const processDistrictData = (districtData: any[]) => {
  // Initialize ranges (0-10%, 10-20%, etc.)
  const ranges = Array.from({ length: 10 }, (_, i) => ({
    name: `${i * 10}-${(i + 1) * 10}%`,
    count: 0
  }));

  // Count districts in each range
  districtData.forEach(district => {
    // Check for special exceptions first
    if (district.above_proficient_percentage_exception === 'SCORE_UNDER_10') {
      // Count districts with SCORE_UNDER_10 as 9% (first range: 0-10%)
      ranges[0].count++;
    } else if (district.above_proficient_percentage_exception === 'SCORE_OVER_90') {
      // Count districts with SCORE_OVER_90 as 91% (last range: 90-100%)
      ranges[9].count++;
    } else if (district.above_proficient_percentage !== null) {
      // Handle regular percentage values
      // Handle edge case of exactly 100%
      if (district.above_proficient_percentage === 100) {
        ranges[9].count++;
      } else {
        const rangeIndex = Math.floor(district.above_proficient_percentage / 10);
        if (rangeIndex >= 0 && rangeIndex < 10) {
          ranges[rangeIndex].count++;
        }
      }
    }
  });

  // Filter out empty ranges to keep the chart clean
  return ranges.filter(range => range.count > 0);
};

const DistrictAcademicPerformance: React.FC = () => {
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
    }
  }, [selectedSubjectId, selectedSubgroupId, selectedGradeId, dispatch, districtAssessmentData]);
  
  // Process the district data into ranges for the chart
  const chartData = useMemo(() => {
    return processDistrictData(districtAssessmentData);
  }, [districtAssessmentData]);

  return (
    <Paper sx={{ p: 3, mt: 4, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Distribution of Districts by Proficiency Levels
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Number of districts with students scoring at or above proficient in each percentage range
      </Typography>
      
      <Box sx={{ width: '100%', height: 350 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis 
              label={{ value: 'Number of Districts', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value) => [value, 'Districts']}
              labelFormatter={(value) => `Proficiency Range: ${value}`}
            />
            <Legend />
            <Bar dataKey="count" name="Number of Districts" fill="#1976d2" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
      
      {districtAssessmentData.length === 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
          No data available. Please select filters to view district data.
        </Typography>
      )}
    </Paper>
  );
};

export default DistrictAcademicPerformance; 