import { useState, useMemo, useEffect } from 'react';
import { Box, Typography, useTheme, useMediaQuery, FormControl, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import { formatCompactNumber } from '@/utils/formatting';
import { Measurement } from '@/store/slices/measurementSlice';
import { 
  ENROLLMENT_MEASUREMENT_TYPES, 
  ENROLLMENT_MEASUREMENT_TYPE_NAMES, 
  ENROLLMENT_MEASUREMENT_TYPE_ORDER,
  processEnrollmentMeasurements
} from '@/features/district/utils/enrollmentDataProcessing';

interface ChartDataPoint {
  year: string;
  formattedYear: string;
  value: number;
  totalEnrollment?: number;
}

interface TooltipEntry {
  dataKey: string;
  value: number;
  name: string;
  color: string;
}

interface SchoolEnrollmentChartProps {
  measurements?: Measurement[];
}

type EnrollmentMeasurementType = typeof ENROLLMENT_MEASUREMENT_TYPES[keyof typeof ENROLLMENT_MEASUREMENT_TYPES];

const MOBILE_NAMES = {
  [ENROLLMENT_MEASUREMENT_TYPES.TOTAL_ENROLLMENT]: 'Total Enrollment',
  [ENROLLMENT_MEASUREMENT_TYPES.ECONOMICALLY_DISADVANTAGED]: 'Low Income',
  [ENROLLMENT_MEASUREMENT_TYPES.ENGLISH_LANGUAGE_LEARNER]: 'ELL',
  [ENROLLMENT_MEASUREMENT_TYPES.STUDENTS_WITH_DISABILITY]: 'Student w/Disability'
} as const;

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
 * Component that displays a chart of enrollment data for schools in a district
 */
const SchoolEnrollmentChart: React.FC<SchoolEnrollmentChartProps> = ({ 
  measurements = []
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Process measurements to get actual values
  const processedMeasurements = useMemo(() => {
    return processEnrollmentMeasurements(measurements);
  }, [measurements]);

  // Get available measurement types (excluding those with all zero values)
  const availableMeasurementTypes = useMemo(() => {
    return ENROLLMENT_MEASUREMENT_TYPE_ORDER.filter(typeId => {
      const typeMeasurements = processedMeasurements.filter(m => Number(m.measurement_type.id) === typeId);
      return typeMeasurements.length > 0 && typeMeasurements.some(m => m.actualValue > 0);
    });
  }, [processedMeasurements]);

  // State for selected measurement type
  const [selectedMeasurementType, setSelectedMeasurementType] = useState<EnrollmentMeasurementType>(
    availableMeasurementTypes[0] || ENROLLMENT_MEASUREMENT_TYPES.TOTAL_ENROLLMENT
  );

  // Update selected type if current selection is not available
  useEffect(() => {
    if (!availableMeasurementTypes.includes(selectedMeasurementType)) {
      setSelectedMeasurementType(availableMeasurementTypes[0] || ENROLLMENT_MEASUREMENT_TYPES.TOTAL_ENROLLMENT);
    }
  }, [availableMeasurementTypes, selectedMeasurementType]);
  
  // Handle measurement type change
  const handleMeasurementTypeChange = (event: SelectChangeEvent<EnrollmentMeasurementType>) => {
    setSelectedMeasurementType(Number(event.target.value) as EnrollmentMeasurementType);
  };
  
  // Process data for the chart
  const chartData = useMemo(() => {
    if (!measurements.length) return [];
    
    // Get available years
    const years = [...new Set(processedMeasurements.map(m => m.year))].sort();
    
    // Create data points for each year
    const data = years.map(year => {
      // Get measurement for selected type
      const measurement = processedMeasurements.find(
        m => m.year === year && Number(m.measurement_type.id) === selectedMeasurementType
      );
      
      // Get total enrollment for reference line
      const totalEnrollment = processedMeasurements.find(
        m => m.year === year && Number(m.measurement_type.id) === ENROLLMENT_MEASUREMENT_TYPES.TOTAL_ENROLLMENT
      )?.actualValue;
      
      return {
        year: year.toString(),
        formattedYear: formatFiscalYear(parseInt(year)),
        value: measurement?.actualValue || 0,
        totalEnrollment: selectedMeasurementType !== ENROLLMENT_MEASUREMENT_TYPES.TOTAL_ENROLLMENT ? totalEnrollment : undefined
      };
    }).sort((a, b) => parseInt(a.year) - parseInt(b.year));
    
    return data;
  }, [processedMeasurements, selectedMeasurementType]);
  
  // Calculate Y-axis domain
  const allValues = chartData.flatMap(d => [d.value, d.totalEnrollment || 0]).filter(v => v > 0);
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
              {selectedMeasurementType === ENROLLMENT_MEASUREMENT_TYPES.TOTAL_ENROLLMENT
                ? "District School Enrollment"
                : isMobile 
                  ? MOBILE_NAMES[selectedMeasurementType as keyof typeof MOBILE_NAMES]
                  : ENROLLMENT_MEASUREMENT_TYPE_NAMES[selectedMeasurementType as keyof typeof ENROLLMENT_MEASUREMENT_TYPE_NAMES]}
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
          <FormControl
            size="small"
            sx={{
              minWidth: 150,
            }}
          >
            <Select
              value={selectedMeasurementType}
              onChange={handleMeasurementTypeChange}
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
              {availableMeasurementTypes.map(typeId => (
                <MenuItem key={typeId} value={typeId}>
                  {isMobile 
                    ? MOBILE_NAMES[typeId as keyof typeof MOBILE_NAMES]
                    : ENROLLMENT_MEASUREMENT_TYPE_NAMES[typeId as keyof typeof ENROLLMENT_MEASUREMENT_TYPE_NAMES]}
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
                dataKey="value"
                name={isMobile 
                  ? MOBILE_NAMES[selectedMeasurementType as keyof typeof MOBILE_NAMES]
                  : ENROLLMENT_MEASUREMENT_TYPE_NAMES[selectedMeasurementType as keyof typeof ENROLLMENT_MEASUREMENT_TYPE_NAMES]}
                stroke={theme.palette.primary.main}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              {selectedMeasurementType !== ENROLLMENT_MEASUREMENT_TYPES.TOTAL_ENROLLMENT && (
                <Line
                  type="monotone"
                  dataKey="totalEnrollment"
                  name="Total Enrollment"
                  stroke={theme.palette.grey[400]}
                  strokeWidth={1}
                  dot={false}
                  activeDot={false}
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
              No enrollment data available
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default SchoolEnrollmentChart; 