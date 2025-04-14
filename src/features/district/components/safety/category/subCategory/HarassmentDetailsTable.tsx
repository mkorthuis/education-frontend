import React, { useState, useEffect, useMemo } from 'react';
import { Typography, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useMediaQuery, useTheme, Select, MenuItem, FormControl, SelectChangeEvent, alpha } from '@mui/material';
import { 
  selectStateHarassmentData, 
  selectHarassmentClassification,
  selectDistrictHarassmentData
} from '@/store/slices/safetySlice';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentDistrict } from '@/store/slices/locationSlice';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import { FISCAL_YEAR } from '@/utils/environment';
import { EARLIEST_YEAR } from '@/features/district/utils/safetyDataProcessing';

// Component styles
const tableStyles = {
  container: {
    flex: 1,
    backgroundColor: 'grey.100',
    border: 1,
    borderColor: 'grey.300',
    borderRadius: 1,
    overflow: 'hidden'
  },
  head: {
    backgroundColor: 'grey.200',
    '& th': {
      borderBottom: '2px solid',
      borderColor: 'grey.400'
    }
  },
  totalRow: {
    backgroundColor: 'grey.200',
    '& td, & th': {
      borderTop: '2px solid',
      borderColor: 'grey.400',
      fontWeight: 'bold'
    }
  },
  yearSelect: {
    minWidth: 40,
    '& .MuiSelect-select': {
      textAlign: 'right',
    }
  },
  selectInput: (theme: any) => ({
    color: theme.palette.primary.main,
    marginTop: '5px',
    fontWeight: 500,
    height: '20px',
    '&:hover': {
      color: theme.palette.primary.dark
    },
    '& .MuiSvgIcon-root': {
      color: theme.palette.primary.main,
      '&:hover': {
        color: theme.palette.primary.dark
      }
    }
  })
};

