import React, { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { Box, Typography, useTheme, useMediaQuery, FormControl, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';
import { useParams } from 'react-router-dom';
import * as classSizeSlice from '@/store/slices/classSizeSlice';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Tooltip } from '@mui/material';

interface ChartDataPoint {
  year: string;
  formattedYear: string;
  district: number;
  state: number;
}

type CustomTooltipProps = TooltipProps<number, string>;

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
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
      {payload.map((entry, index) => {
        const value = entry.value ?? 0;
        return (
          <Typography
            key={`tooltip-${index}`}
            variant="body2"
            sx={{ color: entry.color, mb: 0.5 }}
          >
            {`${entry.name}: ${value.toFixed(1)}`}
          </Typography>
        );
      })}
    </Box>
  );
};

const GRADE_OPTIONS = [
  { value: 'grades_1_2', label: 'Grades 1+2' },
  { value: 'grades_3_4', label: 'Grades 3+4' },
  { value: 'grades_5_8', label: 'Grades 5-8' }
];

const AverageClassSizeChart: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { id } = useParams<{ id: string }>();
  const districtId = id ? parseInt(id) : 0;
  const [selectedGrade, setSelectedGrade] = useState<string>('grades_1_2');

  const districtParams = { district_id: districtId };
  const stateParams = {};

  const districtData = useAppSelector(state => 
    classSizeSlice.selectDistrictClassSizeData(state, districtParams));
  const stateData = useAppSelector(state => 
    classSizeSlice.selectStateClassSizeData(state, stateParams));

  // Filter out options with no data or all zeros
  const availableGradeOptions = React.useMemo(() => {
    return GRADE_OPTIONS.filter(option => {
      const hasDistrictData = districtData.some(item => 
        item[option.value as keyof typeof item] && 
        item[option.value as keyof typeof item] !== 0
      );
      return hasDistrictData;
    });
  }, [districtData]);

  // Update selected grade if current selection is not available
  React.useEffect(() => {
    if (availableGradeOptions.length > 0 && !availableGradeOptions.some(option => option.value === selectedGrade)) {
      setSelectedGrade(availableGradeOptions[0].value);
    }
  }, [availableGradeOptions, selectedGrade]);

  const handleGradeChange = (event: SelectChangeEvent) => {
    setSelectedGrade(event.target.value);
  };

  // Process data for the chart
  const chartData = React.useMemo(() => {
    // Group data by year
    const yearGroups = districtData.reduce((acc, item) => {
      if (!acc[item.year]) {
        acc[item.year] = {
          year: item.year.toString(),
          formattedYear: `${(parseInt(item.year.toString()) - 1).toString().slice(-2)}/${item.year.toString().slice(-2)}`,
          district: 0,
          state: 0
        };
      }
      return acc;
    }, {} as Record<string, ChartDataPoint>);

    // Calculate district values
    districtData.forEach(item => {
      const yearData = yearGroups[item.year];
      if (yearData) {
        yearData.district = item[selectedGrade as keyof typeof item] || 0;
      }
    });

    // Calculate state values - process state data independently
    stateData.forEach(item => {
      if (!yearGroups[item.year]) {
        yearGroups[item.year] = {
          year: item.year.toString(),
          formattedYear: `${(parseInt(item.year.toString()) - 1).toString().slice(-2)}/${item.year.toString().slice(-2)}`,
          district: 0,
          state: 0
        };
      }
      const yearData = yearGroups[item.year];
      if (yearData) {
        yearData.state = item[selectedGrade as keyof typeof item] || 0;
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
  }, [districtData, stateData, selectedGrade]);

  // Check if there's any non-zero data for the selected grade
  const hasValidData = React.useMemo(() => {
    return chartData.some(data => data.district !== 0);
  }, [chartData]);

  // If no valid data for any grade, don't show the chart
  if (availableGradeOptions.length === 0) {
    return null;
  }

  // Calculate Y-axis domain
  const allValues = chartData.flatMap(d => [d.district, d.state]).filter(v => !isNaN(v) && v !== 0);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const padding = (maxValue - minValue) * 0.1; // 10% padding
  const yDomainMin = Math.max(0, Math.floor(minValue - padding));
  const yDomainMax = Math.ceil(maxValue + padding);

  const selectedGradeLabel = availableGradeOptions.find(option => option.value === selectedGrade)?.label || '';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2,
        flexWrap: 'wrap'
      }}>
        <Box sx={{ flex: 1 }}>
          <Typography 
            variant="body1" 
            sx={{ 
              textAlign: "left",
              width: "100%",
              fontWeight: 'medium'
            }} 
          >
            Average Class Size
          </Typography>
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
            (Students per Class)
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl 
            size="small" 
            sx={{ 
              minWidth: isMobile ? 100 : 150,
            }}
          >
            <Select
              value={selectedGrade}
              onChange={handleGradeChange}
              displayEmpty
              inputProps={{ 'aria-label': 'grade range selector' }}
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
              {availableGradeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Box sx={{ height: isMobile ? 300 : 400, width: '100%' }}>
        {hasValidData ? (
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
                tickFormatter={(value) => value.toFixed(1)}
                tick={{ fontSize: theme.typography.body2.fontSize }}
              />
              <RechartsTooltip<number, string> content={CustomTooltip} />
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

export default AverageClassSizeChart; 