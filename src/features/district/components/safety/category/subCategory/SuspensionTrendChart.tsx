import React, { useMemo, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { 
  Typography, 
  Box, 
  useMediaQuery, 
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAppSelector } from '@/store/hooks';
import {
  selectDistrictDisciplineCountData,
  selectStateDisciplineCountData,
  selectDisciplineCountTypes,
  selectDistrictEnrollmentData,
  selectStateEnrollmentData
} from '@/store/slices/safetySlice';
import { selectCurrentDistrict } from '@/store/slices/locationSlice';
import { 
  calculatePer100Students, 
  IN_SCHOOL_SUSPENSION_TYPE,
  OUT_OF_SCHOOL_SUSPENSION_TYPE 
} from '@/features/district/utils/safetyDataProcessing';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';

// Define types
type SuspensionFilterType = 'overall' | 'in-school' | 'out-of-school';

interface SuspensionTrendChartProps {
  className?: string;
}

interface ChartDataPoint {
  year: string;
  formattedYear: string;
  district: number;
  state: number | null;
  overallDistrict?: number;
}

interface TooltipEntry {
  dataKey: string;
  value: number;
  name: string;
  color: string;
}

// Chart title mapping
const CHART_TITLES = {
  'overall': 'All Suspensions By Year',
  'in-school': 'In-School By Year',
  'out-of-school': 'Out-of-School By Year'
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label, getLineName }: any) => {
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
      {payload.map((entry: TooltipEntry, index: number) => {
        // Skip duplicate data
        if (entry.dataKey === 'overallDistrict' && 
            payload.some((p: TooltipEntry) => p.dataKey === 'district' && p.value === entry.value)) {
          return null;
        }
        
        const name = getLineName(entry.dataKey);
        
        return (
          <Typography
            key={`tooltip-${index}`}
            variant="body2"
            sx={{ color: entry.color, mb: 0.5 }}
          >
            {`${name}: ${entry.value.toFixed(2)} per 100 students`}
          </Typography>
        );
      })}
    </Box>
  );
};

// Chart header component
const ChartHeader = ({ title, filterType, handleFilterChange }: {
  title: string;
  filterType: SuspensionFilterType;
  handleFilterChange: (event: SelectChangeEvent) => void;
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
        (Per 100 Students)
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
        value={filterType}
        onChange={handleFilterChange}
        displayEmpty
        inputProps={{ 'aria-label': 'suspension type filter' }}
      >
        <MenuItem value="overall">Overall</MenuItem>
        <MenuItem value="in-school">In-School</MenuItem>
        <MenuItem value="out-of-school">Out-of-School</MenuItem>
      </Select>
    </FormControl>
  </Box>
);

// Empty state component
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
      No data available
    </Typography>
  </Box>
);

