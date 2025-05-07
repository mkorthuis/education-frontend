import React from 'react';
import { Box, Typography, useTheme, useMediaQuery, FormControl, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import { formatCompactNumber } from '@/utils/formatting';

interface ChartDataPoint {
  year: string;
  formattedYear: string;
  value: number;
  name: string;
}

interface TooltipEntry {
  dataKey: string;
  value: number;
  name: string;
  color: string;
}

interface SelectOption {
  id: number | string;
  name: string;
}

export interface SharedSchoolEnrollmentChartProps {
  title: string;
  subtitle?: string;
  data: ChartDataPoint[];
  selectOptions?: SelectOption[];
  selectedValue?: number | string;
  onSelectChange?: (value: number | string) => void;
  showSelector?: boolean;
  selectorLabel?: string;
  valueKey?: string;
  valueName?: string;
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

const SharedSchoolEnrollmentChart: React.FC<SharedSchoolEnrollmentChartProps> = ({
  title,
  subtitle = "Number By Year",
  data,
  selectOptions = [],
  selectedValue,
  onSelectChange,
  showSelector = false,
  selectorLabel,
  valueKey = "value",
  valueName = "Total Students"
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Handle selection change
  const handleSelectChange = (event: SelectChangeEvent<number | string>) => {
    if (onSelectChange) {
      onSelectChange(event.target.value);
    }
  };

  // Calculate Y-axis domain
  const allValues = data.flatMap(d => [d[valueKey as keyof ChartDataPoint] as number]).filter(v => v > 0);
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
        mb: 0.5,
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
              {title}
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
              {subtitle}
            </Typography>
          </Box>
          {showSelector && selectOptions.length > 0 && (
            <FormControl
              size="small"
              sx={{
                minWidth: 150,
              }}
            >
              <Select
                value={selectedValue || ''}
                onChange={handleSelectChange}
                sx={{ 
                  bgcolor: 'rgba(0, 0, 0, 0.08)',
                  '&.Mui-focused': {
                    bgcolor: 'rgba(0, 0, 0, 0.08)'
                  },
                  border: '1px solid rgba(0, 0, 0, 0.12)',
                  borderRadius: '4px',
                  '& .MuiOutlinedInput-notchedOutline': { 
                    border: 'none' 
                  },
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.12)'
                  }
                }}
              >
                {selectOptions.map((option) => (
                  <MenuItem key={option.id} value={option.id}>{option.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </Box>

      <Box sx={{ height: isMobile ? 300 : 400, width: '100%' }}>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
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
                dataKey={valueKey}
                name={valueName}
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

export default SharedSchoolEnrollmentChart; 