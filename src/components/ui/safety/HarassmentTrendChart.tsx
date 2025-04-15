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
import { calculatePer100Students } from '@/utils/safetyCalculations';

// Define types
type HarassmentFilterType = 'incidents' | 'students-impacted' | 'students-disciplined';

// Define the proper data types
interface HarassmentDataItem {
  year: number;
  classification: {
    id: number;
    name: string;
  };
  incident_count: number;
  student_impact_count: number;
  student_engaged_count: number;
}

interface EnrollmentDataItem {
  year: number;
  total_enrollment: number;
}

interface HarassmentTrendChartProps {
  className?: string;
  entityData: HarassmentDataItem[];
  stateData: HarassmentDataItem[];
  harassmentClassifications: Array<{ id: number; name: string; }>;
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
}

interface TooltipEntry {
  dataKey: string;
  value: number;
  name: string;
  color: string;
}

// Chart title mapping
const CHART_TITLES = {
  'incidents': 'Harassment Incidents By Year',
  'students-impacted': 'Students Impacted By Year',
  'students-disciplined': 'Students Disciplined By Year'
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
const ChartHeader = ({ title, filterType, handleFilterChange, isMobile }: {
  title: string;
  filterType: HarassmentFilterType;
  handleFilterChange: (event: SelectChangeEvent) => void;
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
        inputProps={{ 'aria-label': 'harassment type filter' }}
      >
        <MenuItem value="incidents">Incidents</MenuItem>
        <MenuItem value="students-impacted">Students Impacted</MenuItem>
        <MenuItem value="students-disciplined">Students Disciplined</MenuItem>
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

const HarassmentTrendChart: React.FC<HarassmentTrendChartProps> = ({ 
  className,
  entityData,
  stateData,
  harassmentClassifications,
  entityEnrollmentData,
  stateEnrollmentData,
  entityName,
  isDistrict = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [filterType, setFilterType] = useState<HarassmentFilterType>('incidents');
  
  // Default entity name based on context if not provided
  const defaultEntityName = isDistrict ? 'District' : 'School';
  const displayEntityName = entityName || defaultEntityName;
  
  // Handle filter change
  const handleFilterChange = (event: SelectChangeEvent) => {
    setFilterType(event.target.value as HarassmentFilterType);
  };
  
  // Get line names based on selected filter
  const getLineName = (dataKey: string) => {
    return dataKey === 'entity' ? displayEntityName : 'State Average';
  };
  
  // Get the appropriate title based on selected filter
  const chartTitle = CHART_TITLES[filterType] || 'Harassment Trends';
  
  // Prepare chart data
  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (!entityData || !stateData || 
        !harassmentClassifications || !entityEnrollmentData || !stateEnrollmentData) {
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
    
    // Calculate data counts for each year
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
      
      if (filterType === 'incidents') {
        entityCount = yearEntityData.reduce((sum, item) => sum + item.incident_count, 0);
        stateCount = yearStateData.reduce((sum, item) => sum + item.incident_count, 0);
      } else if (filterType === 'students-impacted') {
        entityCount = yearEntityData.reduce((sum, item) => sum + item.student_impact_count, 0);
        stateCount = yearStateData.reduce((sum, item) => sum + item.student_impact_count, 0);
      } else {
        // students-disciplined
        entityCount = yearEntityData.reduce((sum, item) => sum + item.student_engaged_count, 0);
        stateCount = yearStateData.reduce((sum, item) => sum + item.student_engaged_count, 0);
      }
      
      // Calculate rates per 100 students
      const entityRate = calculatePer100Students(entityCount, entityEnrollment);
      const stateRate = stateEnrollment ? 
        calculatePer100Students(stateCount, stateEnrollment) : null;
      
      return {
        year: year.toString(),
        formattedYear: formatFiscalYear(year) || year.toString(),
        entity: entityRate,
        state: stateRate
      };
    });
  }, [
    entityData, 
    stateData, 
    harassmentClassifications,
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
      return values;
    });
    
    return Math.max(0, Math.floor(Math.min(...allValues) * 0.95));
  }, [chartData]);
  
  return (
    <Box sx={{ mt: 3, width: '100%', position: 'relative' }}>
      <ChartHeader 
        title={chartTitle}
        filterType={filterType}
        handleFilterChange={handleFilterChange}
        isMobile={isMobile}
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
              
              {/* Entity and state lines */}
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
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState />
        )}
      </Box>
    </Box>
  );
};

export default HarassmentTrendChart; 