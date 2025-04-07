import React, { useState, useMemo } from 'react';
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
  IconButton
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { useAppSelector } from '@/store/hooks';
import { 
  selectLatestStateExpenditureDetails, 
  selectExpenditureEntryTypes,
  selectTotalExpendituresByYear,
  selectFinancialReports,
} from '@/store/slices/financeSlice';
import { FISCAL_YEAR } from '@/utils/environment';

// Define types for Redux data
interface ExpenditureItem {
  entry_type_id: string;
  value: number;
}

interface FinancialReport {
  year: number;
  expenditure_details: ExpenditureItem[];
}

// Interface for the table data structure
interface CostCategory {
  name: string;
  isSubcategory?: boolean;
  district: number; // Represents percentage
  state: number; // Represents percentage
  parent?: string; // Parent category name for subcategories
}

interface CostBreakdownTableProps {
  data?: CostCategory[];
  districtName?: string;
}

// Category total structure for data accumulation
interface CategoryTotals {
  instruction: { 
    total: number; 
    regular: number; 
    special: number; 
    vocational: number; 
    otherPrograms: number;
  };
  supportServices: { 
    total: number; 
    student: number; 
    building: number; 
    administration: number; 
    transportation: number; 
    instructionalStaff: number; 
    other: number; 
    foodService: number;
  };
  other: { 
    total: number; 
    facilities: number; 
    debtService: number; 
    miscellaneous: number;
  };
}

