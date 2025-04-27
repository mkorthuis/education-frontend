import React, { useState, useEffect, useMemo } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  useMediaQuery, 
  useTheme, 
  Select, 
  MenuItem, 
  FormControl, 
  SelectChangeEvent, 
  alpha 
} from '@mui/material';
import { useAppSelector } from '@/store/hooks';
import { 
  selectEfaEntries,
  selectEfaEntryTypes
} from '@/store/slices/efaSlice';
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
  baseAidRow: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)'
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


const EfaDetailsTable: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isLoading, setIsLoading] = useState(false);
  
  // Get data from store using selectors
  const district = useAppSelector(selectCurrentDistrict);
  const districtParams = { district_id: district?.id };
  
  const efaData = useAppSelector(state => 
    selectEfaEntries(state, districtParams));
  const entryTypes = useAppSelector(selectEfaEntryTypes);
  
  // Get all available years from the data
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    efaData.forEach(item => years.add(item.year));
    return Array.from(years).sort((a, b) => b - a); // Sort descending
  }, [efaData]);
  
  // Get latest year from available years
  const latestYear = useMemo(() => {
    return availableYears[0];
  }, [availableYears]);
  
  // Local state for year selection - use latest year as default
  const [selectedYear, setSelectedYear] = useState<string | number>(latestYear);
  const [prevYear, setPrevYear] = useState<string | number>(selectedYear);
  
  // Effect to update selected year if the latest year changes
  useEffect(() => {
    if (latestYear !== selectedYear) {
      setSelectedYear(latestYear);
    }
  }, [latestYear]);
  
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
    return efaData.filter(item => item.year === Number(selectedYear));
  }, [selectedYear, efaData]);
  
  const handleYearChange = (event: SelectChangeEvent<string | number>) => {
    setSelectedYear(event.target.value);
  };
  
  // Calculate totals for each entry type
  const formattedData = useMemo(() => {
    const result: {[typeId: number]: {total: number, count: number}} = {};
    
    // Group by entry_type_id and sum values
    filteredData.forEach(entry => {
      if (!result[entry.entry_type_id]) {
        result[entry.entry_type_id] = { total: 0, count: 0 };
      }
      result[entry.entry_type_id].total += entry.value;
      result[entry.entry_type_id].count += 1;
    });
    
    return result;
  }, [filteredData]);
  
  // Check if there is data to display
  const hasData = filteredData.length > 0;
  
  // Calculate grand total
  const grandTotal = useMemo(() => {
    return Object.values(formattedData).reduce((sum, item) => sum + item.total, 0);
  }, [formattedData]);
  
  const formattedYear = useMemo(() => {
    return formatFiscalYear(selectedYear);
  }, [selectedYear]);
  
  // Get entry type values for formatting in dollar terms
  const entryTypeValuesMap = useMemo(() => {
    const result: {[typeId: number]: number} = {};
    
    // Get the base value for each entry type (if available)
    entryTypes.forEach(type => {
      if (type.value !== undefined) {
        result[type.id] = type.value;
      }
    });
    
    return result;
  }, [entryTypes]);

  // Find the Base Aid entry type ID
  const baseAidEntryTypeId = useMemo(() => {
    const baseAidType = entryTypes.find(type => type.name === "Base Aid");
    return baseAidType ? baseAidType.id : null;
  }, [entryTypes]);
  
  // Calculate base aid total (for the Total row's Students count)
  const baseAidTotal = useMemo(() => {
    return baseAidEntryTypeId && formattedData[baseAidEntryTypeId] 
      ? formattedData[baseAidEntryTypeId].total 
      : 0;
  }, [formattedData, baseAidEntryTypeId]);
  
  // Sort entry types to ensure Base Aid appears first
  const sortedEntryTypes = useMemo(() => {
    return Object.entries(formattedData).sort((a, b) => {
      const typeIdA = parseInt(a[0]);
      const typeIdB = parseInt(b[0]);
      
      // Sort by priority first
      const priorityA = getEntryTypePriority(typeIdA);
      const priorityB = getEntryTypePriority(typeIdB);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // If priorities are the same, sort alphabetically
      const nameA = getEntryTypeName(typeIdA);
      const nameB = getEntryTypeName(typeIdB);
      return nameA.localeCompare(nameB);
    });
  }, [formattedData, baseAidEntryTypeId]);
  
  if (!hasData) {
    return (
      <Box>
        <Typography sx={{ mb: 1 }}>
          {`There were no Education Freedom Account entries reported in the district in ${formattedYear}.`}
        </Typography>
      </Box>
    );
  }
  
  // Find entry type name by ID
  function getEntryTypeName(entryTypeId: number) {
    const entryType = entryTypes.find(type => type.id === entryTypeId);
    // Rename specific entry types
    if (entryType) {
      if (entryType.name === "Base Aid") {
        return "Base Student Aid";
      }
      if (entryType.name === "Federal Free & Reduced (F&R) Price Meal Eligible") {
        return isMobile ? "F&R Meal Aid" : "Free & Reduced Meal Aid";
      }
      if (entryType.name === "English Language Learn Aid") {
        return isMobile ? "English Aid" : "English Learner Aid";
      }
      if (entryType.name === "Special Education Aid") {
        return isMobile ? "Special Ed. Aid" : "Special Education Aid";
      }
      return entryType.name;
    }
    return `Type ${entryTypeId}`;
  }
  
  // Get the entry type priority for sorting (lower number = higher priority)
  function getEntryTypePriority(entryTypeId: number): number {
    const entryType = entryTypes.find(type => type.id === entryTypeId);
    if (!entryType) return 999; // Unknown types at the end
    
    // Define priorities for specific entry types
    if (entryType.name === "Base Aid") return 1;
    if (entryType.name === "Federal Free & Reduced (F&R) Price Meal Eligible") return 2;
    if (entryType.name === "Special Education Aid") return 3;
    if (entryType.name === "English Language Learn Aid") return 4;
    if (entryType.name.includes("3rd Grade")) return 5;
    
    // All other types get a lower priority (will be sorted alphabetically among themselves)
    return 100;
  }
  
  // Format value as currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: isMobile ? 0 : 2,
      maximumFractionDigits: isMobile ? 0 : 2
    }).format(value);
  };
  
  // Calculate dollar amount
  const calculateDollarAmount = (typeId: number, total: number) => {
    const typeValue = entryTypeValuesMap[typeId];
    if (typeValue === undefined) return 'N/A';
    return formatCurrency(total * typeValue);
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
          </Select>
        </FormControl>
        <Typography variant="body1" sx={{ ml: .5 }}>
          EFA Students and State Grants
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
                <TableCell></TableCell>
                <TableCell align="right">Students</TableCell>
                <TableCell align="right">State Grants</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedEntryTypes.map(([typeId, data]) => {
                const parsedTypeId = parseInt(typeId);
                const isBaseAid = parsedTypeId === baseAidEntryTypeId;
                
                return (
                  <TableRow 
                    key={typeId}
                    sx={{ 
                      '&:last-child td, &:last-child th': { border: 0 },
                      '& td, & th': {
                        borderBottom: '1px solid',
                        borderColor: 'grey.300',
                        ...(isBaseAid ? {} : {
                          fontStyle: 'italic',
                          color: 'text.secondary'  // Lighter grey color
                        })
                      }
                    }}
                  >
                    <TableCell 
                      component="th" 
                      scope="row"
                    >
                      {isBaseAid ? getEntryTypeName(parsedTypeId) : `+ ${getEntryTypeName(parsedTypeId)}`}
                    </TableCell>
                    <TableCell align="right">
                      {data.total.toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      {calculateDollarAmount(parsedTypeId, data.total)}
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {/* Total row */}
              <TableRow sx={tableStyles.totalRow}>
                <TableCell component="th" scope="row">Total</TableCell>
                <TableCell align="right">{baseAidTotal.toLocaleString()}</TableCell>
                <TableCell align="right">
                  {/* Calculate total dollar amount across all entries */}
                  {Object.entries(formattedData).reduce((sum, [typeId, data]) => {
                    const parsedTypeId = parseInt(typeId);
                    const typeValue = entryTypeValuesMap[parsedTypeId];
                    if (typeValue === undefined) return sum;
                    return sum + (data.total * typeValue);
                  }, 0).toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: isMobile ? 0 : 2,
                    maximumFractionDigits: isMobile ? 0 : 2
                  })}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default EfaDetailsTable; 