import React, { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { Box, Typography, useTheme, useMediaQuery, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useParams } from 'react-router-dom';
import * as staffSlice from '@/store/slices/staffSlice';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import { calculateInflationAdjustedAmount } from '@/utils/calculations';
import { FISCAL_YEAR } from '@/utils/environment';
import { formatCompactNumber } from '@/utils/formatting';

interface ChartDataPoint {
  year: string;
  formattedYear: string;
  district: number;
  state: number;
}

interface TooltipEntry {
  dataKey: string;
  value: number;
  name: string;
  color: string;
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
          {`${entry.name}: $${entry.value.toLocaleString()}`}
        </Typography>
      ))}
    </Box>
  );
};

const TeacherAverageSalaryChart: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { id } = useParams<{ id: string }>();
  const districtId = id ? parseInt(id) : 0;
  const [showInflationAdjusted, setShowInflationAdjusted] = useState(false);
  const targetYear = parseInt(FISCAL_YEAR);

  const districtData = useAppSelector(state => 
    staffSlice.selectDistrictTeacherAverageSalaryData(state, { district_id: districtId }));
  const stateData = useAppSelector(state => 
    staffSlice.selectStateTeacherAverageSalaryData(state, {}));

  // Process data for the chart
  const chartData = React.useMemo(() => {
    // Group data by year
    const yearGroups = districtData.reduce((acc, item) => {
      if (!acc[item.year]) {
        const districtSalary = showInflationAdjusted 
          ? calculateInflationAdjustedAmount(item.salary, item.year, targetYear)
          : item.salary;

        acc[item.year] = {
          year: item.year.toString(),
          formattedYear: `${(parseInt(item.year.toString()) - 1).toString().slice(-2)}/${item.year.toString().slice(-2)}`,
          district: districtSalary,
          state: 0
        };
      }
      return acc;
    }, {} as Record<string, ChartDataPoint>);

    // Add state data
    stateData.forEach(item => {
      const yearData = yearGroups[item.year];
      if (yearData) {
        const stateSalary = showInflationAdjusted
          ? calculateInflationAdjustedAmount(item.salary, item.year, targetYear)
          : item.salary;
        yearData.state = stateSalary;
      }
    });

    // Ensure all years have data points, even if no data exists
    const allYears = new Set([
      ...districtData.map(item => item.year),
      ...stateData.map(item => item.year)
    ]);

    allYears.forEach(year => {
      if (!yearGroups[year]) {
        yearGroups[year] = {
          year: year.toString(),
          formattedYear: `${(parseInt(year.toString()) - 1).toString().slice(-2)}/${year.toString().slice(-2)}`,
          district: 0,
          state: 0
        };
      }
    });

    return Object.values(yearGroups)
      .sort((a, b) => parseInt(a.year) - parseInt(b.year));
  }, [districtData, stateData, showInflationAdjusted, targetYear]);

  // Calculate Y-axis domain
  const allValues = chartData.flatMap(d => [d.district, d.state]).filter(v => !isNaN(v));
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
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
              {isMobile 
                ? 'Teacher Average Salary'
                : 'Teacher Average Salary History'}
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
              {showInflationAdjusted 
                ? `(Annual Salary in ${targetYear} Dollars)`
                : '(Annual Salary)'}
            </Typography>
          </Box>
          <ToggleButtonGroup
            value={showInflationAdjusted}
            exclusive
            onChange={(_, value) => setShowInflationAdjusted(value)}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                color: 'rgba(0, 0, 0, 0.87)',
                fontWeight: 500
              },
              '& .MuiToggleButton-root.Mui-selected': {
                bgcolor: 'rgba(0, 0, 0, 0.08)',
                color: 'rgba(0, 0, 0, 0.87)',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.12)'
                }
              }
            }}
          >
            <ToggleButton value={true}>
              Adj. For Inflation
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      <Box sx={{ height: isMobile ? 300 : 400, width: '100%' }}>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 10, left:-3, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="formattedYear"
                tick={{ fontSize: theme.typography.body2.fontSize }}
              />
              <YAxis
                domain={[yDomainMin, yDomainMax]}
                tickFormatter={(value) => `${formatCompactNumber(value)}`}
                tick={{ fontSize: theme.typography.body2.fontSize }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: theme.typography.body2.fontSize }}
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
                connectNulls
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

export default TeacherAverageSalaryChart; 