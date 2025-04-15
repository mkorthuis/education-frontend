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
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';

// Define types
export type SuspensionFilterType = 'overall' | 'in-school' | 'out-of-school';

export interface DisciplineCountType {
  id: number;
  name: string;
}

export interface DisciplineCountData {
  year: number;
  count: number;
  count_type: {
    id: number;
    name: string;
  };
}

export interface EnrollmentData {
  year: number;
  total_enrollment: number;
}

export interface ChartDataPoint {
  year: string;
  formattedYear: string;
  entity: number;
  state: number | null;
  overallEntity?: number;
}

export interface SuspensionTrendChartProps {
  entityName: string;
  entityDisciplineCountData: DisciplineCountData[];
  stateDisciplineCountData: DisciplineCountData[];
  disciplineCountTypes: DisciplineCountType[];
  entityEnrollmentData: EnrollmentData[];
  stateEnrollmentData: EnrollmentData[];
  calculatePer100Students: (count: number, enrollment: number) => number;
  inSchoolSuspensionType: string;
  outOfSchoolSuspensionType: string;
  entityKey?: string;
  className?: string;
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
        if (entry.dataKey === 'overallEntity' && 
            payload.some((p: TooltipEntry) => p.dataKey === 'entity' && p.value === entry.value)) {
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

const SuspensionTrendChart: React.FC<SuspensionTrendChartProps> = ({ 
  entityName,
  entityDisciplineCountData,
  stateDisciplineCountData,
  disciplineCountTypes,
  entityEnrollmentData,
  stateEnrollmentData,
  calculatePer100Students,
  inSchoolSuspensionType,
  outOfSchoolSuspensionType,
  entityKey = 'entity',
  className 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [filterType, setFilterType] = useState<SuspensionFilterType>('overall');
  
  // Handle filter change
  const handleFilterChange = (event: SelectChangeEvent) => {
    setFilterType(event.target.value as SuspensionFilterType);
  };
  
  // Get line names based on selected filter
  const getLineName = (dataKey: string) => {
    if (filterType === 'overall') {
      return dataKey === 'entity' ? entityName : 'State Average';
    } 
    
    const prefix = filterType === 'in-school' ? 'In-School' : 'Out-of-School';
    
    switch (dataKey) {
      case 'entity': return `${prefix} ${entityName}`;
      case 'state': return `${prefix} State`;
      case 'overallEntity': return `Overall ${entityName}`;
      default: return dataKey;
    }
  };
  
  // Prepare chart data
  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (!entityDisciplineCountData || !stateDisciplineCountData || 
        !disciplineCountTypes || !entityEnrollmentData || !stateEnrollmentData) {
      return [];
    }
    
    // Find suspension count types
    const inSchoolSuspensionTypeObj = disciplineCountTypes.find(type => 
      type.name.includes(inSchoolSuspensionType));
    const outOfSchoolSuspensionTypeObj = disciplineCountTypes.find(type => 
      type.name.includes(outOfSchoolSuspensionType));
    
    if (!inSchoolSuspensionTypeObj || !outOfSchoolSuspensionTypeObj) {
      return [];
    }
    
    // Get all unique years
    const years = [...new Set(entityDisciplineCountData.map(item => item.year))].sort();
    
    // Create enrollment lookup maps
    const entityEnrollmentByYear = new Map(
      entityEnrollmentData.map(item => [item.year, item.total_enrollment])
    );
    const stateEnrollmentByYear = new Map(
      stateEnrollmentData.map(item => [item.year, item.total_enrollment])
    );
    
    // Calculate suspension rates for each year
    return years.map(year => {
      // Filter data for current year
      const yearEntityData = entityDisciplineCountData.filter(item => item.year === year);
      const yearStateData = stateDisciplineCountData.filter(item => item.year === year);
      
      // Get entity counts
      const inSchoolSuspensionsCount = yearEntityData.find(item => 
        item.count_type.id === inSchoolSuspensionTypeObj.id)?.count || 0;
      const outOfSchoolSuspensionsCount = yearEntityData.find(item => 
        item.count_type.id === outOfSchoolSuspensionTypeObj.id)?.count || 0;
      
      // Get state counts
      const stateInSchoolSuspensionsCount = yearStateData.find(item => 
        item.count_type.id === inSchoolSuspensionTypeObj.id)?.count || 0;
      const stateOutOfSchoolSuspensionsCount = yearStateData.find(item => 
        item.count_type.id === outOfSchoolSuspensionTypeObj.id)?.count || 0;
      
      // Get enrollment data
      const entityEnrollment = entityEnrollmentByYear.get(year) || 0;
      const stateEnrollment = stateEnrollmentByYear.get(year) || 0;
      
      // Calculate total suspensions
      const totalEntitySuspensions = inSchoolSuspensionsCount + outOfSchoolSuspensionsCount;
      const totalStateSuspensions = stateInSchoolSuspensionsCount + stateOutOfSchoolSuspensionsCount;
      
      // Calculate overall rates
      const overallEntityRate = calculatePer100Students(totalEntitySuspensions, entityEnrollment);
      const overallStateRate = stateEnrollment ? 
        calculatePer100Students(totalStateSuspensions, stateEnrollment) : null;
      
      // Select counts based on filter type
      let entityCount: number;
      let stateCount: number;
      
      switch (filterType) {
        case 'in-school':
          entityCount = inSchoolSuspensionsCount;
          stateCount = stateInSchoolSuspensionsCount;
          break;
        case 'out-of-school':
          entityCount = outOfSchoolSuspensionsCount;
          stateCount = stateOutOfSchoolSuspensionsCount;
          break;
        case 'overall':
        default:
          entityCount = totalEntitySuspensions;
          stateCount = totalStateSuspensions;
          break;
      }
      
      // Calculate rates per 100 students
      const entityRate = calculatePer100Students(entityCount, entityEnrollment);
      const stateRate = stateEnrollment ? 
        calculatePer100Students(stateCount, stateEnrollment) : null;
      
      const result: ChartDataPoint = {
        year: year.toString(),
        formattedYear: formatFiscalYear(year) || year.toString(),
        entity: entityRate,
        state: stateRate
      };
      
      // Add overall entity rate for non-overall views
      if (filterType !== 'overall') {
        result.overallEntity = overallEntityRate;
      }
      
      return result;
    });
  }, [
    entityDisciplineCountData, 
    stateDisciplineCountData, 
    disciplineCountTypes,
    entityEnrollmentData, 
    stateEnrollmentData,
    filterType,
    inSchoolSuspensionType,
    outOfSchoolSuspensionType,
    calculatePer100Students
  ]);
  
  // Calculate min value for Y-axis
  const minValue = useMemo(() => {
    if (chartData.length === 0) return 0;
    
    const allValues = chartData.flatMap(d => {
      const values = [d.entity];
      if (d.state !== null) values.push(d.state);
      if (d.overallEntity !== undefined) values.push(d.overallEntity);
      return values;
    });
    
    return Math.max(0, Math.floor(Math.min(...allValues) * 0.95));
  }, [chartData]);
  
  const showOverallLines = filterType !== 'overall';
  const chartTitle = CHART_TITLES[filterType];
  
  return (
    <Box sx={{ mt: 3, width: '100%', position: 'relative', ...(className ? { className } : {}) }}>
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
                dataKey="entity"
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
                  dataKey="overallEntity"
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