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
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

// Data type definitions
export interface TruancyData {
  year: number;
  count: number;
}

export interface EnrollmentData {
  year: number;
  total_enrollment: number;
}

export interface TruancyDetailsTableProps {
  entityName: string;
  entityTruancyData: TruancyData[];
  stateTruancyData: TruancyData[];
  entityEnrollmentData: EnrollmentData[];
  stateEnrollmentData: EnrollmentData[];
  calculatePer100Students: (count: number, enrollment: number, decimalPlaces?: number) => number;
  earliestYear: number;
  entityLabel?: string; // "District" or "School"
  className?: string;
}

const TruancyDetailsTable: React.FC<TruancyDetailsTableProps> = ({ 
  entityName,
  entityTruancyData,
  stateTruancyData,
  entityEnrollmentData,
  stateEnrollmentData,
  calculatePer100Students,
  earliestYear,
  entityLabel = 'Entity',
  className
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Calculate the stats we need to display
  const truancyStats = useMemo(() => {
    if (!entityTruancyData || !stateTruancyData || !entityEnrollmentData || !stateEnrollmentData) {
      return {
        currentYear: null,
        entityCount: 0,
        entityPercentage: 0,
        statePercentage: 0,
        entityPercentageChange: 0,
        statePercentageChange: 0,
        baselineEntityPercentage: 0,
        baselineStatePercentage: 0
      };
    }

    // Sort data by year in descending order to get the most recent data
    const sortedEntityData = [...entityTruancyData].sort((a, b) => b.year - a.year);
    const sortedStateData = [...stateTruancyData].sort((a, b) => b.year - a.year);
    
    // Get the latest year with data
    const currentYear = sortedEntityData.length > 0 ? sortedEntityData[0].year : null;
    
    // Create maps for easy lookup
    const entityDataByYear = new Map(entityTruancyData.map(item => [item.year, item.count]));
    const stateDataByYear = new Map(stateTruancyData.map(item => [item.year, item.count]));
    const entityEnrollmentByYear = new Map(entityEnrollmentData.map(item => [item.year, item.total_enrollment]));
    const stateEnrollmentByYear = new Map(stateEnrollmentData.map(item => [item.year, item.total_enrollment]));
    
    // Current year data
    const currentEntityCount = currentYear ? entityDataByYear.get(currentYear) || 0 : 0;
    const currentEntityEnrollment = currentYear ? entityEnrollmentByYear.get(currentYear) || 0 : 0;
    const currentStateCount = currentYear ? stateDataByYear.get(currentYear) || 0 : 0;
    const currentStateEnrollment = currentYear ? stateEnrollmentByYear.get(currentYear) || 0 : 0;
    
    // Calculate current percentages
    const currentEntityPercentage = calculatePer100Students(currentEntityCount, currentEntityEnrollment, 1);
    const currentStatePercentage = calculatePer100Students(currentStateCount, currentStateEnrollment, 1);
    
    // Use earliestYear for baseline
    const baselineYear = earliestYear;
    const baselineEntityCount = entityDataByYear.get(baselineYear) || 0;
    const baselineEntityEnrollment = entityEnrollmentByYear.get(baselineYear) || 0;
    const baselineStateCount = stateDataByYear.get(baselineYear) || 0;
    const baselineStateEnrollment = stateEnrollmentByYear.get(baselineYear) || 0;
    
    // Calculate baseline percentages
    const baselineEntityPercentage = calculatePer100Students(baselineEntityCount, baselineEntityEnrollment, 1);
    const baselineStatePercentage = calculatePer100Students(baselineStateCount, baselineStateEnrollment, 1);
    
    // Calculate percentage changes
    const entityVsStatePercentage = currentEntityPercentage > 0 
      ? ((currentEntityPercentage - currentStatePercentage) / currentStatePercentage) * 100 
      : 0;
    const historicalEntityVsStatePercentage = baselineEntityPercentage > 0 
      ? ((baselineEntityPercentage - baselineStatePercentage) / baselineStatePercentage) * 100 
      : 0;

    const entityPercentageChange = currentEntityPercentage - baselineEntityPercentage;
    const statePercentageChange = currentStatePercentage - baselineStatePercentage;
    
    return {
      currentYear,
      entityCount: currentEntityCount,
      entityPercentage: currentEntityPercentage,
      statePercentage: currentStatePercentage,
      entityPercentageChange: entityPercentageChange,
      statePercentageChange: statePercentageChange,
      baselineEntityPercentage: baselineEntityPercentage,
      baselineStatePercentage: baselineStatePercentage,
      entityVsStatePercentage: entityVsStatePercentage,
      historicalEntityVsStatePercentage: historicalEntityVsStatePercentage
    };
  }, [entityTruancyData, stateTruancyData, entityEnrollmentData, stateEnrollmentData, calculatePer100Students, earliestYear]);

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
      mt: 2,
      ...(className ? { className } : {})
    }}>
      <Box>
        {/* Centered title with entity name */}
        <Typography 
          variant="body1" 
          sx={{
            textAlign: "center",
            width: "100%",
            mb: 1,
            fontWeight: 'medium'
          }}
        >
          {entityName || entityLabel} Students Truancy 
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
                <TableCell align="right">{entityLabel}</TableCell>
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
                <TableCell align="right">{truancyStats.entityCount.toLocaleString()}</TableCell>
                <TableCell align="right">-</TableCell>
                {!isMobile && <TableCell align="right"></TableCell>}
              </TableRow>
              <TableRow>
                <TableCell>% {isMobile ? 'Truant' : 'Students Truant'} {formatFiscalYear(truancyStats.currentYear)}</TableCell>
                <TableCell align="right">{formatPercentage(truancyStats.entityPercentage)}</TableCell>
                <TableCell align="right">{formatPercentage(truancyStats.statePercentage)}</TableCell>
                {!isMobile && 
                  <TableCell align="right" sx={{ 
                    color: truancyStats.entityVsStatePercentage < 0 
                      ? 'success.main' 
                      : truancyStats.entityVsStatePercentage > 0 
                        ? 'error.main' 
                        : 'inherit'
                  }}>
                    {truancyStats.entityVsStatePercentage === 0 ? '-' : formatPercentage(truancyStats.entityVsStatePercentage)}
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
                <TableCell>% {isMobile ? 'Truant' : 'Students Truant'} {formatFiscalYear(earliestYear)}</TableCell>
                <TableCell align="right">{formatPercentage(truancyStats.baselineEntityPercentage)}</TableCell>
                <TableCell align="right">{formatPercentage(truancyStats.baselineStatePercentage)}</TableCell>
                {!isMobile && <TableCell align="right">{truancyStats.historicalEntityVsStatePercentage === 0 ? '-' : formatPercentage(truancyStats.historicalEntityVsStatePercentage)}</TableCell>}
              </TableRow>
              <TableRow>
                <TableCell>Change Since {formatFiscalYear(earliestYear)}</TableCell>
                <TableCell align="right">
                  {formatPercentageChangeWithArrow(truancyStats.entityPercentageChange)}
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