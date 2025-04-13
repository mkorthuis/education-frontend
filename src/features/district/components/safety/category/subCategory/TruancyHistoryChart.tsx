import React, { useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { Typography, Box, useMediaQuery } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAppSelector } from '@/store/hooks';
import { selectDistrictTruancyData, selectStateTruancyData } from '@/store/slices/safetySlice';
import { selectCurrentDistrict } from '@/store/slices/locationSlice';
import { selectDistrictEnrollmentData, selectStateEnrollmentData } from '@/store/slices/safetySlice';
import { calculatePer100Students } from '@/features/district/utils/safetyDataProcessing';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';

interface TruancyHistoryChartProps {
  className?: string;
}

// Define the chart data type for type safety
interface ChartDataPoint {
  year: string;
  formattedYear: string;
  district: number;
  state: number | null;
}

const TruancyHistoryChart: React.FC<TruancyHistoryChartProps> = ({ className }) => {

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Get the current district
  const district = useAppSelector(selectCurrentDistrict);
  
  // Get the district and state truancy data
  const districtTruancyData = useAppSelector(state => selectDistrictTruancyData(state, {district_id: district?.id}));
  const stateTruancyData = useAppSelector(state => selectStateTruancyData(state, {}));
  
  // Get enrollment data for percentage calculations
  const districtEnrollmentData = useAppSelector(state => selectDistrictEnrollmentData(state, {district_id: district?.id}));
  const stateEnrollmentData = useAppSelector(state => selectStateEnrollmentData(state, {}));
  
  // Prepare chart data for all available years, sorted by year
  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (!districtTruancyData || !stateTruancyData || !districtEnrollmentData || !stateEnrollmentData) return [];
    
    // Sort the data by year in ascending order
    const sortedDistrictData = [...districtTruancyData].sort((a, b) => a.year - b.year);
    const sortedStateData = [...stateTruancyData].sort((a, b) => a.year - b.year);
    
    // Get the latest 10 years or all available years if less than 10
    const latestYear = Math.max(
      sortedDistrictData.length > 0 ? sortedDistrictData[sortedDistrictData.length - 1].year : 0,
      sortedStateData.length > 0 ? sortedStateData[sortedStateData.length - 1].year : 0
    );
    
    // Calculate the start year (latest year - 9) to get 10 years of data
    const startYear = latestYear - 9;
    
    // Create maps for easy lookup
    const stateDataByYear = new Map(sortedStateData.map(item => [item.year, item]));
    const districtEnrollmentByYear = new Map(districtEnrollmentData.map(item => [item.year, item.total_enrollment]));
    const stateEnrollmentByYear = new Map(stateEnrollmentData.map(item => [item.year, item.total_enrollment]));
    
    // Filter district data for the available years and map to chart format
    return sortedDistrictData
      .filter(item => item.year >= startYear && item.year <= latestYear)
      .map(districtItem => {
        // Get corresponding state data and enrollments for this year
        const stateItem = stateDataByYear.get(districtItem.year);
        const districtEnrollment = districtEnrollmentByYear.get(districtItem.year) || 0;
        const stateEnrollment = stateEnrollmentByYear.get(districtItem.year) || 0;
        
        // Calculate percentages
        const districtPercentage = calculatePer100Students(districtItem.count, districtEnrollment, 1);
        const statePercentage = stateItem && stateEnrollment ? 
          calculatePer100Students(stateItem.count, stateEnrollment, 1) : null;
        
        return {
          year: districtItem.year.toString(),
          formattedYear: formatFiscalYear(districtItem.year) || districtItem.year.toString(),
          district: districtPercentage,
          state: statePercentage
        };
      })
      .sort((a, b) => parseInt(a.year) - parseInt(b.year)); // Ensure ascending order by year
  }, [districtTruancyData, stateTruancyData, districtEnrollmentData, stateEnrollmentData]);
  
  // Format tooltip values
  const formatTooltipValue = (value: number) => {
    return `${value}%`;
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
            Fiscal Year {formatFiscalYear(label) || label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography
              key={`tooltip-${index}`}
              variant="body2"
              sx={{ color: entry.color, mb: 0.5 }}
            >
              {`${entry.name}: ${formatTooltipValue(entry.value)}`}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };
  
  return (
    <>
        <Typography 
          variant="body1" 
          sx={{ 
            textAlign: "center",
            width: "100%",
            mt: 2,
            mb: 1,
            fontWeight: 'medium'
          }} 
        >
            % {district?.name} Students Truant Over Time
        </Typography>
        
        <Box sx={{ height: isMobile ? 250 : 350, width: '100%' }}>
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
                    domain={[0, 'auto']}
                    tick={{ fontSize: theme.typography.body2.fontSize }}
                    tickFormatter={(value) => `${value}%`} // Add percentage symbol
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
                    name="District %"
                    stroke={theme.palette.primary.main}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                />
                <Line
                    type="monotone"
                    dataKey="state"
                    name="State Average %"
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
                No truancy data available
                </Typography>
            </Box>
            )}
        </Box>
    </>
  );
};

export default TruancyHistoryChart; 