const SuspensionTrendChart: React.FC<SuspensionTrendChartProps> = ({ className }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [filterType, setFilterType] = useState<SuspensionFilterType>('overall');
  
  // Get the data from the store
  const district = useAppSelector(selectCurrentDistrict);
  const districtDisciplineCountData = useAppSelector(state => 
    selectDistrictDisciplineCountData(state, {district_id: district?.id}));
  const stateDisciplineCountData = useAppSelector(state => 
    selectStateDisciplineCountData(state, {}));
  const disciplineCountTypes = useAppSelector(selectDisciplineCountTypes);
  const districtEnrollmentData = useAppSelector(state => 
    selectDistrictEnrollmentData(state, {district_id: district?.id}));
  const stateEnrollmentData = useAppSelector(state => 
    selectStateEnrollmentData(state, {}));
  
  // Handle filter change
  const handleFilterChange = (event: SelectChangeEvent) => {
    setFilterType(event.target.value as SuspensionFilterType);
  };
  
  // Get line names based on selected filter
  const getLineName = (dataKey: string) => {
    if (filterType === 'overall') {
      return dataKey === 'district' ? 'District' : 'State Average';
    } 
    
    const prefix = filterType === 'in-school' ? 'In-School' : 'Out-of-School';
    
    switch (dataKey) {
      case 'district': return `${prefix} District`;
      case 'state': return `${prefix} State`;
      case 'overallDistrict': return 'Overall District';
      default: return dataKey;
    }
  };
  
  // Prepare chart data
  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (!districtDisciplineCountData || !stateDisciplineCountData || 
        !disciplineCountTypes || !districtEnrollmentData || !stateEnrollmentData) {
      return [];
    }
    
    // Find suspension count types
    const inSchoolSuspensionType = disciplineCountTypes.find(type => 
      type.name.includes(IN_SCHOOL_SUSPENSION_TYPE));
    const outOfSchoolSuspensionType = disciplineCountTypes.find(type => 
      type.name.includes(OUT_OF_SCHOOL_SUSPENSION_TYPE));
    
    if (!inSchoolSuspensionType || !outOfSchoolSuspensionType) {
      return [];
    }
    
    // Get all unique years
    const years = [...new Set(districtDisciplineCountData.map(item => item.year))].sort();
    
    // Create enrollment lookup maps
    const districtEnrollmentByYear = new Map(
      districtEnrollmentData.map(item => [item.year, item.total_enrollment])
    );
    const stateEnrollmentByYear = new Map(
      stateEnrollmentData.map(item => [item.year, item.total_enrollment])
    );
    
    // Calculate suspension rates for each year
    return years.map(year => {
      // Filter data for current year
      const yearDistrictData = districtDisciplineCountData.filter(item => item.year === year);
      const yearStateData = stateDisciplineCountData.filter(item => item.year === year);
      
      // Get district counts
      const inSchoolSuspensionsCount = yearDistrictData.find(item => 
        item.count_type.id === inSchoolSuspensionType.id)?.count || 0;
      const outOfSchoolSuspensionsCount = yearDistrictData.find(item => 
        item.count_type.id === outOfSchoolSuspensionType.id)?.count || 0;
      
      // Get state counts
      const stateInSchoolSuspensionsCount = yearStateData.find(item => 
        item.count_type.id === inSchoolSuspensionType.id)?.count || 0;
      const stateOutOfSchoolSuspensionsCount = yearStateData.find(item => 
        item.count_type.id === outOfSchoolSuspensionType.id)?.count || 0;
      
      // Get enrollment data
      const districtEnrollment = districtEnrollmentByYear.get(year) || 0;
      const stateEnrollment = stateEnrollmentByYear.get(year) || 0;
      
      // Calculate total suspensions
      const totalDistrictSuspensions = inSchoolSuspensionsCount + outOfSchoolSuspensionsCount;
      const totalStateSuspensions = stateInSchoolSuspensionsCount + stateOutOfSchoolSuspensionsCount;
      
      // Calculate overall rates
      const overallDistrictRate = calculatePer100Students(totalDistrictSuspensions, districtEnrollment);
      const overallStateRate = stateEnrollment ? 
        calculatePer100Students(totalStateSuspensions, stateEnrollment) : null;
      
      // Select counts based on filter type
      let districtCount: number;
      let stateCount: number;
      
      switch (filterType) {
        case 'in-school':
          districtCount = inSchoolSuspensionsCount;
          stateCount = stateInSchoolSuspensionsCount;
          break;
        case 'out-of-school':
          districtCount = outOfSchoolSuspensionsCount;
          stateCount = stateOutOfSchoolSuspensionsCount;
          break;
        case 'overall':
        default:
          districtCount = totalDistrictSuspensions;
          stateCount = totalStateSuspensions;
          break;
      }
      
      // Calculate rates per 100 students
      const districtRate = calculatePer100Students(districtCount, districtEnrollment);
      const stateRate = stateEnrollment ? 
        calculatePer100Students(stateCount, stateEnrollment) : null;
      
      const result: ChartDataPoint = {
        year: year.toString(),
        formattedYear: formatFiscalYear(year) || year.toString(),
        district: districtRate,
        state: stateRate
      };
      
      // Add overall district rate for non-overall views
      if (filterType !== 'overall') {
        result.overallDistrict = overallDistrictRate;
      }
      
      return result;
    });
  }, [
    districtDisciplineCountData, 
    stateDisciplineCountData, 
    disciplineCountTypes,
    districtEnrollmentData, 
    stateEnrollmentData,
    filterType
  ]);
  
  // Calculate min value for Y-axis
  const minValue = useMemo(() => {
    if (chartData.length === 0) return 0;
    
    const allValues = chartData.flatMap(d => {
      const values = [d.district];
      if (d.state !== null) values.push(d.state);
      if (d.overallDistrict !== undefined) values.push(d.overallDistrict);
      return values;
    });
    
    return Math.max(0, Math.floor(Math.min(...allValues) * 0.95));
  }, [chartData]);
  
  const showOverallLines = filterType !== 'overall';
  const chartTitle = CHART_TITLES[filterType];
  
  return (
    <Box sx={{ mt: 3, width: '100%', position: 'relative' }}>
      <ChartHeader 
        title={chartTitle}
        filterType={filterType}
        handleFilterChange={handleFilterChange}
      />
      
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
                domain={[minValue, 'auto']}
                tickFormatter={(value) => value.toFixed(1)}
                tick={{ fontSize: theme.typography.body2.fontSize }}
              />
              <Tooltip content={<CustomTooltip getLineName={getLineName} />} />
              <Legend 
                wrapperStyle={{ fontSize: theme.typography.body2.fontSize }}
                formatter={(value, entry) => getLineName((entry as any).dataKey)}
              />
              
              {/* Main suspension rate lines */}
              <Line
                type="monotone"
                dataKey="district"
                stroke={theme.palette.primary.main}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="state"
                stroke={theme.palette.secondary.main}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls
              />
              
              {/* Overall suspension rate line */}
              {showOverallLines && (
                <Line
                  type="monotone"
                  dataKey="overallDistrict"
                  stroke={theme.palette.grey[500]}
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  dot={false}
                  activeDot={false}
                  connectNulls
                />
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

export default SuspensionTrendChart; 