import React, { useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useAppSelector } from '@/store/hooks';
import { 
  selectDistrictTruancyData, 
  selectStateTruancyData, 
  selectDistrictEnrollmentData, 
  selectStateEnrollmentData 
} from '@/store/slices/safetySlice';
import { selectCurrentDistrict } from '@/store/slices/locationSlice';
import { calculatePer100Students, EARLIEST_YEAR } from '@/features/district/utils/safetyDataProcessing';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';

interface TruancyDetailsChartProps {
  className?: string;
}

const TruancyDetailsChart: React.FC<TruancyDetailsChartProps> = ({ className }) => {
  const theme = useTheme();
  
  // Get the current district
  const district = useAppSelector(selectCurrentDistrict);
  
  // Get the district and state truancy data
  const districtTruancyData = useAppSelector(state => selectDistrictTruancyData(state, {district_id: district?.id}));
  const stateTruancyData = useAppSelector(state => selectStateTruancyData(state, {}));
  
  // Get enrollment data for percentage calculations
  const districtEnrollmentData = useAppSelector(state => selectDistrictEnrollmentData(state, {district_id: district?.id}));
  const stateEnrollmentData = useAppSelector(state => selectStateEnrollmentData(state, {}));

  // Calculate the stats we need to display
  const truancyStats = useMemo(() => {
    if (!districtTruancyData || !stateTruancyData || !districtEnrollmentData || !stateEnrollmentData) {
      return {
        currentYear: null,
        districtCount: 0,
        districtPercentage: 0,
        statePercentage: 0,
        districtPercentageChange: 0,
        statePercentageChange: 0
      };
    }

    // Sort data by year in descending order to get the most recent data
    const sortedDistrictData = [...districtTruancyData].sort((a, b) => b.year - a.year);
    const sortedStateData = [...stateTruancyData].sort((a, b) => b.year - a.year);
    
    // Get the latest year with data
    const currentYear = sortedDistrictData.length > 0 ? sortedDistrictData[0].year : null;
    
    // Create maps for easy lookup
    const districtDataByYear = new Map(districtTruancyData.map(item => [item.year, item.count]));
    const stateDataByYear = new Map(stateTruancyData.map(item => [item.year, item.count]));
    const districtEnrollmentByYear = new Map(districtEnrollmentData.map(item => [item.year, item.total_enrollment]));
    const stateEnrollmentByYear = new Map(stateEnrollmentData.map(item => [item.year, item.total_enrollment]));
    
    // Current year data
    const currentDistrictCount = currentYear ? districtDataByYear.get(currentYear) || 0 : 0;
    const currentDistrictEnrollment = currentYear ? districtEnrollmentByYear.get(currentYear) || 0 : 0;
    const currentStateCount = currentYear ? stateDataByYear.get(currentYear) || 0 : 0;
    const currentStateEnrollment = currentYear ? stateEnrollmentByYear.get(currentYear) || 0 : 0;
    
    // Calculate current percentages
    const currentDistrictPercentage = calculatePer100Students(currentDistrictCount, currentDistrictEnrollment, 1);
    const currentStatePercentage = calculatePer100Students(currentStateCount, currentStateEnrollment, 1);
    
    // Use EARLIEST_YEAR constant for baseline year instead of hardcoded 2016
    const baselineYear = EARLIEST_YEAR;
    const baselineDistrictCount = districtDataByYear.get(baselineYear) || 0;
    const baselineDistrictEnrollment = districtEnrollmentByYear.get(baselineYear) || 0;
    const baselineStateCount = stateDataByYear.get(baselineYear) || 0;
    const baselineStateEnrollment = stateEnrollmentByYear.get(baselineYear) || 0;
    
    // Calculate baseline percentages
    const baselineDistrictPercentage = calculatePer100Students(baselineDistrictCount, baselineDistrictEnrollment, 1);
    const baselineStatePercentage = calculatePer100Students(baselineStateCount, baselineStateEnrollment, 1);
    
    // Calculate percentage changes
    const districtPercentageChange = baselineDistrictPercentage > 0 
      ? ((currentDistrictPercentage - baselineDistrictPercentage) / baselineDistrictPercentage) * 100 
      : 0;
    
    const statePercentageChange = baselineStatePercentage > 0 
      ? ((currentStatePercentage - baselineStatePercentage) / baselineStatePercentage) * 100 
      : 0;
    
    return {
      currentYear,
      districtCount: currentDistrictCount,
      districtPercentage: currentDistrictPercentage,
      statePercentage: currentStatePercentage,
      districtPercentageChange: districtPercentageChange,
      statePercentageChange: statePercentageChange
    };
  }, [districtTruancyData, stateTruancyData, districtEnrollmentData, stateEnrollmentData]);

  // Format for displaying percentages
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Format for displaying percentage changes
  const formatPercentageChange = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  // If no data, display a message
  if (!truancyStats.currentYear) {
    return (
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No truancy data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'left',
      width: '100%',
      mt: 2
    }}>
      <Box>
        
        {/* Centered title with district name and fiscal year */}
        <Typography 
          variant="body1" 
          sx={{
            textAlign: "center",
            width: "100%",
            mb: 1,
            fontWeight: 'medium'
          }}
        >
          {district?.name || 'District'} Truancy {formatFiscalYear(truancyStats.currentYear)}
        </Typography>
        
        {/* Table with truancy details */}
        <TableContainer 
          component={Paper} 
          elevation={0} 
          sx={{ 
            backgroundColor: 'grey.100',
            border: 1,
            borderColor: 'grey.300',
            borderRadius: 1,
            overflow: 'hidden'
          }}
        >
          <Table size="small">
            <TableHead sx={{ 
              backgroundColor: 'grey.200',
              '& th': {
                borderBottom: '2px solid',
                borderColor: 'grey.400',
              }
            }}>
              <TableRow>
                <TableCell>Metric</TableCell>
                <TableCell align="right">District</TableCell>
                <TableCell align="right">State</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell># Truant</TableCell>
                <TableCell align="right">{truancyStats.districtCount.toLocaleString()}</TableCell>
                <TableCell align="right">-</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>% Truant</TableCell>
                <TableCell align="right">{formatPercentage(truancyStats.districtPercentage)}</TableCell>
                <TableCell align="right">{formatPercentage(truancyStats.statePercentage)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>% Change since {EARLIEST_YEAR}</TableCell>
                <TableCell align="right">{formatPercentageChange(truancyStats.districtPercentageChange)}</TableCell>
                <TableCell align="right">{formatPercentageChange(truancyStats.statePercentageChange)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default TruancyDetailsChart; 