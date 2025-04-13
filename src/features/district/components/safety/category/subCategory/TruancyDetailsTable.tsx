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
  TableRow,
  useMediaQuery
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
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

interface TruancyDetailsTableProps {
  className?: string;
}

const TruancyDetailsTable: React.FC<TruancyDetailsTableProps> = ({ className }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
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
        statePercentageChange: 0,
        baselineDistrictPercentage: 0,
        baselineStatePercentage: 0
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
    const districtVsStatePercentage = currentDistrictPercentage > 0 ? ((currentDistrictPercentage - currentStatePercentage) / currentStatePercentage) * 100 : 0;
    const historicalDistrictVsStatePercentage = baselineDistrictPercentage > 0 ? ((baselineDistrictPercentage - baselineStatePercentage) / baselineStatePercentage) * 100 : 0;

    const districtPercentageChange =currentDistrictPercentage - baselineDistrictPercentage;
    
    const statePercentageChange = currentStatePercentage - baselineStatePercentage;
    
    return {
      currentYear,
      districtCount: currentDistrictCount,
      districtPercentage: currentDistrictPercentage,
      statePercentage: currentStatePercentage,
      districtPercentageChange: districtPercentageChange,
      statePercentageChange: statePercentageChange,
      baselineDistrictPercentage: baselineDistrictPercentage,
      baselineStatePercentage: baselineStatePercentage,
      districtVsStatePercentage: districtVsStatePercentage,
      historicalDistrictVsStatePercentage: historicalDistrictVsStatePercentage
    };
  }, [districtTruancyData, stateTruancyData, districtEnrollmentData, stateEnrollmentData]);

  // Format for displaying percentages
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Format for displaying percentage changes with arrow indicators
  const formatPercentageChangeWithArrow = (value: number) => {
    const arrow = value > 0 
      ? <ArrowUpwardIcon fontSize="small" /> 
      : value < 0 
        ? <ArrowDownwardIcon fontSize="small" /> 
        : null;
    
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'flex-end',
        // For truancy, a negative change (decrease) is actually good
        color: value < 0 ? 'success.main' : value > 0 ? 'error.main' : 'text.primary'
      }}>
        {arrow}
        <Typography component="span" variant="body2">
          {`${Math.abs(value).toFixed(1)}%`}
        </Typography>
      </Box>
    );
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
          {district?.name || 'District'} Students Truancy 
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
                <TableCell></TableCell>
                <TableCell align="right">District</TableCell>
                <TableCell align="right">State</TableCell>
                {!isMobile && <TableCell align="right">Difference</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow sx={{
                '& td': {
                  borderBottom: '3px solid',
                  borderColor: 'grey.300'
                }
              }}>
                <TableCell>{isMobile ? '# Truant ' : '# Students Truant '}{formatFiscalYear(truancyStats.currentYear)}</TableCell>
                <TableCell align="right">{truancyStats.districtCount.toLocaleString()}</TableCell>
                <TableCell align="right">-</TableCell>
                {!isMobile && <TableCell align="right"></TableCell>}
              </TableRow>
              <TableRow>
                <TableCell>% {isMobile ? 'Truant' : 'Students Truant'} {formatFiscalYear(truancyStats.currentYear)}</TableCell>
                <TableCell align="right">{formatPercentage(truancyStats.districtPercentage)}</TableCell>
                <TableCell align="right">{formatPercentage(truancyStats.statePercentage)}</TableCell>
                {!isMobile && 
                  <TableCell align="right" sx={{ 
                    color: truancyStats.districtVsStatePercentage < 0 
                      ? 'success.main' 
                      : truancyStats.districtVsStatePercentage > 0 
                        ? 'error.main' 
                        : 'inherit'
                  }}>
                    {truancyStats.districtVsStatePercentage === 0 ? '-' : formatPercentage(truancyStats.districtVsStatePercentage)}
                  </TableCell>
                }
              </TableRow>
              <TableRow sx={{ 
                '& td': { 
                  color: 'text.secondary',
                  fontStyle: 'italic',
                  borderBottom: '3px solid',
                  borderColor: 'grey.300'
                } 
              }}>
                <TableCell>% {isMobile ? 'Truant' : 'Students Truant'} {formatFiscalYear(EARLIEST_YEAR)}</TableCell>
                <TableCell align="right">{formatPercentage(truancyStats.baselineDistrictPercentage)}</TableCell>
                <TableCell align="right">{formatPercentage(truancyStats.baselineStatePercentage)}</TableCell>
                {!isMobile && <TableCell align="right">{truancyStats.historicalDistrictVsStatePercentage === 0 ? '-' : formatPercentage(truancyStats.historicalDistrictVsStatePercentage)}</TableCell>}
              </TableRow>
              <TableRow>
                <TableCell>Change Since {EARLIEST_YEAR}</TableCell>
                <TableCell align="right">
                  {formatPercentageChangeWithArrow(truancyStats.districtPercentageChange)}
                </TableCell>
                <TableCell align="right">
                  {formatPercentageChangeWithArrow(truancyStats.statePercentageChange)}
                </TableCell>
                {!isMobile && <TableCell align="right"></TableCell>}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default TruancyDetailsTable; 