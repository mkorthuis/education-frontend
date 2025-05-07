import React, { useMemo, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { 
  Typography, 
  Box, 
  useMediaQuery, 
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  Tooltip
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import { useAppSelector } from '@/store/hooks';
import {
  selectEfaEntries,
  selectEfaStateEntries,
  selectEfaEntryTypes
} from '@/store/slices/efaSlice';
import {
  selectTownEnrollment,
  selectStateTownEnrollment
} from '@/store/slices/enrollmentSlice';
import { selectCurrentDistrict } from '@/store/slices/locationSlice';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

// Define types for the component props and data
type DisplayMode = 'count' | 'percentage';

interface EfaTrendChartProps {
  className?: string;
}

// Custom tooltip component for the chart
const CustomTooltip = ({ active, payload, label, displayMode }: any) => {
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
      {payload.map((entry: any, index: number) => {
        // In count mode, only show district data
        if (displayMode === 'count' && entry.dataKey !== 'district') {
          return null;
        }
        
        const name = entry.dataKey === 'district' || entry.dataKey === 'districtPercentage' 
          ? 'District'
          : 'State Average';
        
        const value = displayMode === 'count'
          ? entry.value
          : `${entry.value.toFixed(2)}%`;
        
        const suffix = displayMode === 'count' 
          ? ' students' 
          : ' of total enrollment';
        
        return (
          <Typography
            key={`tooltip-${index}`}
            variant="body2"
            sx={{ color: entry.color, mb: 0.5 }}
          >
            {`${name}: ${value}${suffix}`}
          </Typography>
        );
      })}
    </Box>
  );
};

// Chart header component with display mode selector
const ChartHeader = ({ 
  title, 
  displayMode, 
  handleDisplayModeChange,
  isMobile
}: {
  title: string;
  displayMode: DisplayMode;
  handleDisplayModeChange: (event: SelectChangeEvent) => void;
  isMobile: boolean;
}) => (
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
        {title}
      </Typography>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        width: "100%"
      }}>
        <Typography        
          variant="body2" 
          sx={{ 
            textAlign: "left",
            fontWeight: 'medium',
            fontStyle: 'italic',
            color: 'text.secondary',
            mr: 0.5
          }}
        >
          {displayMode === 'percentage' 
            ? isMobile ? '(% of Public Enrollment)' : '(% of Public School Enrollment)'
            : '(# of Students)'}
        </Typography>
        {/* {displayMode === 'percentage' && (
          <Tooltip title="This percentage is OVERSTATED.  This is a percentage of PUBLIC SCHOOL ENROLLMENT, not total student population.  The state does not report total student population data." arrow>
            <HelpOutlineIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
          </Tooltip>
        )} */}
      </Box>
    </Box>
    
    <FormControl 
      size="small" 
      sx={{ 
        minWidth: 150,
        ml: 2,
      }}
    >
      <Select
        value={displayMode}
        onChange={handleDisplayModeChange}
        displayEmpty
        inputProps={{ 'aria-label': 'display mode selector' }}
      >
        <MenuItem value="count">Grants</MenuItem>
        <MenuItem value="percentage">Percentage</MenuItem>
      </Select>
    </FormControl>
  </Box>
);