const CostBreakdownTable: React.FC<CostBreakdownTableProps> = ({ data, districtName = 'District' }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State to track expanded categories
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
  // Toggle category expansion
  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryName)
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  // Fallback dummy data function
  const getDummyData = (): CostCategory[] => [
    { name: 'Instruction', district: 49.2, state: 48.3 },
    { name: 'Regular', isSubcategory: true, district: 33.5, state: 32.0, parent: 'Instruction' },
    { name: 'Special', isSubcategory: true, district: 9.8, state: 10.6, parent: 'Instruction' },
    { name: 'Vocational', isSubcategory: true, district: 3.9, state: 3.9, parent: 'Instruction' },
    { name: 'Other Programs', isSubcategory: true, district: 2.0, state: 1.8, parent: 'Instruction' },
    { name: 'Support Services', district: 38.4, state: 37.5 },
    { name: 'Student', isSubcategory: true, district: 8.2, state: 8.2, parent: 'Support Services' },
    { name: 'Instructional Staff', isSubcategory: true, district: 7.0, state: 6.8, parent: 'Support Services' },
    { name: 'Building', isSubcategory: true, district: 9.0, state: 8.6, parent: 'Support Services' },
    { name: 'Administration', isSubcategory: true, district: 7.1, state: 6.5, parent: 'Support Services' },
    { name: 'Transportation', isSubcategory: true, district: 5.6, state: 6.3, parent: 'Support Services' },
    { name: 'Other', isSubcategory: true, district: 1.5, state: 1.1, parent: 'Support Services' },
    { name: 'Other', district: 12.4, state: 14.2 },
    { name: 'Facilities', isSubcategory: true, district: 7.1, state: 8.2, parent: 'Other' },
    { name: 'Debt Service', isSubcategory: true, district: 3.9, state: 4.9, parent: 'Other' },
    { name: 'Miscellaneous', isSubcategory: true, district: 1.4, state: 1.1, parent: 'Other' },
  ];
  
  // Get data from Redux store
  const stateExpenditureDetails = useAppSelector(selectLatestStateExpenditureDetails);
  const entryTypes = useAppSelector(selectExpenditureEntryTypes);
  const districtFinancialReports = useAppSelector(selectFinancialReports);
  const districtExpenditureTotal = useAppSelector(state => 
    selectTotalExpendituresByYear(state, FISCAL_YEAR)
  );
  
  // Helper function to process an expenditure item and update the appropriate category
  const processExpenditureItem = (
    categoryName: string, 
    entryTypeName: string, 
    percentage: number, 
    totals: CategoryTotals
  ): void => {
    if (categoryName === 'Instruction') {
      totals.instruction.total += percentage;
      
      if (entryTypeName === 'Regular Programs') {
        totals.instruction.regular += percentage;
      } else if (entryTypeName === 'Special Programs') {
        totals.instruction.special += percentage;
      } else if (entryTypeName === 'Vocational Programs') {
        totals.instruction.vocational += percentage;
      } else if (entryTypeName === 'Other Instructional Programs') {
        totals.instruction.otherPrograms += percentage;
      } else {
        // Any other instruction-related programs
        totals.instruction.otherPrograms += percentage;
      }
    } else if (categoryName === 'Support Services') {
      totals.supportServices.total += percentage;
      
      if (entryTypeName === 'Student') {
        totals.supportServices.student += percentage;
      } else if (entryTypeName === 'Operation/Maintenance of Plant') {
        totals.supportServices.building += percentage;
      } else if (
        entryTypeName === 'General Administration' || 
        entryTypeName === 'School Administration' ||
        entryTypeName === 'Business' || 
        entryTypeName === 'Central'
      ) {
        totals.supportServices.administration += percentage;
      } else if (entryTypeName === 'Student Transportation') {
        totals.supportServices.transportation += percentage;
      } else if (entryTypeName === 'Instructional Staff') {
        totals.supportServices.instructionalStaff += percentage;
      } else {
        // Any other support service
        totals.supportServices.other += percentage;
      }
    } else if (categoryName === 'Operations') {
      if (
        entryTypeName === 'Elementary' || 
        entryTypeName === 'Middle/Junior High' || 
        entryTypeName === 'High'
      ) {
        totals.supportServices.total += percentage;
        totals.supportServices.foodService += percentage;
      } else {
        totals.other.total += percentage;
        totals.other.miscellaneous += percentage;
      }
    } else {
      totals.other.total += percentage;
      
      if (entryTypeName === 'Facilities Acquisition & Construction') {
        totals.other.facilities += percentage;
      } else if (categoryName === 'Debt Service') {
        totals.other.debtService += percentage;
      } else {
        totals.other.miscellaneous += percentage;
      }
    }
  };
  
  // Process the data to create our cost categories
  const processedData = useMemo((): CostCategory[] => {
    if (!stateExpenditureDetails || !entryTypes) {
      // Fallback to dummy data if real data is not available
      return getDummyData();
    }
    
    // Create category accumulators
    const categoryTotals = {
      district: {
        instruction: { total: 0, regular: 0, special: 0, vocational: 0, otherPrograms: 0 },
        supportServices: { 
          total: 0, student: 0, building: 0, administration: 0, 
          transportation: 0, instructionalStaff: 0, other: 0, foodService: 0
        },
        other: { total: 0, facilities: 0, debtService: 0, miscellaneous: 0 }
      },
      state: {
        instruction: { total: 0, regular: 0, special: 0, vocational: 0, otherPrograms: 0 },
        supportServices: { 
          total: 0, student: 0, building: 0, administration: 0, 
          transportation: 0, instructionalStaff: 0, other: 0, foodService: 0
        },
        other: { total: 0, facilities: 0, debtService: 0, miscellaneous: 0 }
      }
    };
    
    // Calculate state total for percentage calculations
    const stateItems = Array.isArray(stateExpenditureDetails) ? stateExpenditureDetails : [];
    const stateTotal = stateItems.reduce((sum: number, item: any) => sum + (item.value || 0), 0);
    
    // Find district expenditure report for the current fiscal year
    const districtExpenditures = districtFinancialReports[parseInt(FISCAL_YEAR)]?.expenditures;
    
    // Process state data
    stateItems.forEach((item: any) => {
      if (!item.entry_type_id) return;
      
      // Find the entry type by ID
      const entryType = Array.isArray(entryTypes) 
        ? entryTypes.find(type => type.id === item.entry_type_id)
        : entryTypes[item.entry_type_id]; // Fallback if entryTypes is an object
      
      if (!entryType) return; // Skip if entry type not found
      
      const categoryName = entryType?.category?.name || '';
      const entryTypeName = entryType?.name || '';
      const value = item.value || 0;
      const percentage = (value / stateTotal) * 100;
      
      processExpenditureItem(categoryName, entryTypeName, percentage, categoryTotals.state);
    });
    
    // Process district data
    if (districtExpenditures && districtExpenditures.length > 0) {
      districtExpenditures.forEach((item: any) => {
        if (!item.entry_type.id) return;
        
        const entryType = item.entry_type;
        const categoryName = entryType?.category?.name || '';
        const entryTypeName = entryType?.name || '';
        const value = item.value || 0;
        const percentage = (value / districtExpenditureTotal) * 100;
        
        processExpenditureItem(categoryName, entryTypeName, percentage, categoryTotals.district);
      });
    } else {
      // If no district data, use state data as placeholder
      categoryTotals.district = { ...categoryTotals.state };
    }
    
    // Transform processed data into the format needed for rendering
    return [
      // Instruction category
      { 
        name: 'Instruction', 
        district: categoryTotals.district.instruction.total, 
        state: categoryTotals.state.instruction.total 
      },
      { 
        name: 'Regular', 
        isSubcategory: true, 
        district: categoryTotals.district.instruction.regular, 
        state: categoryTotals.state.instruction.regular, 
        parent: 'Instruction' 
      },
      { 
        name: 'Special Ed.', 
        isSubcategory: true, 
        district: categoryTotals.district.instruction.special, 
        state: categoryTotals.state.instruction.special, 
        parent: 'Instruction' 
      },
      { 
        name: 'Vocational', 
        isSubcategory: true, 
        district: categoryTotals.district.instruction.vocational, 
        state: categoryTotals.state.instruction.vocational, 
        parent: 'Instruction' 
      },
      { 
        name: 'Other Programs', 
        isSubcategory: true, 
        district: categoryTotals.district.instruction.otherPrograms, 
        state: categoryTotals.state.instruction.otherPrograms, 
        parent: 'Instruction' 
      },
      
      // Support Services category
      { 
        name: 'Support Services', 
        district: categoryTotals.district.supportServices.total, 
        state: categoryTotals.state.supportServices.total 
      },
      { 
        name: 'Student', 
        isSubcategory: true, 
        district: categoryTotals.district.supportServices.student, 
        state: categoryTotals.state.supportServices.student, 
        parent: 'Support Services' 
      },
      { 
        name: 'Instructional Staff', 
        isSubcategory: true, 
        district: categoryTotals.district.supportServices.instructionalStaff, 
        state: categoryTotals.state.supportServices.instructionalStaff, 
        parent: 'Support Services' 
      },
      { 
        name: 'Facilities Mgmt', 
        isSubcategory: true, 
        district: categoryTotals.district.supportServices.building, 
        state: categoryTotals.state.supportServices.building, 
        parent: 'Support Services' 
      },
      { 
        name: 'Administration', 
        isSubcategory: true, 
        district: categoryTotals.district.supportServices.administration, 
        state: categoryTotals.state.supportServices.administration, 
        parent: 'Support Services' 
      },
      { 
        name: 'Transportation', 
        isSubcategory: true, 
        district: categoryTotals.district.supportServices.transportation, 
        state: categoryTotals.state.supportServices.transportation, 
        parent: 'Support Services' 
      },
      { 
        name: 'Food Service', 
        isSubcategory: true, 
        district: categoryTotals.district.supportServices.foodService, 
        state: categoryTotals.state.supportServices.foodService, 
        parent: 'Support Services' 
      },
      { 
        name: 'Other', 
        isSubcategory: true, 
        district: categoryTotals.district.supportServices.other, 
        state: categoryTotals.state.supportServices.other, 
        parent: 'Support Services' 
      },
      
      // Other category
      { 
        name: 'Other', 
        district: categoryTotals.district.other.total, 
        state: categoryTotals.state.other.total 
      },
      { 
        name: 'New Facilities', 
        isSubcategory: true, 
        district: categoryTotals.district.other.facilities, 
        state: categoryTotals.state.other.facilities, 
        parent: 'Other' 
      },
      { 
        name: 'Debt Service', 
        isSubcategory: true, 
        district: categoryTotals.district.other.debtService, 
        state: categoryTotals.state.other.debtService, 
        parent: 'Other' 
      },
      { 
        name: 'Miscellaneous', 
        isSubcategory: true, 
        district: categoryTotals.district.other.miscellaneous, 
        state: categoryTotals.state.other.miscellaneous, 
        parent: 'Other' 
      },
    ];
  }, [stateExpenditureDetails, entryTypes, districtFinancialReports, districtExpenditureTotal]);
  
  // Check if real data is loaded (not using dummy data)
  const isRealDataLoaded = useMemo((): boolean => {
    return !!(stateExpenditureDetails && entryTypes);
  }, [stateExpenditureDetails, entryTypes]);

  // Filter data based on expanded categories
  const tableData = useMemo((): CostCategory[] => {
    return processedData.filter(row => 
      !row.isSubcategory || // Always show main categories
      (row.parent && expandedCategories.includes(row.parent)) // Show subcategories only if parent is expanded
    );
  }, [processedData, expandedCategories]);
  
  // Check if a category has subcategories
  const hasSubcategories = (categoryName: string): boolean => {
    return processedData.some(row => row.isSubcategory && row.parent === categoryName);
  };

  // Format percentage with 1 decimal place and % sign
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  // Display cell data based on loading state
  const displayCellData = (value: number): string => {
    if (!isRealDataLoaded) {
      return 'N/A';
    }
    return formatPercentage(value);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography 
        variant="body1" 
        sx={{ 
          textAlign: "center",
          width: "100%",
          mb: 1
        }}
      >
        District Costs Relative to State Avg.
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2 }}>
        <TableContainer 
          component={Paper} 
          elevation={0} 
          sx={{ 
            flex: 1,
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
                <TableCell>Category</TableCell>
                <TableCell align="right">District</TableCell>
                <TableCell align="right">State</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tableData.map((row, index) => (
                <TableRow 
                  key={index}
                  sx={{ 
                    '&:last-child td, &:last-child th': { border: 0 },
                    ...(row.isSubcategory && { 
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    }),
                    ...(!row.isSubcategory && {
                      '& td, & th': {
                        borderBottom: '2px solid',
                        borderColor: 'grey.300',
                      }
                    }),
                    ...(!row.isSubcategory && hasSubcategories(row.name) && {
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      }
                    })
                  }}
                  onClick={() => !row.isSubcategory && hasSubcategories(row.name) && toggleCategory(row.name)}
                >
                  <TableCell 
                    component="th" 
                    scope="row"
                    sx={{ 
                      pl: row.isSubcategory ? 4 : 2,
                      fontWeight: 'normal',
                      fontStyle: row.isSubcategory ? 'italic' : 'normal',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {!row.isSubcategory && hasSubcategories(row.name) && (
                      <IconButton
                        size="small"
                        sx={{ mr: 1, p: 0 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCategory(row.name);
                        }}
                      >
                        {expandedCategories.includes(row.name) 
                          ? <KeyboardArrowDownIcon fontSize="small" />
                          : <KeyboardArrowRightIcon fontSize="small" />
                        }
                      </IconButton>
                    )}
                    {row.name}
                  </TableCell>
                  <TableCell 
                    align="right"
                    sx={{ 
                      fontStyle: row.isSubcategory ? 'italic' : 'normal',
                    }}
                  >
                    {displayCellData(row.district)}
                  </TableCell>
                  <TableCell 
                    align="right"
                    sx={{ 
                      fontStyle: row.isSubcategory ? 'italic' : 'normal',
                    }}
                  >
                    {displayCellData(row.state)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default CostBreakdownTable; 