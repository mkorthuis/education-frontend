import React, { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { Box, Typography, useTheme, useMediaQuery, FormControl, Select, MenuItem, SelectChangeEvent, ToggleButtonGroup, ToggleButton, Tooltip } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';
import { useParams } from 'react-router-dom';
import * as staffSlice from '@/store/slices/staffSlice';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import { STAFF_TYPE_ORDER, STAFF_TYPE_MOBILE_NAMES, STAFF_TYPES_WITH_TOOLTIP, STAFF_TYPE_TOOLTIPS } from '@/features/district/utils/staffDataProcessing';
import { formatCompactNumber } from '@/utils/formatting';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

interface ChartDataPoint {
  year: string;
  formattedYear: string;
  district: number;
  state: number;
  total: number;
}

interface TooltipEntry {
  dataKey: string;
  value: number;
  name: string;
  color: string;
}

type CustomTooltipProps = TooltipProps<number, string> & {
  viewMode: 'percentage' | 'count';
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label, viewMode }: CustomTooltipProps) => {
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
            {`${entry.name}: ${viewMode === 'percentage' ? `${value.toFixed(1)}%` : formatCompactNumber(value).replace('$', '')}`}
          </Typography>
        );
      })}
    </Box>
  );
};

const StaffTypeHistoryChart: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { id } = useParams<{ id: string }>();
  const districtId = id ? parseInt(id) : 0;
  const [viewMode, setViewMode] = useState<'percentage' | 'count'>('percentage');

  const staffTypes = useAppSelector(staffSlice.selectStaffTypes);
  const districtData = useAppSelector(state => 
    staffSlice.selectDistrictStaffData(state, { district_id: districtId }));
  const stateData = useAppSelector(state => 
    staffSlice.selectStateStaffData(state, {}));

  // Set initial selected type to "Teacher"
  const [selectedType, setSelectedType] = useState<string>(() => {
    const teacher = staffTypes.find(type => type.name === 'Teacher');
    return teacher?.id.toString() || staffTypes[0]?.id.toString() || '';
  });

  const handleTypeChange = (event: SelectChangeEvent) => {
    setSelectedType(event.target.value);
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
          state: 0,
          total: 0
        };
      }
      acc[item.year].total = (acc[item.year].total as number) + item.value;
      return acc;
    }, {} as Record<string, ChartDataPoint>);

    // Calculate district values
    districtData.forEach(item => {
      const yearData = yearGroups[item.year];
      if (yearData && item.staff_type.id.toString() === selectedType) {
        if (viewMode === 'percentage' && (yearData.total as number) > 0) {
          const percentage = (item.value / (yearData.total as number)) * 100;
          yearData.district = Number(percentage.toFixed(1));
        } else {
          yearData.district = item.value;
        }
      }
    });

    // Calculate state values (only for percentage view)
    if (viewMode === 'percentage') {
      stateData.forEach(item => {
        const yearData = yearGroups[item.year];
        if (yearData && item.staff_type.id.toString() === selectedType) {
          const stateTotal = stateData
            .filter(stateItem => stateItem.year === item.year)
            .reduce((sum, stateItem) => sum + stateItem.value, 0);
          
          if (stateTotal > 0) {
            const percentage = (item.value / stateTotal) * 100;
            yearData.state = Number(percentage.toFixed(1));
          }
        }
      });
    }

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
          state: 0,
          total: 0
        };
      }
    });

    return Object.values(yearGroups)
      .sort((a, b) => parseInt(a.year) - parseInt(b.year));
  }, [districtData, stateData, selectedType, viewMode]);

  // Calculate Y-axis domain
  const allValues = chartData.flatMap(d => [d.district, d.state]).filter(v => !isNaN(v));
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const padding = (maxValue - minValue) * 0.1; // 10% padding
  const yDomainMin = Math.max(0, Math.floor(minValue - padding));
  const yDomainMax = Math.ceil(maxValue + padding);

  const selectedTypeName = staffTypes.find(type => type.id.toString() === selectedType)?.name || '';
  const displayName = isMobile 
    ? STAFF_TYPE_MOBILE_NAMES[selectedTypeName as keyof typeof STAFF_TYPE_MOBILE_NAMES] || selectedTypeName
    : selectedTypeName;

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
            {viewMode === 'percentage' 
              ? `${displayName} ${isMobile ? '%' : 'Percentage'}`
              : `${displayName} Count`}
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
            {viewMode === 'percentage' 
              ? '(of Total Staff)'
              : '(Over Time)'}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, value) => value && setViewMode(value)}
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
            <ToggleButton value="percentage">
              {isMobile ? '%' : 'Percentage'}
            </ToggleButton>
            <ToggleButton value="count">
              {isMobile ? '#' : 'Count'}
            </ToggleButton>
          </ToggleButtonGroup>

          <FormControl 
            size="small" 
            sx={{ 
              minWidth: isMobile ? 100 : 150,
            }}
          >
            <Select
              value={selectedType}
              onChange={handleTypeChange}
              displayEmpty
              inputProps={{ 'aria-label': 'staff type selector' }}
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
              {[...staffTypes]
                .sort((a, b) => {
                  const aIndex = STAFF_TYPE_ORDER.indexOf(a.name as typeof STAFF_TYPE_ORDER[number]);
                  const bIndex = STAFF_TYPE_ORDER.indexOf(b.name as typeof STAFF_TYPE_ORDER[number]);
                  return aIndex - bIndex;
                })
                .map((type) => (
                  <MenuItem key={type.id} value={type.id.toString()}>
                    {isMobile 
                      ? STAFF_TYPE_MOBILE_NAMES[type.name as keyof typeof STAFF_TYPE_MOBILE_NAMES] || type.name
                      : type.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Box>
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
                tickFormatter={(value) => viewMode === 'percentage' ? `${Math.round(value)}%` : formatCompactNumber(value).replace('$', '')}
                tick={{ fontSize: theme.typography.body2.fontSize }}
              />
              <RechartsTooltip<number, string> content={(props) => <CustomTooltip {...props} viewMode={viewMode} />} />
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
              {viewMode === 'percentage' && (
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
              )}
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

export default StaffTypeHistoryChart; 