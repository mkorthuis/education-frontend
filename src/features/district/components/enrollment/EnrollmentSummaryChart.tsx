import { useMemo } from 'react';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCompactNumber } from '@/utils/formatting';
import { GRADE_IDS, GRADE_NAMES } from '@/features/district/utils/enrollmentDataProcessing';

interface ChartDataPoint {
  grade: string;
  current: number;
  projected: number;
}

interface TooltipEntry {
  dataKey: string;
  value: number;
  name: string;
  color: string;
}

interface EnrollmentSummaryChartProps {
  currentEnrollment: { [key: number]: number };
  projectedEnrollment: { [key: number]: number };
  endYear: number;
  futureYear: number;
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
        {label}
      </Typography>
      {payload.map((entry: TooltipEntry, index: number) => (
        <Typography
          key={`tooltip-${index}`}
          variant="body2"
          sx={{ color: entry.color, mb: 0.5 }}
        >
          {`${entry.name}: ${entry.value.toFixed(2)} Students`}
        </Typography>
      ))}
    </Box>
  );
};

const EnrollmentSummaryChart: React.FC<EnrollmentSummaryChartProps> = ({
  currentEnrollment,
  projectedEnrollment,
  endYear,
  futureYear
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Process data for the chart
  const chartData = useMemo(() => {
    const data: ChartDataPoint[] = [];
    
    // Add Kindergarten
    data.push({
      grade: 'K',
      current: currentEnrollment[GRADE_IDS.KINDERGARTEN] || 0,
      projected: projectedEnrollment[GRADE_IDS.KINDERGARTEN] || 0
    });

    // Add Grades 1-12
    for (let grade = GRADE_IDS.GRADE_1; grade <= GRADE_IDS.GRADE_12; grade++) {
      data.push({
        grade: `G${grade - 2}`,
        current: currentEnrollment[grade] || 0,
        projected: projectedEnrollment[grade] || 0
      });
    }

    return data;
  }, [currentEnrollment, projectedEnrollment]);

  // Calculate Y-axis domain
  const allValues = chartData.flatMap(d => [d.current, d.projected]).filter(v => v > 0);
  const minValue = allValues.length > 0 ? Math.min(...allValues) : 0;
  const maxValue = allValues.length > 0 ? Math.max(...allValues) : 100;
  const padding = (maxValue - minValue) * 0.1; // 10% padding
  const yDomainMin = Math.max(0, Math.floor(minValue - padding));
  const yDomainMax = Math.ceil(maxValue + padding);

  return (
    <Box sx={{ 
      height: isMobile ? 300 : 400, 
      width: '100%',
      mt: { xs: 0, md: 6 }
    }}>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="grade"
              tick={{ fontSize: theme.typography.body2.fontSize }}
            />
            <YAxis
              domain={[yDomainMin, yDomainMax]}
              tickFormatter={(value) => formatCompactNumber(value, false)}
              tick={{ fontSize: theme.typography.body2.fontSize }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ 
                fontSize: theme.typography.body2.fontSize,
                color: theme.palette.text.primary
              }}
            />
            <Line
              type="monotone"
              dataKey="current"
              name={`Current (${endYear})`}
              stroke={theme.palette.grey[300]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="projected"
              name={`Projected (${futureYear})`}
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
  );
};

export default EnrollmentSummaryChart; 