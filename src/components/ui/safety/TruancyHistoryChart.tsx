import React, { useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { Typography, Box, useMediaQuery } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';

// Data type definitions
export interface TruancyData {
  year: number;
  count: number;
}

export interface EnrollmentData {
  year: number;
  total_enrollment: number;
}

// Define the chart data type for type safety
interface ChartDataPoint {
  year: string;
  formattedYear: string;
  entity: number;
  state: number | null;
}

export interface TruancyHistoryChartProps {
  entityName: string;
  entityTruancyData: TruancyData[];
  stateTruancyData: TruancyData[];
  entityEnrollmentData: EnrollmentData[];
  stateEnrollmentData: EnrollmentData[];
  calculatePer100Students: (count: number, enrollment: number, decimalPlaces?: number) => number;
  entityLabel?: string; // "District" or "School"
  className?: string;
}

const TruancyHistoryChart: React.FC<TruancyHistoryChartProps> = ({ 
  entityName,
  entityTruancyData,
  stateTruancyData,
  entityEnrollmentData,
  stateEnrollmentData,
  calculatePer100Students,
  entityLabel = 'Entity',
  className
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Prepare chart data for all available years, sorted by year
  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (!entityTruancyData || !stateTruancyData || !entityEnrollmentData || !stateEnrollmentData) return [];
    
    // Sort the data by year in ascending order
    const sortedEntityData = [...entityTruancyData].sort((a, b) => a.year - b.year);
    const sortedStateData = [...stateTruancyData].sort((a, b) => a.year - b.year);
    
    // Get the latest 10 years or all available years if less than 10
    const latestYear = Math.max(
      sortedEntityData.length > 0 ? sortedEntityData[sortedEntityData.length - 1].year : 0,
      sortedStateData.length > 0 ? sortedStateData[sortedStateData.length - 1].year : 0
    );
    
    // Calculate the start year (latest year - 9) to get 10 years of data
    const startYear = latestYear - 9;
    
    // Create maps for easy lookup
    const stateDataByYear = new Map(sortedStateData.map(item => [item.year, item]));
    const entityEnrollmentByYear = new Map(entityEnrollmentData.map(item => [item.year, item.total_enrollment]));
    const stateEnrollmentByYear = new Map(stateEnrollmentData.map(item => [item.year, item.total_enrollment]));
    
    // Filter entity data for the available years and map to chart format
    return sortedEntityData
      .filter(item => item.year >= startYear && item.year <= latestYear)
      .map(entityItem => {
        // Get corresponding state data and enrollments for this year
        const stateItem = stateDataByYear.get(entityItem.year);
        const entityEnrollment = entityEnrollmentByYear.get(entityItem.year) || 0;
        const stateEnrollment = stateEnrollmentByYear.get(entityItem.year) || 0;
        
        // Calculate percentages
        const entityPercentage = calculatePer100Students(entityItem.count, entityEnrollment, 1);
        const statePercentage = stateItem && stateEnrollment ? 
          calculatePer100Students(stateItem.count, stateEnrollment, 1) : null;
        
        return {
          year: entityItem.year.toString(),
          formattedYear: formatFiscalYear(entityItem.year) || entityItem.year.toString(),
          entity: entityPercentage,
          state: statePercentage
        };
      })
      .sort((a, b) => parseInt(a.year) - parseInt(b.year)); // Ensure ascending order by year
  }, [entityTruancyData, stateTruancyData, entityEnrollmentData, stateEnrollmentData, calculatePer100Students]);
  
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
            fontWeight: 'medium',
            ...(className ? { className } : {})
          }} 
        >
            % {entityName} Students Truant Over Time
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
                    dataKey="entity"
                    name={`${entityLabel} %`}
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