const HarassmentDetailsTable: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isLoading, setIsLoading] = useState(false);
  
  // Get default fiscal year from environment
  const defaultFiscalYear = parseInt(FISCAL_YEAR);
  
  // State for selected year
  const [selectedYear, setSelectedYear] = useState<string | number>(defaultFiscalYear);
  const [prevYear, setPrevYear] = useState<string | number>(selectedYear);
  
  // Get data from store using selectors
  const district = useAppSelector(selectCurrentDistrict);
  
  const districtHarassmentData = useAppSelector(state => 
    selectDistrictHarassmentData(state, { district_id: district?.id }));
  const stateHarassmentData = useAppSelector(state => 
    selectStateHarassmentData(state, {}));
  const harassmentClassifications = useAppSelector(selectHarassmentClassification);
  
  // Get all available years from the data
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    districtHarassmentData.forEach(item => years.add(item.year));
    return Array.from(years).sort((a, b) => b - a); // Sort descending
  }, [districtHarassmentData]);
  
  // Reset selected year when fiscal year changes
  useEffect(() => {
    setSelectedYear(defaultFiscalYear);
  }, [defaultFiscalYear]);
  
  // Effect to detect year changes (excluding initial load)
  useEffect(() => {
    if (prevYear !== selectedYear) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 800); // Show loading state for 800ms
      
      return () => clearTimeout(timer);
    }
    setPrevYear(selectedYear);
  }, [selectedYear, prevYear]);
  
  // Filter data based on selected year
  const filteredData = useMemo(() => {
    const districtFiltered = selectedYear === 'all' 
      ? districtHarassmentData 
      : districtHarassmentData.filter(item => item.year === Number(selectedYear));
      
    return { district: districtFiltered };
  }, [selectedYear, districtHarassmentData]);
  
  // If no data is available, don't render the table
  if (harassmentClassifications.length === 0 || filteredData.district.length === 0) {
    return (
      <Box>
        <Typography sx={{ mb: 1 }}>There were no harassment incidents reported in the district in {formatFiscalYear(selectedYear)}.</Typography>
      </Box>
    );
  }
  
  // Calculate totals
  const totals = useMemo(() => {
    const incidentTotal = filteredData.district.reduce((total, item) => total + item.incident_count, 0);
    const studentImpactTotal = filteredData.district.reduce((total, item) => total + item.student_impact_count, 0);
    const studentEngagedTotal = filteredData.district.reduce((total, item) => total + item.student_engaged_count, 0);
    
    return {
      incidentCount: incidentTotal,
      studentImpactCount: studentImpactTotal,
      studentEngagedCount: studentEngagedTotal
    };
  }, [filteredData]);
  
  // Helper function to get counts for a classification
  const getClassificationData = (classificationId: number) => {
    const items = filteredData.district.filter(item => 
      item.classification?.id === classificationId
    );
    
    const incidentCount = items.reduce((sum, item) => sum + item.incident_count, 0);
    const studentImpactCount = items.reduce((sum, item) => sum + item.student_impact_count, 0);
    const studentEngagedCount = items.reduce((sum, item) => sum + item.student_engaged_count, 0);
    
    return {
      incidentCount,
      studentImpactCount,
      studentEngagedCount
    };
  };
  
  const handleYearChange = (event: SelectChangeEvent<string | number>) => {
    setSelectedYear(event.target.value);
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'left', mb: 1 }}>
        <FormControl size="small" sx={tableStyles.yearSelect}>
          <Select
            value={selectedYear}
            onChange={handleYearChange}
            displayEmpty
            variant="standard"
            sx={tableStyles.selectInput(theme)}
            MenuProps={{
              PaperProps: {
                sx: { maxHeight: 300 }
              }
            }}
          >
            {availableYears.map(year => (
              <MenuItem key={year} value={year}>
                {formatFiscalYear(year)}
              </MenuItem>
            ))}
            <MenuItem value="all">All Years</MenuItem>
          </Select>
        </FormControl>
        <Typography variant="body1" sx={{ ml: .5 }}>
          Harassment Incidents:
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2, position: 'relative' }}>
        <TableContainer 
          component={Paper} 
          elevation={0} 
          sx={{
            ...tableStyles.container,
            position: 'relative',
            opacity: isLoading ? 0.6 : 1,
            transition: 'opacity 0.3s ease'
          }}
        >
          {/* Overlay for loading state */}
          {isLoading && (
            <Box 
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: alpha(theme.palette.background.paper, 0.2),
                zIndex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            />
          )}
          <Table size="small">
            <TableHead sx={tableStyles.head}>
              <TableRow>
                <TableCell>Classification</TableCell>
                <TableCell align="right">Incidents</TableCell>
                {!isMobile && (
                  <>
                    <TableCell align="right">Students Impacted</TableCell>
                    <TableCell align="right">Students Disciplined</TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {harassmentClassifications.map((classification, index) => {
                const data = getClassificationData(classification.id);
                
                return (
                  <TableRow 
                    key={classification.id}
                    sx={{ 
                      '&:last-child td, &:last-child th': { border: 0 },
                      ...(index < harassmentClassifications.length - 1 && {
                        '& td, & th': {
                          borderBottom: '1px solid',
                          borderColor: 'grey.300',
                        }
                      })
                    }}
                  >
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'normal' }}>
                      {classification.name}
                    </TableCell>
                    <TableCell align="right">{data.incidentCount}</TableCell>
                    {!isMobile && (
                      <>
                        <TableCell align="right">{data.studentImpactCount}</TableCell>
                        <TableCell align="right">{data.studentEngagedCount}</TableCell>
                      </>
                    )}
                  </TableRow>
                );
              })}
              
              {/* Total row */}
              <TableRow sx={tableStyles.totalRow}>
                <TableCell component="th" scope="row">Total</TableCell>
                <TableCell align="right">{totals.incidentCount}</TableCell>
                {!isMobile && (
                  <>
                    <TableCell align="right">{totals.studentImpactCount}</TableCell>
                    <TableCell align="right">{totals.studentEngagedCount}</TableCell>
                  </>
                )}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default HarassmentDetailsTable; 