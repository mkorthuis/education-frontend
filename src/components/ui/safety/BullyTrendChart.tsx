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
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import { calculatePer100Students } from '@/utils/safetyCalculations';

// Define types
type BullyingFilterType = 'all' | string;

// Define the proper data types
interface BullyingDataItem {
  year: number;
  bullying_type: {
    id: number;
    name: string;
  };
  investigated_actual: number;
}

interface EnrollmentDataItem {
  year: number;
  total_enrollment: number;
}

interface BullyTrendChartProps {
  className?: string;
  entityData: BullyingDataItem[];
  stateData: BullyingDataItem[];
  bullyingTypes: Array<{ id: number; name: string; }>;
  entityEnrollmentData: EnrollmentDataItem[];
  stateEnrollmentData: EnrollmentDataItem[];
  entityName?: string;
  isDistrict?: boolean;
}

interface ChartDataPoint {
  year: string;
  formattedYear: string;
  entity: number;
  state: number | null;
  overallEntity?: number;
}

interface TooltipEntry {
  dataKey: string;
  value: number;
  name: string;
  color: string;
}

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
const ChartHeader = ({ title, filterType, handleFilterChange, bullyingTypes }: {
  title: string;
  filterType: BullyingFilterType;
  handleFilterChange: (event: SelectChangeEvent) => void;
  bullyingTypes: Array<{ id: number; name: string; }>;
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
        inputProps={{ 'aria-label': 'bullying type filter' }}
      >
        <MenuItem value="all">All Types</MenuItem>
        {bullyingTypes.map((type) => (
          <MenuItem key={type.id} value={type.id.toString()}>{type.name}</MenuItem>
        ))}
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

const BullyTrendChart: React.FC<BullyTrendChartProps> = ({ 
  className,
  entityData,
  stateData,
  bullyingTypes: originalBullyingTypes,
  entityEnrollmentData,
  stateEnrollmentData,
  entityName,
  isDistrict = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [filterType, setFilterType] = useState<BullyingFilterType>('all');
  
  // Default entity name based on context if not provided
  const defaultEntityName = isDistrict ? 'District' : 'School';
  const displayEntityName = entityName || defaultEntityName;
  
  // Transform bullying types: rename and reorder
  const bullyingTypes = useMemo(() => {
    if (!originalBullyingTypes || originalBullyingTypes.length === 0) return [];
    
    // Create a modified copy with renamed types
    const modifiedTypes = originalBullyingTypes.map(type => ({
      ...type,
      name: type.name === 'Cyber-bullying' 
        ? 'Cyber Bullying' 
        : type.name === 'Bullying (of any kind)' 
          ? 'Other Bullying' 
          : type.name
    }));
    
    // Sort to ensure Cyber Bullying appears first
    return modifiedTypes.sort((a, b) => {
      if (a.name === 'Cyber Bullying') return -1;
      if (b.name === 'Cyber Bullying') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [originalBullyingTypes]);
  
  // Handle filter change
  const handleFilterChange = (event: SelectChangeEvent) => {
    setFilterType(event.target.value);
  };
  
  // Get line names based on selected filter
  const getLineName = (dataKey: string) => {
    if (filterType === 'all') {
      return dataKey === 'entity' ? displayEntityName : 'State Average';
    } 
    
    const selectedBullyingType = bullyingTypes.find(type => type.id.toString() === filterType)?.name || 'Selected Type';
    
    switch (dataKey) {
      case 'entity': return `${selectedBullyingType} ${displayEntityName}`;
      case 'state': return `${selectedBullyingType} State`;
      case 'overallEntity': return `All Types ${displayEntityName}`;
      default: return dataKey;
    }
  };
  
  // Chart title
  const getChartTitle = () => {
    const suffix = isMobile ? '' : ' By Year';
    
    if (filterType === 'all') {
      return `Bullying Incidents${suffix}`;
    }
    
    const typeName = bullyingTypes.find(type => type.id.toString() === filterType)?.name;
    return `${typeName} Incidents${suffix}`;
  };
  
  // Prepare chart data
  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (!entityData || !stateData || 
        !bullyingTypes || !entityEnrollmentData || !stateEnrollmentData) {
      return [];
    }
    
    // Get all unique years
    const years = [...new Set(entityData.map(item => item.year))].sort();
    
    // Create enrollment lookup maps
    const entityEnrollmentByYear = new Map(
      entityEnrollmentData.map(item => [item.year, item.total_enrollment])
    );
    const stateEnrollmentByYear = new Map(
      stateEnrollmentData.map(item => [item.year, item.total_enrollment])
    );
    
    // Calculate bullying rates for each year
    return years.map(year => {
      // Filter data for current year
      const yearEntityData = entityData.filter(item => item.year === year);
      const yearStateData = stateData.filter(item => item.year === year);
      
      // Get enrollment data
      const entityEnrollment = entityEnrollmentByYear.get(year) || 0;
      const stateEnrollment = stateEnrollmentByYear.get(year) || 0;
      
      // Select counts based on filter type
      let entityCount: number;
      let stateCount: number;
      
      if (filterType === 'all') {
        // Sum all bullying types
        entityCount = yearEntityData.reduce((sum, item) => sum + (item.investigated_actual || 0), 0);
        stateCount = yearStateData.reduce((sum, item) => sum + (item.investigated_actual || 0), 0);
      } else {
        // Filter by specific bullying type
        const selectedTypeId = parseInt(filterType as string);
        
        entityCount = yearEntityData
          .filter(item => item.bullying_type.id === selectedTypeId)
          .reduce((sum, item) => sum + (item.investigated_actual || 0), 0);
          
        stateCount = yearStateData
          .filter(item => item.bullying_type.id === selectedTypeId)
          .reduce((sum, item) => sum + (item.investigated_actual || 0), 0);
      }
      
      // Calculate total bullying across all types
      const totalEntityBullying = yearEntityData.reduce((sum, item) => sum + (item.investigated_actual || 0), 0);
      
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
      if (filterType !== 'all') {
        const overallEntityRate = calculatePer100Students(totalEntityBullying, entityEnrollment);
        result.overallEntity = overallEntityRate;
      }
      
      return result;
    });
  }, [
    entityData, 
    stateData, 
    bullyingTypes,
    entityEnrollmentData, 
    stateEnrollmentData,
    filterType,
    displayEntityName
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
  
  const showOverallLines = filterType !== 'all';
  const chartTitle = getChartTitle();
  
  return (
    <Box sx={{ mt: 3, width: '100%', position: 'relative' }}>
      <ChartHeader 
        title={chartTitle}
        filterType={filterType}
        handleFilterChange={handleFilterChange}
        bullyingTypes={bullyingTypes}
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
              
              {/* Main bullying rate lines */}
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
              
              {/* Overall entity rate line */}
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

export default BullyTrendChart; 