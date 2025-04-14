import React, { useMemo, useState, useEffect } from 'react';
import { Typography, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useMediaQuery, useTheme, Select, MenuItem, FormControl, SelectChangeEvent, alpha } from '@mui/material';
import { 
  selectDistrictBullyingImpactData,
  selectStateBullyingImpactData,
  selectBullyingImpactTypes
} from '@/store/slices/safetySlice';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentDistrict } from '@/store/slices/locationSlice';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import { FISCAL_YEAR } from '@/utils/environment';

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
  }),
  noDataRow: {
    '& td': {
      textAlign: 'center',
      padding: 2
    }
  }
};

interface BullyImpactTableProps {
  selectedYear: string | number;
  onYearChange: (year: string | number) => void;
}

const BullyImpactTable: React.FC<BullyImpactTableProps> = ({ 
  selectedYear, 
  onYearChange 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isLoading, setIsLoading] = useState(false);
  const [prevYear, setPrevYear] = useState<string | number>(selectedYear);
  
  // Get data from store using selectors
  const district = useAppSelector(selectCurrentDistrict);
  
  const districtBullyImpactData = useAppSelector(state => 
    selectDistrictBullyingImpactData(state, { district_id: district?.id }));
  const stateBullyImpactData = useAppSelector(state => 
    selectStateBullyingImpactData(state, {}));
  const bullyingImpactTypes = useAppSelector(selectBullyingImpactTypes);
  
  // Sort impact types by id in ascending order
  const sortedImpactTypes = useMemo(() => {
    return [...bullyingImpactTypes].sort((a, b) => a.id - b.id);
  }, [bullyingImpactTypes]);
  
  // Get all available years from the data
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    districtBullyImpactData.forEach(item => years.add(item.year));
    return Array.from(years).sort((a, b) => b - a); // Sort descending
  }, [districtBullyImpactData]);
  
  // Filter data based on selected year
  const filteredData = useMemo(() => {
    const districtFiltered = selectedYear === 'all' 
      ? districtBullyImpactData 
      : districtBullyImpactData.filter(item => item.year === Number(selectedYear));
      
    return { district: districtFiltered };
  }, [selectedYear, districtBullyImpactData]);
  
  // If no data is available, don't render the table
  if (bullyingImpactTypes.length === 0 || filteredData.district.length === 0) {
    return (
      <Box>
        <Typography sx={{ mb: 1 }}>There were no bullying impact incidents reported in the district in {formatFiscalYear(selectedYear)}.</Typography>
      </Box>
    );
  }
  
  // Calculate totals
  const totals = useMemo(() => {
    const countTotal = filteredData.district.reduce((total, item) => total + item.count, 0);
    
    return {
      count: countTotal
    };
  }, [filteredData]);
  
  // Helper function to get counts for an impact type
  const getImpactData = (impactTypeId: number) => {
    const items = filteredData.district.filter(item => 
      item.impact_type?.id === impactTypeId
    );
    
    const count = items.reduce((sum, item) => sum + item.count, 0);
    
    return {
      count
    };
  };
  
  // Get impact types with non-zero counts
  const impactTypesWithData = useMemo(() => {
    if (!isMobile) return sortedImpactTypes;
    
    return sortedImpactTypes.filter(type => {
      const data = getImpactData(type.id);
      return data.count > 0;
    });
  }, [sortedImpactTypes, filteredData.district, isMobile]);
  
  // Check if all impact types have zero counts
  const hasNoData = useMemo(() => {
    return totals.count === 0;
  }, [totals]);
  
  const handleYearChange = (event: SelectChangeEvent<string | number>) => {
    onYearChange(event.target.value);
  };
  
  const formattedYear = useMemo(() => {
    return typeof selectedYear === 'string' && selectedYear === 'all' 
      ? 'Selected Years' 
      : formatFiscalYear(selectedYear);
  }, [selectedYear]);
  
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
          Bullying Incidents That:
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
                <TableCell>Impact Type</TableCell>
                <TableCell align="right">Count</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isMobile && hasNoData ? (
                <TableRow sx={tableStyles.noDataRow}>
                  <TableCell colSpan={2}>No Bullying Incidents in {formattedYear}</TableCell>
                </TableRow>
              ) : (
                (isMobile ? impactTypesWithData : sortedImpactTypes).map((impactType, index, array) => {
                  const data = getImpactData(impactType.id);
                  
                  return (
                    <TableRow 
                      key={impactType.id}
                      sx={{ 
                        '&:last-child td, &:last-child th': { border: 0 },
                        ...(index < array.length - 1 && {
                          '& td, & th': {
                            borderBottom: '1px solid',
                            borderColor: 'grey.300',
                          }
                        })
                      }}
                    >
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'normal' }}>
                        {impactType.name}
                      </TableCell>
                      <TableCell align="right">{data.count}</TableCell>
                    </TableRow>
                  );
                })
              )}
              
              {/* Total row */}
              <TableRow sx={tableStyles.totalRow}>
                <TableCell component="th" scope="row">Total</TableCell>
                <TableCell align="right">{totals.count}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default BullyImpactTable; 