import React, { useState, useMemo, useEffect } from 'react';
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
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  alpha
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectLatestStateExpenditureDetails, 
  selectExpenditureEntryTypes,
  selectFinancialReports,
  selectLatestStateADM,
  fetchStateADM
} from '@/store/slices/financeSlice';
import { FISCAL_YEAR } from '@/utils/environment';
import { formatCompactNumber } from '@/utils/formatting';
import { costBreakdown, CostCategory } from '@/features/district/utils/costBreakdown';

// Define types for Redux data
interface ExpenditureItem {
  entry_type_id: string;
  value: number;
}

interface FinancialReport {
  year: number;
  expenditure_details: ExpenditureItem[];
}

interface CostBreakdownTableProps {
  data?: CostCategory[];
  districtName?: string;
}

// Define a type for the view mode selection
type ViewMode = 'percentage' | 'perPupil';

// Table styles similar to SafetyDataTable
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
  viewSelect: {
    minWidth: 80,
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

const CostBreakdownTable: React.FC<CostBreakdownTableProps> = ({ data, districtName = 'District' }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State to track expanded categories
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
  // State to track the selected view mode
  const [viewMode, setViewMode] = useState<ViewMode>('percentage');
  
  // Toggle category expansion
  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryName)
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  // Handle view mode change
  const handleViewModeChange = (event: SelectChangeEvent<ViewMode>) => {
    setViewMode(event.target.value as ViewMode);
  };

  // Get data from Redux store
  const stateExpenditureDetails = useAppSelector(selectLatestStateExpenditureDetails);
  const entryTypes = useAppSelector(selectExpenditureEntryTypes);
  const districtFinancialReports = useAppSelector(selectFinancialReports);
  const stateADM = useAppSelector(selectLatestStateADM);
  
  // Shares of spending, and cost per student, beside the state's
  const breakdownInput = {
    stateItems: stateExpenditureDetails,
    entryTypes,
    districtReport: districtFinancialReports[FISCAL_YEAR],
    stateADM,
  };
  const processedData = useMemo((): CostCategory[] => costBreakdown('percentage', breakdownInput),
    [stateExpenditureDetails, entryTypes, districtFinancialReports]);

  const admProcessedData = useMemo((): CostCategory[] => costBreakdown('admCost', breakdownInput),
    [stateExpenditureDetails, entryTypes, districtFinancialReports, stateADM]);
  
  // Without entry types nothing can be categorized; without state details the State column is unknown
  const hasEntryTypes = entryTypes.length > 0;
  const hasStateData = stateExpenditureDetails.length > 0;

  // Filter data based on expanded categories and selected view mode
  const tableData = useMemo((): CostCategory[] => {
    // Select data source based on view mode
    const dataSource = viewMode === 'percentage' ? processedData : admProcessedData;
    
    return dataSource.filter(row => 
      !row.isSubcategory || // Always show main categories
      (row.parent && expandedCategories.includes(row.parent)) // Show subcategories only if parent is expanded
    );
  }, [processedData, admProcessedData, expandedCategories, viewMode]);
  
  // Check if a category has subcategories
  const hasSubcategories = (categoryName: string): boolean => {
    const dataSource = viewMode === 'percentage' ? processedData : admProcessedData;
    return dataSource.some(row => row.isSubcategory && row.parent === categoryName);
  };

  // Format percentage with 1 decimal place and % sign
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };
  
  // Display cell data based on view mode
  const displayCellData = (value: number): string => {
    return viewMode === 'percentage' ? formatPercentage(value) : formatCompactNumber(value);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
        <FormControl size="small" sx={tableStyles.viewSelect}>
          <Select
            value={viewMode}
            onChange={handleViewModeChange}
            displayEmpty
            variant="standard"
            sx={tableStyles.selectInput(theme)}
          >
            <MenuItem value="percentage">Percentage</MenuItem>
            <MenuItem value="perPupil">Per Pupil</MenuItem>
          </Select>
        </FormControl>
        <Typography variant="body1" sx={{ ml: .5 }}>
          Breakdown of District Costs
        </Typography>
      </Box>
      
      {!hasEntryTypes ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <Typography variant="body1" color="text.secondary">
            Cost breakdown is not available for this year.
          </Typography>
        </Box>
      ) : (
      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2 }}>
        <TableContainer 
          component={Paper} 
          elevation={0} 
          sx={tableStyles.container}
        >
          <Table size="small">
            <TableHead sx={tableStyles.head}>
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
                    {hasStateData ? displayCellData(row.state) : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      )}
    </Box>
  );
};

export default CostBreakdownTable; 