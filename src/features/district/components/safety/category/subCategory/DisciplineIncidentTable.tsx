import React, { useState, useEffect, useMemo } from 'react';
import { Typography, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useMediaQuery, useTheme, Select, MenuItem, FormControl, SelectChangeEvent, alpha } from '@mui/material';
import { 
  selectDistrictDisciplineIncidentData, 
  selectStateDisciplineIncidentData, 
  selectDisciplineIncidentTypes,
  selectDistrictEnrollmentData,
  selectStateEnrollmentData,
  DistrictEnrollmentData,
  StateEnrollmentData
} from '@/store/slices/safetySlice';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentDistrict } from '@/store/slices/locationSlice';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import { calculatePer100Students } from '@/features/district/utils/safetyDataProcessing';

// Types
interface DisciplineIncidentTableProps {
  fiscalYear: number;
}

interface GroupedType {
  displayName: string;
  typeIds: number[];
  minTypeId: number; // Used for sorting
}

// Constants for incident type mapping
const INCIDENT_TYPE_MAPPING: Record<string, string> = {
  "drug": "Others Related to Drug, Alcohol, Violence, Weapons",
  "alcohol": "Others Related to Drug, Alcohol, Violence, Weapons",
  "weapon": "Others Related to Drug, Alcohol, Violence, Weapons",
  "harass": "Violent Incidents, incl. Harassment + Bullying (No Injury)",
  "bully": "Violent Incidents, incl. Harassment + Bullying (No Injury)",
  "medical": "Violent Incidents Requiring Medical Attention",
  "injury": "Violent Incidents Requiring Medical Attention"
};

