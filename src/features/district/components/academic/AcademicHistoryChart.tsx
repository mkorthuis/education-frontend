import React, { useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { Typography, Box, useMediaQuery } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAppSelector } from '@/store/hooks';
import { 
  selectCurrentAssessmentDistrictData, 
  selectSelectedSubjectId,
  selectSelectedGradeId,
  selectSelectedSubgroupId,
  selectSelectedSubject,
  selectAssessmentSubgroups
} from '@/store/slices/assessmentSlice';
import { 
  filterAssessmentResults, 
  ALL_STUDENTS_SUBGROUP_ID
} from '@/features/district/utils/assessmentDataProcessing';
import { formatCompactNumber } from '@/utils/formatting';

interface ChartDataPoint {
  year: number;
  formattedYear: string;
  allStudentsPercentage: number | null;
  allStudentsException: string | null;
  selectedSubgroupPercentage: number | null;
  selectedSubgroupException: string | null;
  selectedSubgroupName: string | null;
}

const AcademicHistoryChart: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Get assessment data from Redux store
  const assessmentData = useAppSelector(selectCurrentAssessmentDistrictData);
  const selectedSubjectId = useAppSelector(selectSelectedSubjectId);
  const selectedGradeId = useAppSelector(selectSelectedGradeId);
  const selectedSubgroupId = useAppSelector(selectSelectedSubgroupId);
  const selectedSubject = useAppSelector(selectSelectedSubject);
  const subgroups = useAppSelector(selectAssessmentSubgroups);
  
  // Find selected subgroup name
  const selectedSubgroupName = useMemo(() => {
    if (!selectedSubgroupId || selectedSubgroupId === ALL_STUDENTS_SUBGROUP_ID) return null;
    const subgroup = subgroups.find(sg => sg.id === selectedSubgroupId);
    return subgroup?.name || null;
  }, [selectedSubgroupId, subgroups]);
  
  // Helper function to handle special exceptions
  const processExceptionValue = (percentage: number | null, exception: string | null): number | null => {
    if (percentage !== null) return percentage;
    
    if (exception === 'SCORE_UNDER_10') return 10;
    if (exception === 'SCORE_OVER_90') return 90;
    
    return null;
  };
  
  // Prepare chart data based on the selections
  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (!assessmentData || assessmentData.length === 0 || !selectedSubjectId) return [];
    
    // Filter relevant data
    const filteredBySubjectData = filterAssessmentResults(assessmentData, {
      assessment_subject_id: selectedSubjectId
    });
    
    // Prepare data for the chart
    // Get all available years
    const availableYears = [...new Set(filteredBySubjectData.map(item => item.year))].sort();
    
    return availableYears.map(year => {
      // Filter data for current year and selected subject
      const yearData = filterAssessmentResults(filteredBySubjectData, { year: year.toString() });
      
      // Get 'All Students' data for this year
      const allStudentsData = filterAssessmentResults(yearData, {
        grade_id: selectedGradeId || undefined,
        assessment_subgroup_id: ALL_STUDENTS_SUBGROUP_ID
      });
      
      // Get selected subgroup data if applicable
      const selectedSubgroupData = selectedSubgroupId !== ALL_STUDENTS_SUBGROUP_ID && selectedSubgroupId !== null
        ? filterAssessmentResults(yearData, {
            grade_id: selectedGradeId || undefined,
            assessment_subgroup_id: selectedSubgroupId
          })
        : [];
      
      // Get above proficient values from the filtered data
      const allStudentsAboveProficient = allStudentsData.length > 0 
        ? allStudentsData[0].above_proficient_percentage
        : null;
        
      const allStudentsException = allStudentsData.length > 0 
        ? allStudentsData[0].above_proficient_percentage_exception
        : null;
        
      const selectedSubgroupAboveProficient = selectedSubgroupData.length > 0
        ? selectedSubgroupData[0].above_proficient_percentage 
        : null;
        
      const selectedSubgroupException = selectedSubgroupData.length > 0
        ? selectedSubgroupData[0].above_proficient_percentage_exception
        : null;
      
      // Process values to handle special exceptions
      const processedAllStudentsPercentage = processExceptionValue(
        allStudentsAboveProficient, 
        allStudentsException
      );
      
      const processedSelectedSubgroupPercentage = processExceptionValue(
        selectedSubgroupAboveProficient, 
        selectedSubgroupException
      );
      
      return {
        year,
        formattedYear: `${year-1}-${year.toString().substring(2)}`, // Format like "2022-23"
        allStudentsPercentage: processedAllStudentsPercentage,
        allStudentsException,
        selectedSubgroupPercentage: processedSelectedSubgroupPercentage,
        selectedSubgroupException,
        selectedSubgroupName
      };
    });
  }, [assessmentData, selectedSubjectId, selectedGradeId, selectedSubgroupId, selectedSubgroupName]);
  
  // Calculate Y-axis domain based on data values
  const yAxisDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 100]; // Default fallback
    
    // Collect all percentage values, filtering out nulls
    const allPercentages: number[] = [];
    
    chartData.forEach(dataPoint => {
      if (dataPoint.allStudentsPercentage !== null) {
        allPercentages.push(dataPoint.allStudentsPercentage);
      }
      if (dataPoint.selectedSubgroupPercentage !== null) {
        allPercentages.push(dataPoint.selectedSubgroupPercentage);
      }
    });
    
    if (allPercentages.length === 0) return [0, 100]; // No valid data points
    
    // Find min and max values
    let minValue = Math.min(...allPercentages);
    let maxValue = Math.max(...allPercentages);
    
    // Add padding (10% of the range)
    const range = maxValue - minValue;
    const padding = Math.max(range * 0.1, 5); // At least 5 percentage points padding
    
    // Set min and max with padding, but never go below 0 or above 100 (these are percentages)
    minValue = Math.max(0, Math.floor(minValue - padding));
    maxValue = Math.min(100, Math.ceil(maxValue + padding));
    
    // If range is still very small, expand it a bit more for visual clarity
    if (maxValue - minValue < 10) {
      minValue = Math.max(0, minValue - 5);
      maxValue = Math.min(100, maxValue + 5);
    }
    
    return [minValue, maxValue];
  }, [chartData]);
  
  // Format tooltip values
  const formatTooltipValue = (value: number | null, exception: string | null) => {
    if (exception) {
      // Return the exception text, but with special handling for our specific cases
      if (exception === 'SCORE_UNDER_10') return 'Less than 10%';
      if (exception === 'SCORE_OVER_90') return 'Greater than 90%';
      return exception;
    }
    
    if (value === null) return 'N/A';
    return `${value.toFixed(1)}%`;
  };
  
  // Customize tooltip appearance
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: 'background.paper',
            p: 1.5,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            boxShadow: 1,
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            {`Academic Year ${label}`}
          </Typography>
          
          {payload.map((entry: any, index: number) => {
            if (entry.value === null) return null;
            
            const dataPoint = chartData.find(d => d.formattedYear === label);
            let exception: string | null = null;
            
            if (dataPoint) {
              exception = entry.dataKey === 'allStudentsPercentage' 
                ? dataPoint.allStudentsException 
                : dataPoint.selectedSubgroupException;
            }
            
            return (
              <Typography
                key={`tooltip-${index}`}
                variant="body2"
                sx={{ color: entry.color, mb: 0.5 }}
              >
                {`${entry.name}: ${formatTooltipValue(entry.value, exception)}`}
              </Typography>
            );
          })}
        </Box>
      );
    }
    return null;
  };
  
  // Handle no data case
  if (chartData.length === 0) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          No historical data available for the selected subject.
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ mt: 4 }}>
      <Typography 
        variant="h6" 
        sx={{ 
          textAlign: "center",
          width: "100%"
        }} 
        gutterBottom
      >
        {selectedSubject?.description} Proficiency Over Time
      </Typography>
      
      <Box sx={{ height: isMobile ? 300 : 400, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 20,
              left: 10,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="formattedYear"
              tick={{ fontSize: theme.typography.body2.fontSize }}
            />
            <YAxis
              domain={yAxisDomain}
              tickFormatter={(value) => `${value}%`}
              tick={{ fontSize: theme.typography.body2.fontSize }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ 
                fontSize: theme.typography.body2.fontSize 
              }} 
            />
            <Line
              type="monotone"
              dataKey="allStudentsPercentage"
              name="All Students"
              stroke={theme.palette.primary.main}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              connectNulls
            />
            {selectedSubgroupId !== null && selectedSubgroupId !== ALL_STUDENTS_SUBGROUP_ID && (
              <Line
                type="monotone"
                dataKey="selectedSubgroupPercentage"
                name={selectedSubgroupName || "Selected Subgroup"}
                stroke={theme.palette.secondary.main}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default AcademicHistoryChart; 