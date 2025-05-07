import React, { useState } from 'react';
import { Box, FormControl, Select, MenuItem, SelectChangeEvent, Typography, useTheme, useMediaQuery, Tooltip as MuiTooltip } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

export type MetricType = 'graduate' | 'earned_hiset' | 'dropped_out';

export interface ChartDataPoint {
  year: string;
  formattedYear: string;
  entity: number;  // School or District value
  state: number;
}

interface TooltipEntry {
  dataKey: string;
  value: number;
  name: string;
  color: string;
}

export interface GraduationRateChartProps {
  className?: string;
  entityLabel: string;  // "School" or "District"
  chartData: ChartDataPoint[];
  onMetricChange?: (metric: MetricType) => void;
  initialMetric?: MetricType;
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
          {`${entry.name}: ${entry.value.toFixed(1)}%`}
        </Typography>
      ))}
    </Box>
  );
};

const GraduationRateChart: React.FC<GraduationRateChartProps> = ({ 
  className, 
  entityLabel,
  chartData,
  onMetricChange,
  initialMetric = 'graduate'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [selectedMetric, setSelectedMetric] = useState<MetricType>(initialMetric);

  const handleMetricChange = (event: SelectChangeEvent) => {
    const newMetric = event.target.value as MetricType;
    setSelectedMetric(newMetric);
    if (onMetricChange) {
      onMetricChange(newMetric);
    }
  };

  // Calculate Y-axis domain
  const allValues = chartData.flatMap(d => [d.entity, d.state]).filter(v => !isNaN(v));
  const minValue = Math.min(...allValues, 0); // Include 0 to ensure we don't have negative minimum
  const maxValue = Math.max(...allValues, 0);
  const padding = (maxValue - minValue) * 0.1; // 10% padding
  const yDomainMin = Math.max(0, Math.floor(minValue - padding));
  const yDomainMax = Math.ceil(maxValue + padding);

  const getMetricLabel = (metric: MetricType) => {
    switch (metric) {
      case 'graduate':
        return isMobile ? 'Graduated' : 'Graduation Rate';
      case 'earned_hiset':
        return isMobile ? 'HiSET' : 'HiSET Pass Rate';
      case 'dropped_out':
        return 'Dropout Rate';
    }
  };

  const chartTitle = `${getMetricLabel(selectedMetric)} By Year`;

  return (
    <>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2,
        flexWrap: 'wrap'
      }}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography 
              variant="body1" 
              sx={{ 
                textAlign: "left",
                width: "100%",
                fontWeight: 'medium',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5
              }} 
            >
              {chartTitle}
              {selectedMetric === 'earned_hiset' && (
                <MuiTooltip title="HiSET is an alternative high school equivalency test that allows adults who didn't graduate high school to demonstrate their knowledge and earn a credential equivalent to a high school diploma." arrow placement="right">
                  <HelpOutlineIcon fontSize="small" sx={{ width: 16, height: 16, color: 'text.secondary' }} />
                </MuiTooltip>
              )}
            </Typography>
          </Box>
          <Typography        
            variant="body2" 
            sx={{ 
              textAlign: "left",
              width: "100%",
              fontWeight: 'medium',
              fontStyle: 'italic',
              color: 'text.secondary'
            }}
          >
            (Percentage of Cohort)
          </Typography>
        </Box>
        
        <FormControl 
          size="small" 
          sx={{ 
            minWidth: 150,
            ml: 2,
          }}
        >
          <Select
            value={selectedMetric}
            onChange={handleMetricChange}
            displayEmpty
            inputProps={{ 'aria-label': 'metric selector' }}
            sx={{
              '& .MuiOutlinedInput-notchedOutline': {
                border: '1px solid rgba(0, 0, 0, 0.12)'
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                border: '1px solid rgba(0, 0, 0, 0.12)'
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                border: '1px solid rgba(0, 0, 0, 0.12)'
              }
            }}
          >
            <MenuItem value="graduate">Graduation Rate</MenuItem>
            <MenuItem value="earned_hiset">HiSET Pass Rate</MenuItem>
            <MenuItem value="dropped_out">Dropout Rate</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ height: isMobile ? 300 : 400, width: '100%' }}>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="formattedYear"
                tick={{ fontSize: theme.typography.body2.fontSize }}
              />
              <YAxis
                domain={[yDomainMin, yDomainMax]}
                tickFormatter={(value) => `${Math.round(value)}%`}
                tick={{ fontSize: theme.typography.body2.fontSize }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: theme.typography.body2.fontSize }}
              />
              <Line
                type="monotone"
                dataKey="entity"
                name={entityLabel}
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
    </>
  );
};

export default GraduationRateChart; 