// Empty state component when there is no data
const EmptyState = () => (
  <Box
    sx={{
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Typography variant="body1" color="text.secondary">
      No EFA grant data available
    </Typography>
  </Box>
);

// The main component
const EfaTrendChart: React.FC<EfaTrendChartProps> = ({ className }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [displayMode, setDisplayMode] = useState<DisplayMode>('count');
  
  // Get the current district
  const district = useAppSelector(selectCurrentDistrict);
  const districtParams = { district_id: district?.id };
  const stateParams = {};

  // Get all the data needed for the chart
  const districtData = useAppSelector(state => 
    selectEfaEntries(state, districtParams));
  const stateData = useAppSelector(state => 
    selectEfaStateEntries(state, stateParams));
  const entryTypes = useAppSelector(selectEfaEntryTypes);
  const districtEnrollmentData = useAppSelector(state => 
    selectTownEnrollment(state, districtParams));
  const stateEnrollmentData = useAppSelector(state => 
    selectStateTownEnrollment(state, stateParams));
  
  // Find the Base Aid entry type ID
  const baseAidEntryType = entryTypes.find(type => type.name === "Base Aid");
  const baseAidEntryTypeId = baseAidEntryType ? baseAidEntryType.id : null;
  
  // Use the district name if available, or a default string
  const districtName = district?.name || 'District';
  
  // Handle display mode change
  const handleDisplayModeChange = (event: SelectChangeEvent) => {
    setDisplayMode(event.target.value as DisplayMode);
  };
  
  // Calculate total enrollment by year
  const totalEnrollmentByYear = useMemo(() => {
    const districtTotals: { [year: number]: number } = {};
    const stateTotals: { [year: number]: number } = {};
    
    // Process district enrollment data
    districtEnrollmentData.forEach(entry => {
      if (!districtTotals[entry.year]) {
        districtTotals[entry.year] = 0;
      }
      // Safely access enrollment properties
      let enrollmentValue = 0;
      if ('enrollment' in entry && typeof entry.enrollment === 'number') {
        enrollmentValue = entry.enrollment;
      } else if ('total_enrollment' in entry && typeof (entry as any).total_enrollment === 'number') {
        enrollmentValue = (entry as any).total_enrollment;
      }
      districtTotals[entry.year] += enrollmentValue;
    });
    
    // Process state enrollment data
    stateEnrollmentData.forEach(entry => {
      if (!stateTotals[entry.year]) {
        stateTotals[entry.year] = 0;
      }
      // Safely access enrollment properties
      let enrollmentValue = 0;
      if ('enrollment' in entry && typeof entry.enrollment === 'number') {
        enrollmentValue = entry.enrollment;
      } else if ('total_enrollment' in entry && typeof (entry as any).total_enrollment === 'number') {
        enrollmentValue = (entry as any).total_enrollment;
      }
      stateTotals[entry.year] += enrollmentValue;
    });
    
    return { district: districtTotals, state: stateTotals };
  }, [districtEnrollmentData, stateEnrollmentData]);
  
  // Prepare data for the chart
  const chartData = useMemo(() => {
    if (!baseAidEntryTypeId) return [];
    
    const yearData: { [year: number]: any } = {};
    
    // Initialize with district data
    districtData.forEach(entry => {
      if (entry.entry_type_id === baseAidEntryTypeId) {
        const year = entry.year;
        const yearString = formatFiscalYear(year);
        
        if (!yearData[year]) {
          yearData[year] = {
            year,
            formattedYear: yearString || `${year}`,
            district: 0,
            districtPercentage: 0,
            state: 0,
            statePercentage: 0
          };
        }
        
        yearData[year].district += entry.value;
        
        // Calculate percentage if enrollment data exists
        if (totalEnrollmentByYear.district[year] && totalEnrollmentByYear.district[year] > 0) {
          yearData[year].districtPercentage = (entry.value / totalEnrollmentByYear.district[year]) * 100;
        }
      }
    });
    
    // Add state data
    stateData.forEach(entry => {
      if (entry.entry_type_id === baseAidEntryTypeId) {
        const year = entry.year;
        const yearString = formatFiscalYear(year);
        
        if (!yearData[year]) {
          yearData[year] = {
            year,
            formattedYear: yearString || `${year}`,
            district: 0,
            districtPercentage: 0,
            state: 0,
            statePercentage: 0
          };
        }
        
        yearData[year].state += entry.value;
        
        // Calculate percentage if enrollment data exists
        if (totalEnrollmentByYear.state[year] && totalEnrollmentByYear.state[year] > 0) {
          yearData[year].statePercentage = (entry.value / totalEnrollmentByYear.state[year]) * 100;
        }
      }
    });
    
    // Convert to array and sort by year
    return Object.values(yearData).sort((a: any, b: any) => a.year - b.year);
  }, [districtData, stateData, baseAidEntryTypeId, totalEnrollmentByYear]);
  
  // Calculate the min value for the Y axis
  const minValue = useMemo(() => {
    if (chartData.length === 0) return 0;
    
    if (displayMode === 'count') {
      const minDistrict = Math.min(...chartData.map((d: any) => d.district));
      return Math.max(0, minDistrict * 0.8);
    } else {
      const minDistrictPercentage = Math.min(...chartData.map((d: any) => d.districtPercentage));
      const minStatePercentage = Math.min(...chartData
        .filter((d: any) => d.statePercentage > 0)
        .map((d: any) => d.statePercentage));
      return Math.max(0, Math.min(minDistrictPercentage, minStatePercentage) * 0.8);
    }
  }, [chartData, displayMode]);

  return (
    <Box sx={{ mt: 3, width: '100%', position: 'relative', ...(className ? { className } : {}) }}>
      <ChartHeader 
        title='EFA Grants by Year'
        displayMode={displayMode}
        handleDisplayModeChange={handleDisplayModeChange}
        isMobile={isMobile}
      />
      
      <Box sx={{ height: isMobile ? 300 : 400, width: '100%' }}>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 10, left:-15, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="formattedYear"
                tick={{ fontSize: theme.typography.body2.fontSize }}
              />
              <YAxis
                domain={[minValue, 'auto']}
                tickFormatter={(value) => displayMode === 'percentage' ? `${value.toFixed(1)}%` : value.toLocaleString()}
                tick={{ fontSize: theme.typography.body2.fontSize }}
              />
              <RechartsTooltip content={<CustomTooltip displayMode={displayMode} />} />
              <Legend 
                wrapperStyle={{ fontSize: theme.typography.body2.fontSize }}
              />
              
              {/* District and state lines based on display mode */}
              {displayMode === 'count' ? (
                <Line
                  type="monotone"
                  dataKey="district"
                  name={districtName}
                  stroke={theme.palette.primary.main}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ) : (
                <>
                  <Line
                    type="monotone"
                    dataKey="districtPercentage"
                    name={districtName}
                    stroke={theme.palette.primary.main}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="statePercentage"
                    name="State Average"
                    stroke={theme.palette.secondary.main}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState />
        )}
      </Box>
    </Box>
  );
};

export default EfaTrendChart; 