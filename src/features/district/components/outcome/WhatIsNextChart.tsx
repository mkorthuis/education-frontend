import React, { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { Box, Typography, useTheme, useMediaQuery, FormControl, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useParams } from 'react-router-dom';
import * as outcomeSlice from '@/store/slices/outcomeSlice';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import { POST_GRADUATION_TYPE_ORDER } from '@/features/district/utils/outcomeDataProcessing';

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

const WhatIsNextChart: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { id } = useParams<{ id: string }>();
  const districtId = id ? parseInt(id) : 0;

  const postGraduationTypes = useAppSelector(outcomeSlice.selectPostGraduationTypes);
  const districtData = useAppSelector(state => 
    outcomeSlice.selectDistrictPostGraduationData(state, { district_id: districtId }));
  const stateData = useAppSelector(state => 
    outcomeSlice.selectStatePostGraduationData(state, {}));

  // Set initial selected type to "4 year college"
  const [selectedType, setSelectedType] = useState<string>(() => {
    const fourYearCollege = postGraduationTypes.find(type => 
      type.name.toLowerCase().includes('4 year') || 
      type.name.toLowerCase().includes('four year')
    );
    return fourYearCollege?.id.toString() || postGraduationTypes[0]?.id.toString() || '';
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
          formattedYear: `'${item.year.toString().slice(-2)}`,
          district: 0,
          state: 0,
          total: 0
        };
      }
      acc[item.year].total = (acc[item.year].total as number) + item.value;
      return acc;
    }, {} as Record<string, ChartDataPoint>);

    // Calculate district percentages
    districtData.forEach(item => {
      const yearData = yearGroups[item.year];
      if (yearData && (yearData.total as number) > 0) {
        const percentage = (item.value / (yearData.total as number)) * 100;
        if (item.post_graduation_type.id.toString() === selectedType) {
          yearData.district = Number(percentage.toFixed(1));
        }
      }
    });

    // Calculate state percentages
    stateData.forEach(item => {
      const yearData = yearGroups[item.year];
      if (yearData && item.post_graduation_type.id.toString() === selectedType) {
        const stateTotal = stateData
          .filter(stateItem => stateItem.year === item.year)
          .reduce((sum, stateItem) => sum + stateItem.value, 0);
        
        if (stateTotal > 0) {
          const percentage = (item.value / stateTotal) * 100;
          yearData.state = Number(percentage.toFixed(1));
        }
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
          formattedYear: `'${year.toString().slice(-2)}`,
          district: 0,
          state: 0,
          total: 0
        };
      }
    });

    return Object.values(yearGroups)
      .sort((a, b) => parseInt(a.year) - parseInt(b.year));
  }, [districtData, stateData, selectedType]);

  // Calculate Y-axis domain
  const allValues = chartData.flatMap(d => [d.district, d.state]).filter(v => !isNaN(v));
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const padding = (maxValue - minValue) * 0.1; // 10% padding
  const yDomainMin = Math.max(0, Math.floor(minValue - padding));
  const yDomainMax = Math.ceil(maxValue + padding);

  const selectedTypeName = postGraduationTypes.find(type => type.id.toString() === selectedType)?.name || '';

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
          <Typography 
            variant="body1" 
            sx={{ 
              textAlign: "left",
              width: "100%",
              fontWeight: 'medium'
            }} 
          >
            {isMobile 
              ? selectedTypeName.toLowerCase() === 'unknown' 
                ? selectedTypeName 
                : `${selectedTypeName} Planned`
              : `Plan For ${selectedTypeName}`}
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
            {isMobile ? '(% of Graduates)' : '(Percentage of Graduates)'}
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
            value={selectedType}
            onChange={handleTypeChange}
            displayEmpty
            inputProps={{ 'aria-label': 'post-graduation type selector' }}
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
            {[...postGraduationTypes]
              .sort((a, b) => {
                const aIndex = POST_GRADUATION_TYPE_ORDER.indexOf(a.name as typeof POST_GRADUATION_TYPE_ORDER[number]);
                const bIndex = POST_GRADUATION_TYPE_ORDER.indexOf(b.name as typeof POST_GRADUATION_TYPE_ORDER[number]);
                return aIndex - bIndex;
              })
              .map((type) => (
                <MenuItem key={type.id} value={type.id.toString()}>
                  {type.name}
                </MenuItem>
              ))}
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
    </>
  );
};

export default WhatIsNextChart; 