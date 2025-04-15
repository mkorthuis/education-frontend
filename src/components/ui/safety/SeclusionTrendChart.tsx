import React, { useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { Typography, Box, useMediaQuery } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';

// Define prop types for the shared component
export interface SeclusionData {
  year: number;
  generated: number;
  active_investigation?: number;
  closed_investigation?: number;
}

export interface EnrollmentData {
  year: number;
  total_enrollment: number;
}

export interface SeclusionTrendChartProps {
  entityName: string;
  isDistrict: boolean;
  entitySeclusionData: SeclusionData[];
  stateSeclusionData: SeclusionData[];
  entityEnrollmentData: EnrollmentData[];
  stateEnrollmentData: EnrollmentData[];
  calculatePer100Students: (count: number, enrollment: number) => number;
  className?: string;
}

// Define the chart data type for type safety
interface ChartDataPoint {
  year: string;
  formattedYear: string;
  entity: number;
  state: number | null;
}

const SeclusionTrendChart: React.FC<SeclusionTrendChartProps> = ({ 
  entityName,
  isDistrict,
  entitySeclusionData,
  stateSeclusionData,
  entityEnrollmentData,
  stateEnrollmentData,
  calculatePer100Students,
  className 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Get the entity line name based on whether this is a district or school
  const entityLineName = isDistrict ? 'District' : 'School';
  
  // Prepare chart data for all available years
  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (!entitySeclusionData || !stateSeclusionData || !entityEnrollmentData || !stateEnrollmentData) return [];
    
    // Sort the data by year in ascending order
    const sortedEntityData = [...entitySeclusionData].sort((a, b) => a.year - b.year);
    const sortedStateData = [...stateSeclusionData].sort((a, b) => a.year - b.year);
    
    // Create maps for enrollment data by year for easy lookup
    const entityEnrollmentByYear = new Map(entityEnrollmentData.map(item => [item.year, item.total_enrollment]));
    const stateEnrollmentByYear = new Map(stateEnrollmentData.map(item => [item.year, item.total_enrollment]));
    
    // Create a map of state data by year for easy lookup
    const stateDataByYear = new Map(sortedStateData.map(item => [item.year, item]));
    
    // Map entity data to chart format with per 100 student rates
    return sortedEntityData.map(entityItem => {
      // Get corresponding state data for this year
      const stateItem = stateDataByYear.get(entityItem.year);
      
      // Get enrollment data for this year
      const entityEnrollment = entityEnrollmentByYear.get(entityItem.year) || 0;
      const stateEnrollment = stateEnrollmentByYear.get(entityItem.year) || 0;
      
      // Calculate rates per 100 students
      const entityRate = calculatePer100Students(entityItem.generated, entityEnrollment);
      const stateRate = stateItem && stateEnrollment ? calculatePer100Students(stateItem.generated, stateEnrollment) : null;
      
      return {
        year: entityItem.year.toString(),
        formattedYear: formatFiscalYear(entityItem.year) || entityItem.year.toString(),
        entity: entityRate,
        state: stateRate
      };
    });
  }, [entitySeclusionData, stateSeclusionData, entityEnrollmentData, stateEnrollmentData, calculatePer100Students]);
  
  // Find min values to set the Y-axis domain
  const minValue = useMemo(() => {
    if (chartData.length === 0) return 0;
    
    // Find the minimum entity value
    const minEntity = Math.min(...chartData.map(d => d.entity));
    
    // Find the minimum state value (filtering out null values)
    const stateValues = chartData
      .filter(d => d.state !== null)
      .map(d => d.state as number); // Type assertion to number since we filtered nulls
    
    const minState = stateValues.length > 0 ? Math.min(...stateValues) : Infinity;
    
    // Get the overall minimum
    const minOverall = Math.min(minEntity, minState);
    
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
        Seclusion Reports By Year
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
        }} >(Per 100 Students)</Typography>
      
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
                dataKey="entity"
                name={entityLineName}
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
              No data available for {entityName || (isDistrict ? 'this district' : 'this school')}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default SeclusionTrendChart; 