// Helper functions
const getDisplayName = (originalName: string): string => {
  for (const [key, value] of Object.entries(INCIDENT_TYPE_MAPPING)) {
    if (originalName.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  return originalName;
};

const getEnrollment = <T extends DistrictEnrollmentData | StateEnrollmentData>(
  data: T[], 
  year: string | number
): number => {
  if (year === 'all') {
    const sortedYears = data.map(item => item.year).sort((a, b) => b - a);
    const mostRecentYear = sortedYears[0];
    return data.find(item => item.year === mostRecentYear)?.total_enrollment || 0;
  }
  return data.find(item => item.year === Number(year))?.total_enrollment || 0;
};

const formatPer100 = (count: number, enrollment: number): string => {
  return calculatePer100Students(count, enrollment).toFixed(2);
};

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
      borderColor: 'grey.400',
      whiteSpace: 'nowrap'
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

const DisciplineIncidentTable: React.FC<DisciplineIncidentTableProps> = ({ fiscalYear: defaultFiscalYear }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isLoading, setIsLoading] = useState(false);
  
  // State for selected year
  const [selectedYear, setSelectedYear] = useState<string | number>(defaultFiscalYear);
  const [prevYear, setPrevYear] = useState<string | number>(selectedYear);
  
  // Get data from store using selectors
  const district = useAppSelector(selectCurrentDistrict);
  
  const districtData = useAppSelector(state => 
    selectDistrictDisciplineIncidentData(state, { district_id: district?.id }));
  const stateData = useAppSelector(state => 
    selectStateDisciplineIncidentData(state, {}));
  const disciplineIncidentTypes = useAppSelector(selectDisciplineIncidentTypes);
  
  // Get enrollment data for calculating per 100 student rates
  const districtEnrollmentData = useAppSelector(state => 
    selectDistrictEnrollmentData(state, { district_id: district?.id }));
  const stateEnrollmentData = useAppSelector(state => 
    selectStateEnrollmentData(state, {}));
  
  // Get all available years from the data
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    districtData.forEach(item => years.add(item.year));
    return Array.from(years).sort((a, b) => b - a); // Sort descending
  }, [districtData]);
  
  // Reset selected year when fiscal year prop changes
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
      ? districtData 
      : districtData.filter(item => item.year === Number(selectedYear));
      
    const stateFiltered = selectedYear === 'all'
      ? stateData
      : stateData.filter(item => item.year === Number(selectedYear));
      
    return { district: districtFiltered, state: stateFiltered };
  }, [selectedYear, districtData, stateData]);
  
  // Calculate enrollments
  const enrollments = useMemo(() => {
    const district = getEnrollment(districtEnrollmentData, selectedYear);
    const state = getEnrollment(stateEnrollmentData, selectedYear);
    return { district, state };
  }, [districtEnrollmentData, stateEnrollmentData, selectedYear]);
  
  // If no data is available, don't render the table
  if (disciplineIncidentTypes.length === 0 || filteredData.district.length === 0) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography>No discipline incident data available for the selected year.</Typography>
      </Box>
    );
  }
  
  // Group and sort incident types
  const sortedGroupedTypes = useMemo(() => {
    // Group incident types by display name to combine similar categories
    const groupedTypesMap = disciplineIncidentTypes.reduce<Record<string, GroupedType>>((acc, type) => {
      const displayName = getDisplayName(type.name);
      if (!acc[displayName]) {
        acc[displayName] = {
          displayName,
          typeIds: [type.id],
          minTypeId: type.id
        };
      } else {
        acc[displayName].typeIds.push(type.id);
        acc[displayName].minTypeId = Math.min(acc[displayName].minTypeId, type.id);
      }
      return acc;
    }, {});
    
    // Convert to array and sort by minTypeId
    return Object.values(groupedTypesMap).sort((a, b) => a.minTypeId - b.minTypeId);
  }, [disciplineIncidentTypes]);
  
  // Calculate totals
  const totals = useMemo(() => {
    const districtTotal = filteredData.district.reduce((total, item) => total + item.count, 0);
    const stateTotal = filteredData.state.reduce((total, item) => total + item.count, 0);
    
    return {
      district: districtTotal,
      state: stateTotal,
      districtPer100: formatPer100(districtTotal, enrollments.district),
      statePer100: formatPer100(stateTotal, enrollments.state)
    };
  }, [filteredData, enrollments]);
  
  // Helper functions to get counts for incident groups
  const getGroupCounts = (group: GroupedType) => {
    const districtCount = group.typeIds.reduce((total, typeId) => {
      return total + filteredData.district
        .filter(item => item.incident_type.id === typeId)
        .reduce((sum, item) => sum + item.count, 0);
    }, 0);
    
    const stateCount = group.typeIds.reduce((total, typeId) => {
      return total + filteredData.state
        .filter(item => item.incident_type.id === typeId)
        .reduce((sum, item) => sum + item.count, 0);
    }, 0);
    
    return {
      district: districtCount,
      state: stateCount,
      districtPer100: formatPer100(districtCount, enrollments.district),
      statePer100: formatPer100(stateCount, enrollments.state)
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
          Incidents Resulting in Suspension:
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
                <TableCell>Incident Type</TableCell>
                <TableCell align="right">Number</TableCell>
                {!isMobile && (
                  <>
                    <TableCell align="right">District Per 100</TableCell>
                    <TableCell align="right">State Per 100</TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedGroupedTypes.map((group, index) => {
                const counts = getGroupCounts(group);
                
                return (
                  <TableRow 
                    key={group.displayName}
                    sx={{ 
                      '&:last-child td, &:last-child th': { border: 0 },
                      ...(index < sortedGroupedTypes.length - 1 && {
                        '& td, & th': {
                          borderBottom: '1px solid',
                          borderColor: 'grey.300',
                        }
                      })
                    }}
                  >
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'normal' }}>
                      {group.displayName}
                    </TableCell>
                    <TableCell align="right">{counts.district}</TableCell>
                    {!isMobile && (
                      <>
                        <TableCell align="right">{counts.districtPer100}</TableCell>
                        <TableCell align="right">{counts.statePer100}</TableCell>
                      </>
                    )}
                  </TableRow>
                );
              })}
              
              {/* Total row */}
              <TableRow sx={tableStyles.totalRow}>
                <TableCell component="th" scope="row">Total</TableCell>
                <TableCell align="right">{totals.district}</TableCell>
                {!isMobile && (
                  <>
                    <TableCell align="right">{totals.districtPer100}</TableCell>
                    <TableCell align="right">{totals.statePer100}</TableCell>
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

export default DisciplineIncidentTable; 