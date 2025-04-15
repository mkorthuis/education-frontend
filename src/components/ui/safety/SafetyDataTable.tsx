import React, { useState, useEffect, useMemo, ReactNode } from 'react';
import { Typography, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useMediaQuery, useTheme, Select, MenuItem, FormControl, SelectChangeEvent, alpha } from '@mui/material';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import { FISCAL_YEAR } from '@/utils/environment';

// Define common data types
export interface ItemType {
  id: number;
  name: string;
  [key: string]: any; // Allow indexing with string
}

export interface DataItem {
  year: number;
  [key: string]: any;
}

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

export interface ColumnDefinition {
  id: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  mobileVisible?: boolean;
  getValue: (item: any) => number | string | ReactNode;
}

export interface TotalDefinition {
  label: string;
  value: number | string;
  align?: 'left' | 'right' | 'center';
}

// Entity type options
export type EntityType = 'school' | 'district' | 'state';

export interface SafetyDataTableProps<T extends DataItem, U extends ItemType> {
  // Data
  data: T[];
  itemTypes: U[];
  
  // Configuration
  title: string;
  columns: ColumnDefinition[];
  totals: TotalDefinition[];
  typeIdField?: keyof U;
  missingDataMessage?: string;
  
  // Filter state handling
  externalSelectedYear?: string | number;
  onYearChange?: (year: string | number) => void;
  
  // Styling/display
  entityName?: string;
  entityType?: EntityType;
  hideEmptyRows?: boolean;
  
  // Custom functions
  getItemData?: (itemTypeId: number, filteredData: T[]) => any;
  shouldRenderTable?: (itemTypes: U[], filteredData: T[]) => boolean;
}

