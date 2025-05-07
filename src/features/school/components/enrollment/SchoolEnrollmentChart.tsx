import React from 'react';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SchoolEnrollmentData } from '@/services/api/endpoints/enrollments';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import { formatCompactNumber } from '@/utils/formatting';

interface ChartDataPoint {
  year: string;
  formattedYear: string;
  enrollment: number;
}

interface TooltipEntry {
  dataKey: string;
  value: number;
  name: string;
  color: string;
}

export interface SchoolEnrollmentChartProps {
  schoolId?: number;
  enrollmentData?: SchoolEnrollmentData[];
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  
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
      {payload.map((entry: TooltipEntry, index: number) => (
        <Typography
          key={`tooltip-${index}`}
          variant="body2"
          sx={{ color: entry.color, mb: 0.5 }}
        >
          {`${entry.name}: ${entry.value.toLocaleString()} Students`}
        </Typography>
      ))}
    </Box>
  );
};

/**
 * Component that displays a chart of enrollment data for a school
 */
const SchoolEnrollmentChart: React.FC<SchoolEnrollmentChartProps> = ({
  schoolId,
  enrollmentData = []
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Process data for the chart
  const chartData = React.useMemo(() => {
    if (!enrollmentData.length) return [];
    
    // Get available years
    const years = [...new Set(enrollmentData.map(item => item.year))].sort();
    
    // Create data points for each year
    return years.map(year => {
      // Filter data for the current year
      const yearData = enrollmentData.filter(item => item.year === year);
      
      // Calculate total enrollment for this year (sum across all grades)
      const totalEnrollment = yearData.reduce((sum, item) => sum + (item.enrollment || 0), 0);
      
      return {
        year: year.toString(),
        formattedYear: formatFiscalYear(year),
        enrollment: totalEnrollment
      };
    }).sort((a, b) => parseInt(a.year) - parseInt(b.year));
  }, [enrollmentData]);
  
  // Calculate Y-axis domain
  const allValues = chartData.flatMap(d => [d.enrollment]).filter(v => v > 0);
  const minValue = allValues.length > 0 ? Math.min(...allValues) : 0;
  const maxValue = allValues.length > 0 ? Math.max(...allValues) : 100;
  const padding = (maxValue - minValue) * 0.1; // 10% padding
  const yDomainMin = Math.max(0, Math.floor(minValue - padding));
  const yDomainMax = Math.ceil(maxValue + padding);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        mb: 2,
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          mb: 1
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography 
              variant="body1" 
              sx={{ 
                textAlign: "left",
                fontWeight: 'medium'
              }} 
            >
              Total Students
            </Typography>
            <Typography        
              variant="body2" 
              sx={{ 
                textAlign: "left",
                fontWeight: 'medium',
                fontStyle: 'italic',
                color: 'text.secondary'
              }}
            >
              Number By Year
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ height: isMobile ? 300 : 400, width: '100%' }}>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 10, left: -3, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="formattedYear"
                tick={{ fontSize: theme.typography.body2.fontSize }}
              />
              <YAxis
                domain={[yDomainMin, yDomainMax]}
                tickFormatter={(value) => formatCompactNumber(value, false)}
                tick={{ fontSize: theme.typography.body2.fontSize }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: theme.typography.body2.fontSize }}
              />
              <Line
                type="monotone"
                dataKey="enrollment"
                name="Total Students"
                stroke={theme.palette.primary.main}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
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
              No enrollment data available
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default SchoolEnrollmentChart; 