import React, { useState } from 'react';
import { Box, Typography, useTheme, useMediaQuery, FormControl, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TownEnrollmentData, StateTownEnrollmentData } from '@/services/api/endpoints/enrollments';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import { formatCompactNumber } from '@/utils/formatting';
import { Town } from '@/store/slices/locationSlice';

interface ChartDataPoint {
  year: string;
  formattedYear: string;
  town: number;
  townName: string;
}

interface TooltipEntry {
  dataKey: string;
  value: number;
  name: string;
  color: string;
}

export interface TownEnrollmentChartProps {
  districtId?: number;
  enrollmentData?: TownEnrollmentData[];
  stateEnrollmentData?: StateTownEnrollmentData[];
  towns?: Town[];
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
 * Component that displays a chart of enrollment data for towns in a district
 */
const TownEnrollmentChart: React.FC<TownEnrollmentChartProps> = ({
  districtId,
  enrollmentData = [],
  stateEnrollmentData = [],
  towns = []
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Create a map of town IDs to town names
  const townIdToNameMap = React.useMemo(() => {
    const map = new Map<number, string>();
    towns.forEach(town => {
      map.set(town.id, town.name);
    });
    return map;
  }, [towns]);
  
  // State for selected town (using town ID)
  const [selectedTownId, setSelectedTownId] = useState<number | "all">("all");
  
  // Handle town selection change
  const handleTownChange = (event: SelectChangeEvent<number | "all">) => {
    setSelectedTownId(event.target.value as number | "all");
  };
  
  // Get selected town name for display
  const selectedTownName = React.useMemo(() => {
    if (selectedTownId === "all") return "All Towns";
    return townIdToNameMap.get(selectedTownId as number) || "Unknown Town";
  }, [selectedTownId, townIdToNameMap]);
  
  // Process data for the chart
  const chartData = React.useMemo(() => {
    if (!enrollmentData.length) return [];
    
    // Get available years
    const years = [...new Set(enrollmentData.map(item => item.year))].sort();
    
    // Create data points for each year
    return years.map(year => {
      // Filter data for the current year
      const yearData = enrollmentData.filter(item => item.year === year);
      
      // Calculate total district enrollment for this year (sum across all towns and grades)
      // We aggregate first by town to avoid double-counting when summing across grades
      const townTotals = new Map<number, number>();
      
      yearData.forEach(item => {
        if (item.town_id) {
          const currentTotal = townTotals.get(item.town_id) || 0;
          townTotals.set(item.town_id, currentTotal + (item.enrollment || 0));
        }
      });
      
      const districtTotal = Array.from(townTotals.values()).reduce((sum, townTotal) => sum + townTotal, 0);
      
      // If a specific town is selected, get its enrollment (sum across all grades)
      let townEnrollment = 0;
      
      if (selectedTownId !== "all") {
        // Sum enrollment for the selected town across all grades
        townEnrollment = yearData
          .filter(item => item.town_id === selectedTownId)
          .reduce((sum, item) => sum + (item.enrollment || 0), 0);
      } else {
        // When "All Towns" is selected, the town line is the same as district total
        townEnrollment = districtTotal;
      }
      
      return {
        year: year.toString(),
        formattedYear: formatFiscalYear(year),
        town: townEnrollment,
        townName: selectedTownName
      };
    }).sort((a, b) => parseInt(a.year) - parseInt(b.year));
  }, [enrollmentData, selectedTownId, selectedTownName]);
  
  // Calculate Y-axis domain
  const allValues = chartData.flatMap(d => [d.town]).filter(v => v > 0);
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
              {selectedTownId === "all"
                ? (towns.length === 1 
                    ? `Students in ${towns[0].name}`
                    : 'Students in All District Towns')
                : `Students in ${selectedTownName}`}
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
          {towns.length > 1 && (
            <FormControl
              size="small"
              sx={{
                minWidth: 150,
              }}
            >
              <Select
                value={selectedTownId}
                onChange={handleTownChange}
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
                <MenuItem value="all">All Towns</MenuItem>
                {towns.map((town) => (
                  <MenuItem key={town.id} value={town.id}>{town.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
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
                dataKey="town"
                name={selectedTownName}
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

export default TownEnrollmentChart; 