import React, { useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { Typography, Box, useMediaQuery } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAppSelector } from '@/store/hooks';
import {
  selectDistrictRestraintData,
  selectStateRestraintData,
  selectDistrictEnrollmentData,
  selectStateEnrollmentData
} from '@/store/slices/safetySlice';
import { selectCurrentDistrict } from '@/store/slices/locationSlice';
import { calculatePer100Students } from '@/features/district/utils/safetyDataProcessing';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';

interface RestraintTrendChartProps {
  className?: string;
}

// Define the chart data type for type safety
interface ChartDataPoint {
  year: string;
  formattedYear: string;
  district: number;
  state: number | null;
}

const RestraintTrendChart: React.FC<RestraintTrendChartProps> = ({ className }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Get the current district
  const district = useAppSelector(selectCurrentDistrict);
  
  // Get the district and state restraint data
  const districtRestraintData = useAppSelector(state => selectDistrictRestraintData(state, {district_id: district?.id}));
  const stateRestraintData = useAppSelector(state => selectStateRestraintData(state, {}));
  
  // Get enrollment data for rate calculations
  const districtEnrollmentData = useAppSelector(state => selectDistrictEnrollmentData(state, {district_id: district?.id}));
  const stateEnrollmentData = useAppSelector(state => selectStateEnrollmentData(state, {}));
  
  // Prepare chart data for all available years
  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (!districtRestraintData || !stateRestraintData || !districtEnrollmentData || !stateEnrollmentData) return [];
    
    // Sort the data by year in ascending order
    const sortedDistrictData = [...districtRestraintData].sort((a, b) => a.year - b.year);
    const sortedStateData = [...stateRestraintData].sort((a, b) => a.year - b.year);
    
    // Create maps for enrollment data by year for easy lookup
    const districtEnrollmentByYear = new Map(districtEnrollmentData.map(item => [item.year, item.total_enrollment]));
    const stateEnrollmentByYear = new Map(stateEnrollmentData.map(item => [item.year, item.total_enrollment]));
    
    // Create a map of state data by year for easy lookup
    const stateDataByYear = new Map(sortedStateData.map(item => [item.year, item]));
    
    // Map district data to chart format with per 100 student rates
    return sortedDistrictData.map(districtItem => {
      // Get corresponding state data for this year
      const stateItem = stateDataByYear.get(districtItem.year);
      
      // Get enrollment data for this year
      const districtEnrollment = districtEnrollmentByYear.get(districtItem.year) || 0;
      const stateEnrollment = stateEnrollmentByYear.get(districtItem.year) || 0;
      
      // Calculate rates per 100 students
      const districtRate = calculatePer100Students(districtItem.generated, districtEnrollment);
      const stateRate = stateItem && stateEnrollment ? calculatePer100Students(stateItem.generated, stateEnrollment) : null;
      
      return {
        year: districtItem.year.toString(),
        formattedYear: formatFiscalYear(districtItem.year) || districtItem.year.toString(),
        district: districtRate,
        state: stateRate
      };
    });
  }, [districtRestraintData, stateRestraintData, districtEnrollmentData, stateEnrollmentData]);
  
  // Find min values to set the Y-axis domain
  const minValue = useMemo(() => {
    if (chartData.length === 0) return 0;
    
    // Find the minimum district value
    const minDistrict = Math.min(...chartData.map(d => d.district));
    
    // Find the minimum state value (filtering out null values)
    const stateValues = chartData
      .filter(d => d.state !== null)
      .map(d => d.state as number); // Type assertion to number since we filtered nulls
    
    const minState = stateValues.length > 0 ? Math.min(...stateValues) : Infinity;
    
    // Get the overall minimum
    const minOverall = Math.min(minDistrict, minState);
    
    // Subtract ~5% to create some padding, but don't go below 0
    return Math.max(0, Math.floor(minOverall * 0.95));
  }, [chartData]);
  
  // Format tooltip values
  const formatTooltipValue = (value: number) => {
    return value.toFixed(2);
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
            Fiscal Year {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography
              key={`tooltip-${index}`}
              variant="body2"
              sx={{ color: entry.color, mb: 0.5 }}
            >
              {`${entry.name}: ${formatTooltipValue(entry.value)} per 100 students`}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };
  
  return (
    <Box sx={{ mt: 3, width: '100%' }}>
      <Typography 
        variant="body1" 
        sx={{ 
          textAlign: "center",
          width: "100%",
          fontWeight: 'medium'
        }} 
      >
        Restraint Reports By Year
      </Typography>
      <Typography        
        variant="body2" 
        sx={{ 
          textAlign: "center",
          width: "100%",
          mb: 1,
          fontWeight: 'medium',
          fontStyle: 'italic',
          color: 'text.secondary'
        }} >(Per 100 Students))</Typography>
      
      <Box sx={{ height: isMobile ? 300 : 400, width: '100%' }}>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 10,
                left: -20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="formattedYear"
                tick={{ fontSize: theme.typography.body2.fontSize }}
              />
              <YAxis
                domain={[minValue, 'auto']}
                tickFormatter={(value) => value.toFixed(1)}
                tick={{ fontSize: theme.typography.body2.fontSize }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ 
                  fontSize: theme.typography.body2.fontSize 
                }} 
              />
              <Line
                type="monotone"
                dataKey="district"
                name="District"
                stroke={theme.palette.primary.main}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="state"
                name="State Average"
                stroke={theme.palette.secondary.main}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls // Keep the line connected when there are null values
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="body1" color="text.secondary">
              No data available
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default RestraintTrendChart; 