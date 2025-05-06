import React, { useState } from 'react';
import { Box, Typography, useTheme, useMediaQuery, FormControl, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { POST_GRADUATION_TYPE_ORDER } from '@/features/district/utils/outcomeDataProcessing';

interface ChartDataPoint {
  year: string;
  formattedYear: string;
  entity: number;  // District or School data
  state: number;
  total: number;
}

interface TooltipEntry {
  dataKey: string;
  value: number;
  name: string;
  color: string;
}

export interface PostSecondaryPlanType {
  id: number;
  name: string;
  description?: string;
}

export interface PostSecondaryPlansChartProps {
  entityLabel: string;  // "School" or "District"
  postGraduationTypes: PostSecondaryPlanType[];
  chartData: ChartDataPoint[];
  defaultSelectedTypeId?: string;
  onTypeChange?: (typeId: string) => void;
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

const PostSecondaryPlansChart: React.FC<PostSecondaryPlansChartProps> = ({
  entityLabel,
  postGraduationTypes,
  chartData,
  defaultSelectedTypeId,
  onTypeChange
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Set initial selected type to "4 year college" or first available type
  const [selectedType, setSelectedType] = useState<string>(() => {
    if (defaultSelectedTypeId) return defaultSelectedTypeId;
    
    const fourYearCollege = postGraduationTypes.find(type => 
      type.name.toLowerCase().includes('4 year') || 
      type.name.toLowerCase().includes('four year')
    );
    return fourYearCollege?.id.toString() || postGraduationTypes[0]?.id.toString() || '';
  });

  const handleTypeChange = (event: SelectChangeEvent) => {
    const newValue = event.target.value;
    setSelectedType(newValue);
    if (onTypeChange) {
      onTypeChange(newValue);
    }
  };

  // Calculate Y-axis domain based on available data
  const allValues = chartData.flatMap(d => [d.entity, d.state]).filter(v => !isNaN(v));
  const minValue = Math.min(...allValues, 0); // Include 0 to ensure we don't have negative minimum
  const maxValue = Math.max(...allValues, 0);
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
                dataKey="entity"
                name={entityLabel}
                stroke={theme.palette.primary.main}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls
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

export default PostSecondaryPlansChart; 