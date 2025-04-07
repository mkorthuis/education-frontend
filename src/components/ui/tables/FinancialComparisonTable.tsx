import React, { useState, useMemo, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  IconButton,
  Collapse,
  useMediaQuery,
  useTheme,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  CircularProgress
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { formatCompactNumber } from '@/utils/formatting';
import { compareCategoryOrder } from '@/utils/categoryOrdering';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import { useAppSelector } from '@/store/hooks';
import { selectFinancialReports } from '@/store/slices/financeSlice';
import { 
  prepareDetailedRevenueComparisonData,
  prepareDetailedExpenditureComparisonData,
  prepareDetailedAssetsComparisonData,
  prepareDetailedLiabilitiesComparisonData
} from '@/features/district/utils/financialDataProcessing';

export interface FinancialComparisonItem {
  name: string;
  subCategory: string;
  category: string;
  currentValue: number;
  previousValue: number;
  difference?: number;
  percentChange?: number;
  isFirstInSubCategory?: boolean;
  isFirstInCategory?: boolean;
}

export interface FinancialComparisonTableProps {
  /**
   * The items to display in the comparison table
   */
  items: FinancialComparisonItem[];
  
  /**
   * Current year label
   */
  currentYear: string | null;
  
  /**
   * Column headers for categorical fields
   */
  headers?: {
    category?: string;
    subCategory?: string;
    itemName?: string;
  };
  
  /**
   * Optional custom value formatter function
   */
  formatValue?: (value: number) => string;
  
  /**
   * Title for the table
   */
  title?: string;
  
  /**
   * Whether to hide the title
   */
  hideTitle?: boolean;
  
  /**
   * Size of the table
   */
  size?: 'small' | 'medium';

  /**
   * Initial view mode for the table
   */
  initialViewMode?: 'comparison' | 'percentage';

  /**
   * Available comparison years for dropdown
   */
  availableComparisonYears?: string[];
  
  /**
   * Handler for comparison year change
   */
  onComparisonYearChange?: (year: string) => void;
  
  /**
   * Type of value being displayed (Cost, Assets, Debts)
   * Used for column headers
   */
  valueType?: string;
  
  /**
   * Custom label for total row
   */
  totalRowLabel?: string;
}

interface CategorySummary {
  category: string;
  currentValue: number;
  previousValue: number;
  difference: number;
  percentChange: number;
  budgetPercentage: number;
  items: FinancialComparisonItem[];
}

type ViewMode = 'comparison' | 'percentage';

/**
 * A reusable table component for displaying financial comparisons between two time periods
 * Can be used for various financial data types like expenditures, revenues, assets, etc.
 */
const FinancialComparisonTable: React.FC<FinancialComparisonTableProps> = ({
  items: initialItems,
  currentYear,
  headers = {
    category: 'Entry',
    subCategory: 'Sub Category',
    itemName: 'Item'
  },
  formatValue = formatCompactNumber,
  title = 'Financial Comparison',
  hideTitle = false,
  size = 'small',
  initialViewMode = 'comparison',
  availableComparisonYears = [],
  onComparisonYearChange,
  valueType,
  totalRowLabel
}) => {
  // Access all financial reports from Redux
  const financialReports = useAppSelector(selectFinancialReports);

  if (!initialItems || initialItems.length === 0) {
    return <Typography>No data available for comparison.</Typography>;
  }

  // Use theme and media query to detect mobile screens
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State to track expanded categories
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  
  // State to track expanded subcategories
  const [expandedSubCategories, setExpandedSubCategories] = useState<Record<string, boolean>>({});

  // State to track view mode (comparison or percentage)
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);

  // Initial comparison year is the previous fiscal year if available
  const [selectedComparisonYear, setSelectedComparisonYear] = useState(() => {
    // Default to previous year if available, otherwise use the most recent available year
    const previousYear = currentYear ? (parseInt(currentYear) - 1).toString() : '';
    return availableComparisonYears.includes(previousYear) 
      ? previousYear  
      : (availableComparisonYears.length > 0 ? availableComparisonYears[0] : '');
  });

  // Update selectedComparisonYear when availableComparisonYears changes
  useEffect(() => {
    // If current selection is not in the available years, reset to the default
    if (selectedComparisonYear && !availableComparisonYears.includes(selectedComparisonYear)) {
      const previousYear = currentYear ? (parseInt(currentYear) - 1).toString() : '';
      const newYear = availableComparisonYears.includes(previousYear)
        ? previousYear
        : (availableComparisonYears.length > 0 ? availableComparisonYears[0] : '');
      
      setSelectedComparisonYear(newYear);
    }
  }, [availableComparisonYears, currentYear, selectedComparisonYear]);

  // Generate updated items based on the selected comparison year
  const items = useMemo(() => {
    if (
      financialReports && 
      currentYear && 
      selectedComparisonYear && 
      financialReports[currentYear] && 
      financialReports[selectedComparisonYear]
    ) {
      // Get the right preparation function based on the table title
      if (title.includes('Revenue')) {
        return prepareDetailedRevenueComparisonData(
          financialReports[currentYear],
          financialReports[selectedComparisonYear]
        );
      } else if (title.includes('Expenditure')) {
        return prepareDetailedExpenditureComparisonData(
          financialReports[currentYear],
          financialReports[selectedComparisonYear]
        );
      } else if (title.includes('Assets')) {
        return prepareDetailedAssetsComparisonData(
          financialReports[currentYear],
          financialReports[selectedComparisonYear]
        );
      } else if (title.includes('Liabilities')) {
        return prepareDetailedLiabilitiesComparisonData(
          financialReports[currentYear],
          financialReports[selectedComparisonYear]
        );
      }
    }
    
    // If we can't recalculate, use the initial items
    return initialItems;
  }, [initialItems, financialReports, currentYear, selectedComparisonYear, title]);

  const formattedCurrentYear = formatFiscalYear(currentYear);
  const formattedPreviousYear = formatFiscalYear(selectedComparisonYear);

  // Handle comparison year change internally before calling external handler
  const handleComparisonYearChange = (event: SelectChangeEvent<string>) => {
    const newYear = event.target.value;
    setSelectedComparisonYear(newYear);
    
    // Set view mode to comparison when changing comparison year
    setViewMode('comparison');
    
    // Call external handler if provided
    if (onComparisonYearChange) {
      onComparisonYearChange(newYear);
    }
  };

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };
  
  // Toggle subcategory expansion
  const toggleSubCategory = (categoryKey: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering category toggle
    setExpandedSubCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  // Handle view mode change
  const handleViewModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newViewMode: ViewMode | null
  ) => {
    // If null is returned (button is deselected), default to comparison mode
    if (newViewMode === null) {
      setViewMode('comparison');
    } else {
      setViewMode(newViewMode);
    }
  };

  // Pre-process items to ensure difference and percentChange are calculated
  const processedItems = useMemo(() => items.map(item => {
    const difference = item.difference !== undefined ? item.difference : item.currentValue - item.previousValue;
    
    const percentChange = item.percentChange !== undefined ? item.percentChange : 
      (item.previousValue > 0 ? (difference / item.previousValue) * 100 : 0);
    
    return {
      ...item,
      difference,
      percentChange
    };
  }), [items]);

  // Calculate totals for each column
  const totalCurrentValue = processedItems.reduce((sum, row) => sum + row.currentValue, 0);
  const totalPreviousValue = processedItems.reduce((sum, row) => sum + row.previousValue, 0);
  const totalDifference = totalCurrentValue - totalPreviousValue;
  const totalPercentChange = totalPreviousValue > 0 
    ? (totalDifference / totalPreviousValue) * 100 
    : 0;

  // Group items by category and calculate summaries
  const categorySummaries = useMemo(() => {
    const summaries: CategorySummary[] = [];
    const categoryMap = new Map<string, FinancialComparisonItem[]>();
    
    // Group items by category
    processedItems.forEach(item => {
      if (!categoryMap.has(item.category)) {
        categoryMap.set(item.category, []);
      }
      categoryMap.get(item.category)?.push(item);
    });
    
    // Calculate summaries for each category
    categoryMap.forEach((categoryItems, category) => {
      const currentValue = categoryItems.reduce((sum, item) => sum + item.currentValue, 0);
      const previousValue = categoryItems.reduce((sum, item) => sum + item.previousValue, 0);
      const difference = currentValue - previousValue;
      const percentChange = previousValue > 0 ? (difference / previousValue) * 100 : 0;
      const budgetPercentage = totalCurrentValue > 0 ? (currentValue / totalCurrentValue) * 100 : 0;
      
      summaries.push({
        category,
        currentValue,
        previousValue,
        difference,
        percentChange,
        budgetPercentage,
        items: categoryItems
      });
    });
    
    // Sort summaries using the shared utility function
    return summaries.sort((a, b) => compareCategoryOrder(a.category, b.category));
  }, [processedItems, totalCurrentValue]);

  // Format percentage for display
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Extract first word from category/subcategory for concise labels
  const getFirstWord = (text: string): string => {
    return text.split(' ')[0];
  };

  // Check if we're dealing with revenue data
  const isRevenueData = useMemo(() => {
    if (processedItems.length === 0) return false;
    
    // Check if any item has a revenue category
    return processedItems.some(item => 
      item.category.includes("Revenue") || 
      item.category.includes("Financing Sources")
    );
  }, [processedItems]);

  // Determine appropriate column headers based on data type
  const valueColumnHeader = valueType || (isRevenueData ? "Revenue" : "Cost");

  // Reusable components
  const renderCellWithChangeColor = (value: number, changeValue: number, formatter = formatValue, isBold = false) => (
    <TableCell align="right" width={isMobile ? "25%" : "15%"} sx={{ 
      color: changeValue > 0 ? 'success.main' : changeValue < 0 ? 'error.main' : 'text.primary',
      fontWeight: isBold ? 'bold' : 'inherit'
    }}>
      {changeValue > 0 ? '+' : ''}{formatter(value)}
    </TableCell>
  );

  const renderPercentChangeCell = (difference: number, percentChange: number, isBold = false) => (
    <TableCell align="right" width={isMobile ? "25%" : "15%"} sx={{ 
      color: percentChange > 0 ? 'success.main' : percentChange < 0 ? 'error.main' : 'text.primary',
      fontWeight: isBold ? 'bold' : 'inherit'
    }}>
      {difference === 0 ? '0%' : (
        <>
          {percentChange > 0 ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
          {Math.abs(percentChange).toFixed(1)}%
        </>
      )}
    </TableCell>
  );

  const renderProgressBar = (
    percentage: number, 
    height: number = 20, 
    color: string = 'primary.main'
  ) => (
    <Box sx={{ 
      width: '100%', 
      height: `${height}px`, 
      border: '1px solid #ddd',
      borderRadius: '4px',
      overflow: 'hidden'
    }}>
      <Box sx={{ 
        width: `${percentage}%`, 
        height: '100%',
        bgcolor: color,
        transition: 'width 0.5s ease-in-out'
      }} />
    </Box>
  );

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row', 
        alignItems: isMobile ? 'flex-start' : 'center', 
        justifyContent: 'space-between',
        mt: isMobile ? 0 : 4, 
        mb: 2 
      }}>
        {!hideTitle && (
          <Typography variant="h6" sx={{ mb: isMobile ? 2 : 0 }}>
            {title}
          </Typography>
        )}
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: isMobile ? 2 : 0,
          width: isMobile ? '100%' : 'auto',
          flexDirection: 'row',
          justifyContent: isMobile ? 'space-between' : 'flex-end'
        }}>
          {/* Comparison Year Dropdown */}
          {availableComparisonYears.length > 0 && selectedComparisonYear && (
            <FormControl sx={{ 
              flex: isMobile ? 1 : 'unset',
              mr: 2,
              width: isMobile ? 'auto' : 165
            }}>
              <Select
                value={selectedComparisonYear}
                onChange={handleComparisonYearChange}
                size={isMobile ? "small" : "medium"}
                displayEmpty
                onClick={() => setViewMode('comparison')}
                onOpen={() => setViewMode('comparison')}
                sx={{ 
                  bgcolor: viewMode === 'comparison' ? 'rgba(0, 0, 0, 0.08)' : 'inherit',
                  '&.Mui-focused': {
                    bgcolor: viewMode === 'comparison' ? 'rgba(0, 0, 0, 0.08)' : 'inherit'
                  },
                  border: '1px solid rgba(0, 0, 0, 0.12)',
                  borderRadius: '4px',
                  '& .MuiOutlinedInput-notchedOutline': { 
                    border: 'none' 
                  },
                  '&:hover': {
                    bgcolor: viewMode === 'comparison' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(0, 0, 0, 0.04)'
                  },
                  height: isMobile ? '38px' : '48.5px',
                  '& .MuiSelect-select': {
                    color: 'rgba(0, 0, 0, 0.87)',
                    fontWeight: 500,
                    padding: isMobile ? '6px 12px' : undefined
                  },
                  width: '100%'
                }}
              >
                {availableComparisonYears.map((year) => (
                  <MenuItem 
                    key={year} 
                    value={year}
                    sx={{
                      fontWeight: 500
                    }}
                  >
                    Compare {(parseInt(year) - 1).toString().slice(-2)}/{year.slice(-2)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          
          
          {/* % Budget Button */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            aria-label="table view mode"
            size={isMobile ? "small" : "medium"}
            sx={{
              flex: isMobile ? 1 : 'unset',
              '& .MuiToggleButton-root': {
                height: isMobile ? '38px' : '48.5px',
                width: '100%',
                color: 'rgba(0, 0, 0, 0.87)',
                fontWeight: 500
              },
              '& .MuiToggleButton-root.Mui-selected': {
                bgcolor: 'rgba(0, 0, 0, 0.08)',
                color: 'rgba(0, 0, 0, 0.87)',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.12)'
                }
              }
            }}
          >
            <Tooltip title="Show as percentage of total budget">
              <ToggleButton value="percentage" aria-label="percentage view">
                % Budget
              </ToggleButton>
            </Tooltip>
          </ToggleButtonGroup>
        </Box>
      </Box>
      
      <TableContainer component={Paper} sx={{ 
        mt: isMobile ? 0 : 2, 
        mb: 4 
      }}>
        <Table aria-label="financial comparison table" size={size} sx={{ tableLayout: 'fixed', width: '100%', borderCollapse: 'collapse' }}>
          <TableHead>
            <TableRow>
              <TableCell width={isMobile ? "20px" : "30px"} padding={isMobile ? "none" : "normal"}></TableCell>
              <TableCell width={isMobile ? "50%" : "35%"}><strong>{headers.category}</strong></TableCell>
              <TableCell align="right" width={isMobile ? "25%" : "15%"}>
                <strong>{`${formattedCurrentYear || 'Current'} ${valueColumnHeader}`}</strong>
              </TableCell>
              <TableCell align="right" width={isMobile ? "25%" : "15%"}>
                <strong>
                  {viewMode === 'comparison' 
                    ? `${formattedPreviousYear || 'Previous'} ${valueColumnHeader}` 
                    : isMobile ? `% of Budget` : `% of Total Budget`}
                </strong>
              </TableCell>
              {!isMobile && viewMode === 'comparison' && (
                <>
                  <TableCell align="right" width="15%"><strong>Change</strong></TableCell>
                  <TableCell align="right" width="15%"><strong>% Change</strong></TableCell>
                </>
              )}
              {!isMobile && viewMode === 'percentage' && (
                <TableCell align="right" width="30%"><strong>Breakdown</strong></TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {categorySummaries.map((summary) => (
              <React.Fragment key={summary.category}>
                {/* Category summary row */}
                <TableRow 
                  sx={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    cursor: 'pointer',
                    '& > *': { 
                      borderBottom: 'unset',
                      fontWeight: 'bold' 
                    }
                  }}
                  onClick={() => toggleCategory(summary.category)}
                >
                  <TableCell padding={isMobile ? "none" : "normal"} width={isMobile ? "20px" : "30px"}>
                    <IconButton 
                      size={isMobile ? "small" : "small"} 
                      aria-label="expand row" 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCategory(summary.category);
                      }}
                      sx={isMobile ? { padding: '2px' } : {}}
                    >
                      {expandedCategories[summary.category] ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
                    </IconButton>
                  </TableCell>
                  <TableCell width={isMobile ? "50%" : "35%"}>
                    {summary.category}
                  </TableCell>
                  <TableCell align="right" width={isMobile ? "25%" : "15%"}>{formatValue(summary.currentValue)}</TableCell>
                  {viewMode === 'comparison' ? (
                    <TableCell align="right" width={isMobile ? "25%" : "15%"}>{formatValue(summary.previousValue)}</TableCell>
                  ) : (
                    <TableCell align="right" width={isMobile ? "25%" : "15%"}>{formatPercentage(summary.budgetPercentage)}</TableCell>
                  )}
                  {!isMobile && viewMode === 'comparison' && (
                    <>
                      {renderCellWithChangeColor(summary.difference, summary.difference, formatValue, true)}
                      {renderPercentChangeCell(summary.difference, summary.percentChange, true)}
                    </>
                  )}
                  {!isMobile && viewMode === 'percentage' && (
                    <TableCell align="right" width="30%">
                      {renderProgressBar(summary.budgetPercentage)}
                    </TableCell>
                  )}
                </TableRow>
                
                {/* Collapsible detail rows */}
                <TableRow>
                  <TableCell 
                    style={{ padding: 0 }} 
                    colSpan={
                      isMobile ? 4 : 
                      viewMode === 'comparison' ? 6 : 5
                    }
                  >
                    <Collapse in={expandedCategories[summary.category]} timeout="auto" unmountOnExit>
                      <Box>
                        <Table size={size} aria-label={`${summary.category} details`} sx={{ tableLayout: 'fixed', width: '100%', borderCollapse: 'collapse' }}>
                          <TableHead>
                            <TableRow sx={{ display: 'none' }}>
                              <TableCell width={isMobile ? "20px" : "30px"} padding={isMobile ? "none" : "normal"}></TableCell>
                              <TableCell width={isMobile ? "50%" : "35%"}></TableCell>
                              <TableCell align="right" width={isMobile ? "25%" : "15%"}></TableCell>
                              <TableCell align="right" width={isMobile ? "25%" : "15%"}></TableCell>
                              {!isMobile && viewMode === 'comparison' && (
                                <>
                                  <TableCell align="right" width="15%"></TableCell>
                                  <TableCell align="right" width="15%"></TableCell>
                                </>
                              )}
                              {!isMobile && viewMode === 'percentage' && (
                                <TableCell align="right" width="30%"></TableCell>
                              )}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {/* Group items by subcategory */}
                            {(() => {
                              // Collect all subcategories for this category
                              const subCategories = Array.from(
                                new Set(summary.items.map(item => item.subCategory))
                              );
                              
                              // For revenue categories, sort by subcategory total value (descending)
                              // For other categories, sort alphabetically
                              const isRevenue = summary.category.includes("Revenue") || 
                                               summary.category.includes("Financing Sources");
                                
                              let sortedSubCategories = subCategories;
                              
                              if (isRevenue) {
                                // Calculate total for each subcategory
                                const subCategoryTotals = new Map<string, number>();
                                
                                summary.items.forEach(item => {
                                  const currentTotal = subCategoryTotals.get(item.subCategory) || 0;
                                  subCategoryTotals.set(item.subCategory, currentTotal + item.currentValue);
                                });
                                
                                // Sort by total value (descending)
                                sortedSubCategories = subCategories.sort((a, b) => {
                                  const totalA = subCategoryTotals.get(a) || 0;
                                  const totalB = subCategoryTotals.get(b) || 0;
                                  
                                  // Sort by value descending, then alphabetically if values are equal
                                  return totalA !== totalB ? totalB - totalA : a.localeCompare(b);
                                });
                              } else {
                                sortedSubCategories = subCategories.sort();
                              }
                              
                              return sortedSubCategories.map(subCategory => {
                                // Get all items in this subcategory
                                const subCategoryItems = summary.items
                                  .filter(item => item.subCategory === subCategory)
                                  .sort((a, b) => b.currentValue - a.currentValue);
                                
                                // Calculate subcategory totals
                                const subCategoryCurrentTotal = subCategoryItems.reduce(
                                  (sum, item) => sum + item.currentValue, 0
                                );
                                const subCategoryPreviousTotal = subCategoryItems.reduce(
                                  (sum, item) => sum + item.previousValue, 0
                                );
                                const subCategoryDifference = subCategoryCurrentTotal - subCategoryPreviousTotal;
                                const subCategoryPercentChange = subCategoryPreviousTotal > 0 
                                  ? (subCategoryDifference / subCategoryPreviousTotal) * 100 
                                  : 0;
                                const subCategoryBudgetPercentage = totalCurrentValue > 0
                                  ? (subCategoryCurrentTotal / totalCurrentValue) * 100
                                  : 0;
                                const subCategoryCategoryPercentage = summary.currentValue > 0
                                  ? (subCategoryCurrentTotal / summary.currentValue) * 100
                                  : 0;
                                  
                                // Create a unique key for this subcategory
                                const subCategoryKey = `${summary.category}-${subCategory}`;
                                  
                                return (
                                  <React.Fragment key={subCategoryKey}>
                                    {/* Subcategory header row */}
                                    <TableRow 
                                      sx={{ 
                                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                                        cursor: 'pointer',
                                        '& > *': { 
                                          fontWeight: 'bold',
                                          borderTop: '1px solid',
                                          borderTopColor: 'divider',
                                        }
                                      }}
                                      onClick={(e) => toggleSubCategory(subCategoryKey, e)}
                                    >
                                      <TableCell width={isMobile ? "20px" : "30px"} padding={isMobile ? "none" : "normal"}>
                                        <IconButton 
                                          size="small" 
                                          aria-label="expand subcategory"
                                          onClick={(e) => toggleSubCategory(subCategoryKey, e)}
                                          sx={isMobile ? { padding: '2px' } : {}}
                                        >
                                          {expandedSubCategories[subCategoryKey] ? 
                                            <KeyboardArrowDownIcon /> : 
                                            <KeyboardArrowRightIcon />
                                          }
                                        </IconButton>
                                      </TableCell>
                                      <TableCell width={isMobile ? "50%" : "35%"}>
                                        <Box sx={{ pl: isMobile ? 1 : 2 }}>
                                          {subCategory}
                                        </Box>
                                      </TableCell>
                                      <TableCell align="right" width={isMobile ? "25%" : "15%"}>
                                        {formatValue(subCategoryCurrentTotal)}
                                      </TableCell>
                                      {viewMode === 'comparison' ? (
                                        <TableCell align="right" width={isMobile ? "25%" : "15%"}>
                                          {formatValue(subCategoryPreviousTotal)}
                                        </TableCell>
                                      ) : (
                                        <TableCell align="right" width={isMobile ? "25%" : "15%"}>
                                          <Tooltip title={`${formatPercentage(subCategoryBudgetPercentage)} of total ${formattedCurrentYear || 'current'} budget, ${formatPercentage(subCategoryCategoryPercentage)} of ${getFirstWord(summary.category)}`}>
                                            <span>{formatPercentage(subCategoryBudgetPercentage)}</span>
                                          </Tooltip>
                                        </TableCell>
                                      )}
                                      {!isMobile && viewMode === 'comparison' && (
                                        <>
                                          <TableCell align="right" width="15%" sx={{ 
                                            color: subCategoryDifference > 0 ? 'success.main' : subCategoryDifference < 0 ? 'error.main' : 'text.primary',
                                            fontWeight: 'bold'
                                          }}>
                                            {subCategoryDifference > 0 ? '+' : ''}{formatValue(subCategoryDifference)}
                                          </TableCell>
                                          <TableCell align="right" width="15%" sx={{ 
                                            color: subCategoryPercentChange > 0 ? 'success.main' : subCategoryPercentChange < 0 ? 'error.main' : 'text.primary',
                                            fontWeight: 'bold'
                                          }}>
                                            {subCategoryDifference === 0 ? '0%' : (
                                              <>
                                                {subCategoryPercentChange > 0 ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
                                                {Math.abs(subCategoryPercentChange).toFixed(1)}%
                                              </>
                                            )}
                                          </TableCell>
                                        </>
                                      )}
                                      {!isMobile && viewMode === 'percentage' && (
                                        <TableCell align="right" width="30%">
                                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            {renderProgressBar(subCategoryCategoryPercentage, 12, 'secondary.main')}
                                            <Typography variant="caption" sx={{ ml: 1 }}>
                                              {formatPercentage(subCategoryCategoryPercentage)} of {getFirstWord(summary.category)}
                                            </Typography>
                                          </Box>
                                        </TableCell>
                                      )}
                                    </TableRow>
                                    
                                    {/* Individual items within this subcategory - collapsible */}
                                    <TableRow>
                                      <TableCell 
                                        style={{ padding: 0 }} 
                                        colSpan={
                                          isMobile ? 4 : 
                                          viewMode === 'comparison' ? 6 : 5
                                        }
                                      >
                                        <Collapse in={expandedSubCategories[subCategoryKey]} timeout="auto" unmountOnExit>
                                          <Box>
                                            <Table size={size} sx={{ tableLayout: 'fixed', width: '100%', borderCollapse: 'collapse' }}>
                                              <TableHead>
                                                <TableRow sx={{ display: 'none' }}>
                                                  <TableCell width={isMobile ? "20px" : "30px"} padding={isMobile ? "none" : "normal"}></TableCell>
                                                  <TableCell width={isMobile ? "50%" : "35%"}></TableCell>
                                                  <TableCell align="right" width={isMobile ? "25%" : "15%"}></TableCell>
                                                  <TableCell align="right" width={isMobile ? "25%" : "15%"}></TableCell>
                                                  {!isMobile && viewMode === 'comparison' && (
                                                    <>
                                                      <TableCell align="right" width="15%"></TableCell>
                                                      <TableCell align="right" width="15%"></TableCell>
                                                    </>
                                                  )}
                                                  {!isMobile && viewMode === 'percentage' && (
                                                    <TableCell align="right" width="30%"></TableCell>
                                                  )}
                                                </TableRow>
                                              </TableHead>
                                              <TableBody>
                                                {subCategoryItems.map(row => {
                                                  // Calculate item percentage of budget and subcategory
                                                  const itemBudgetPercentage = totalCurrentValue > 0
                                                    ? (row.currentValue / totalCurrentValue) * 100
                                                    : 0;
                                                  const itemSubCategoryPercentage = subCategoryCurrentTotal > 0
                                                    ? (row.currentValue / subCategoryCurrentTotal) * 100
                                                    : 0;
                                                    
                                                  return (
                                                    <TableRow key={`${row.category}-${row.subCategory}-${row.name}`}>
                                                      <TableCell width={isMobile ? "20px" : "30px"} padding={isMobile ? "none" : "normal"}></TableCell>
                                                      <TableCell width={isMobile ? "50%" : "35%"}>
                                                        <Box sx={{ pl: isMobile ? 2 : 4 }}>{row.name}</Box>
                                                      </TableCell>
                                                      <TableCell align="right" width={isMobile ? "25%" : "15%"}>
                                                        {formatValue(row.currentValue)}
                                                      </TableCell>
                                                      {viewMode === 'comparison' ? (
                                                        <TableCell align="right" width={isMobile ? "25%" : "15%"}>
                                                          {formatValue(row.previousValue)}
                                                        </TableCell>
                                                      ) : (
                                                        <TableCell align="right" width={isMobile ? "25%" : "15%"}>
                                                          <Tooltip title={`${formatPercentage(itemBudgetPercentage)} of total ${formattedCurrentYear || 'current'} budget, ${formatPercentage(itemSubCategoryPercentage)} of ${getFirstWord(subCategory)}`}>
                                                            <span>{formatPercentage(itemBudgetPercentage)}</span>
                                                          </Tooltip>
                                                        </TableCell>
                                                      )}
                                                      {!isMobile && viewMode === 'comparison' && (
                                                        <>
                                                          {renderCellWithChangeColor(row.difference ?? 0, row.difference ?? 0)}
                                                          {renderPercentChangeCell(row.difference ?? 0, row.percentChange ?? 0)}
                                                        </>
                                                      )}
                                                      {!isMobile && viewMode === 'percentage' && (
                                                        <TableCell align="right" width="30%">
                                                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                            {renderProgressBar(itemSubCategoryPercentage, 8, 'info.main')}
                                                            <Typography variant="caption" sx={{ ml: 1 }}>
                                                              {formatPercentage(itemSubCategoryPercentage)} of {getFirstWord(subCategory)}
                                                            </Typography>
                                                          </Box>
                                                        </TableCell>
                                                      )}
                                                    </TableRow>
                                                  );
                                                })}
                                              </TableBody>
                                            </Table>
                                          </Box>
                                        </Collapse>
                                      </TableCell>
                                    </TableRow>
                                  </React.Fragment>
                                );
                              });
                            })()}
                          </TableBody>
                        </Table>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
            
            {/* Total row */}
            <TableRow sx={{ 
              '& td, & th': { 
                fontWeight: 'bold', 
                borderTop: '2px solid', 
                borderTopColor: 'divider' 
              } 
            }}>
              <TableCell padding={isMobile ? "none" : "normal"}></TableCell>
              <TableCell>{totalRowLabel || (isRevenueData ? "Total Revenue" : "Total Expenditure")}</TableCell>
              <TableCell align="right">{formatValue(totalCurrentValue)}</TableCell>
              {viewMode === 'comparison' ? (
                <TableCell align="right">{formatValue(totalPreviousValue)}</TableCell>
              ) : (
                <TableCell align="right">100.0%</TableCell>
              )}
              {!isMobile && viewMode === 'comparison' && (
                <>
                  {renderCellWithChangeColor(totalDifference, totalDifference, formatValue, true)}
                  {renderPercentChangeCell(totalDifference, totalPercentChange, true)}
                </>
              )}
              {!isMobile && viewMode === 'percentage' && (
                <TableCell align="right">
                  {renderProgressBar(100)}
                </TableCell>
              )}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default FinancialComparisonTable; 