const SafetyDataTable = <T extends DataItem, U extends ItemType>({
  // Data
  data,
  itemTypes,
  
  // Configuration
  title,
  columns,
  totals,
  typeIdField = 'id' as keyof U,
  missingDataMessage,
  
  // Filter state
  externalSelectedYear,
  onYearChange,
  
  // Styling/display
  entityName,
  entityType = 'school',
  hideEmptyRows = false,
  
  // Custom functions
  getItemData,
  shouldRenderTable = (types, items) => types.length > 0 && items.length > 0
}: SafetyDataTableProps<T, U>) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isLoading, setIsLoading] = useState(false);
  
  // Get default fiscal year from environment
  const defaultFiscalYear = parseInt(FISCAL_YEAR);
  
  // Use internal or external state for year selection
  const [internalSelectedYear, setInternalSelectedYear] = useState<string | number>(defaultFiscalYear);
  const [prevYear, setPrevYear] = useState<string | number>(
    externalSelectedYear !== undefined ? externalSelectedYear : internalSelectedYear
  );

  // Use either external or internal state
  const selectedYear = externalSelectedYear !== undefined ? externalSelectedYear : internalSelectedYear;
  const handleYearChangeInternal = externalSelectedYear !== undefined ? onYearChange : setInternalSelectedYear;
  
  // Default entity name based on context if not provided
  const displayEntityName = entityName?.toLowerCase() || entityType;
  
  // Get all available years from the data
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    data.forEach(item => years.add(item.year));
    return Array.from(years).sort((a, b) => b - a); // Sort descending
  }, [data]);
  
  // Reset selected year when fiscal year changes
  useEffect(() => {
    if (externalSelectedYear === undefined) {
      setInternalSelectedYear(defaultFiscalYear);
    }
  }, [defaultFiscalYear, externalSelectedYear]);
  
  // Effect to detect year changes (excluding initial load)
  useEffect(() => {
    const currentYear = externalSelectedYear !== undefined ? externalSelectedYear : internalSelectedYear;
    
    if (prevYear !== currentYear) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 800); // Show loading state for 800ms
      
      return () => clearTimeout(timer);
    }
    setPrevYear(currentYear);
  }, [externalSelectedYear, internalSelectedYear, prevYear]);
  
  // Filter data based on selected year
  const filteredData = useMemo(() => {
    return selectedYear === 'all' 
      ? data 
      : data.filter(item => item.year === Number(selectedYear));
  }, [selectedYear, data]);
  
  // Get item types with non-zero counts for mobile view
  const typesWithData = useMemo(() => {
    if (!hideEmptyRows || !isMobile) return itemTypes;
    
    return itemTypes.filter(type => {
      if (!getItemData) return true;
      
      // Safely access the ID using the typeIdField
      const itemId = Number(type[typeIdField]);
      const itemData = getItemData(itemId, filteredData);
      
      // Check if any value in the item data is non-zero
      return Object.values(itemData).some(value => 
        typeof value === 'number' && value > 0
      );
    });
  }, [itemTypes, filteredData, hideEmptyRows, isMobile, getItemData, typeIdField]);
  
  // Check if all types have zero counts
  const hasNoData = useMemo(() => {
    if (!totals || totals.length === 0) return false;
    
    return totals.every(total => 
      typeof total.value === 'number' && total.value === 0
    );
  }, [totals]);
  
  const handleYearChange = (event: SelectChangeEvent<string | number>) => {
    if (handleYearChangeInternal) {
      handleYearChangeInternal(event.target.value);
    }
  };
  
  const formattedYear = useMemo(() => {
    return typeof selectedYear === 'string' && selectedYear === 'all' 
      ? 'Selected Years' 
      : formatFiscalYear(selectedYear);
  }, [selectedYear]);
  
  // If custom render check is provided, use it, otherwise use default
  if (!shouldRenderTable(itemTypes, filteredData)) {
    return (
      <Box>
        <Typography sx={{ mb: 1 }}>
          {missingDataMessage || `There were no ${title.toLowerCase()} reported in the ${displayEntityName} in ${formattedYear}.`}
        </Typography>
      </Box>
    );
  }
  
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
          {title}
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
                {columns
                  .filter(column => !isMobile || column.mobileVisible !== false)
                  .map((column) => (
                    <TableCell 
                      key={column.id} 
                      align={column.align || 'left'}
                    >
                      {column.label}
                    </TableCell>
                  ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {isMobile && hasNoData ? (
                <TableRow sx={tableStyles.noDataRow}>
                  <TableCell colSpan={columns.filter(col => col.mobileVisible !== false).length}>
                    No data available for {formattedYear}
                  </TableCell>
                </TableRow>
              ) : (
                (isMobile && hideEmptyRows ? typesWithData : itemTypes).map((itemType, index, array) => {
                  // Safely access the ID using the typeIdField
                  const itemId = Number(itemType[typeIdField]);
                  const itemData = getItemData ? getItemData(itemId, filteredData) : {};
                  
                  return (
                    <TableRow 
                      key={itemType.id}
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
                      {columns
                        .filter(column => !isMobile || column.mobileVisible !== false)
                        .map((column) => (
                          <TableCell 
                            key={column.id} 
                            component={column.id === 'name' ? 'th' : 'td'} 
                            scope={column.id === 'name' ? 'row' : undefined}
                            align={column.align || 'left'}
                            sx={{ fontWeight: column.id === 'name' ? 'normal' : undefined }}
                          >
                            {column.id === 'name' 
                              ? itemType.name 
                              : column.getValue(itemData)
                            }
                          </TableCell>
                        ))}
                    </TableRow>
                  );
                })
              )}
              
              {/* Total row */}
              {totals && totals.length > 0 && (
                <TableRow sx={tableStyles.totalRow}>
                  {columns
                    .filter(column => !isMobile || column.mobileVisible !== false)
                    .map((column, colIndex) => {
                      const totalDef = totals.find(t => t.label === column.id) || 
                                      (colIndex === 0 ? { label: 'Total', value: 'Total', align: 'left' } : null);
                      
                      return totalDef ? (
                        <TableCell 
                          key={column.id} 
                          component={colIndex === 0 ? 'th' : 'td'} 
                          scope={colIndex === 0 ? 'row' : undefined}
                          align={totalDef.align || column.align || 'left'}
                        >
                          {totalDef.value}
                        </TableCell>
                      ) : (
                        <TableCell key={column.id} align={column.align || 'left'}>-</TableCell>
                      );
                    })}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default SafetyDataTable; 