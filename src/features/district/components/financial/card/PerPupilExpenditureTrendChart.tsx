import React, { useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { Card, CardContent, Typography, Box, useMediaQuery } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAppSelector } from '@/store/hooks';
import { selectPerPupilExpenditureAllData, selectStatePerPupilExpenditureAllData } from '@/store/slices/financeSlice';
import { formatCompactNumber } from '@/utils/formatting';
import { formatFiscalYear } from '../../../utils/financialDataProcessing';

interface PerPupilExpenditureTrendChartProps {
  className?: string;
}

// Define the chart data type for type safety
interface ChartDataPoint {
  year: string;
  district: number;
  state: number | null;
}

const PerPupilExpenditureTrendChart: React.FC<PerPupilExpenditureTrendChartProps> = ({ className }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Get the district and state per pupil expenditure data
  const districtPerPupilData = useAppSelector(selectPerPupilExpenditureAllData);
  const statePerPupilData = useAppSelector(selectStatePerPupilExpenditureAllData);
  
  // Prepare chart data for the last 11 years (current year + 10 previous years)
  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (!districtPerPupilData || !statePerPupilData) return [];
    
    // Sort the data by year in ascending order
    const sortedDistrictData = [...districtPerPupilData].sort((a, b) => a.year - b.year);
    const sortedStateData = [...statePerPupilData].sort((a, b) => a.year - b.year);
    
    // Get the latest 11 years or all available years if less than 11
    const latestYear = Math.max(
      sortedDistrictData.length > 0 ? sortedDistrictData[sortedDistrictData.length - 1].year : 0,
      sortedStateData.length > 0 ? sortedStateData[sortedStateData.length - 1].year : 0
    );
    
    // Calculate the start year (latest year - 10)
    const startYear = latestYear - 10;
    
    // Create a map of state data by year for easy lookup
    const stateDataByYear = new Map(sortedStateData.map(item => [item.year, item]));
    
    // Filter district data for the last 11 years and map to chart format
    return sortedDistrictData
      .filter(item => item.year >= startYear && item.year <= latestYear)
      .map(districtItem => {
        // Get corresponding state data for this year
        const stateItem = stateDataByYear.get(districtItem.year);
        
        return {
          year: districtItem.year.toString(),
          formattedYear: formatFiscalYear(districtItem.year) || districtItem.year.toString(),
          district: districtItem.total,
          state: stateItem ? stateItem.total : null
        };
      })
      .sort((a, b) => parseInt(a.year) - parseInt(b.year)); // Ensure ascending order by year
  }, [districtPerPupilData, statePerPupilData]);
  
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
    
    // Subtract ~5% to create some padding
    return Math.floor(minOverall * 0.95);
  }, [chartData]);
  
  // Format tooltip values
  const formatTooltipValue = (value: number) => {
    return `$${value.toLocaleString()}`;
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
            width: "100%"
          }} 
          gutterBottom
        >
            Cost Per Pupil Trend
        </Typography>
        
        <Box sx={{ height: isMobile ? 300 : 400, width: '100%' }}>
            {chartData.length > 0 ? (
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
                    domain={[minValue, 'auto']}
                    tickFormatter={(value) => formatCompactNumber(value)}
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
    </>
  );
};

export default PerPupilExpenditureTrendChart; 