import React, { useState, useMemo } from 'react';
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
  useTheme
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { formatCompactNumber } from '@/utils/formatting';

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
   * Previous year label
   */
  previousYear: string | null;
  
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
}

interface CategorySummary {
  category: string;
  currentValue: number;
  previousValue: number;
  difference: number;
  percentChange: number;
  items: FinancialComparisonItem[];
}

/**
 * A reusable table component for displaying financial comparisons between two time periods
 * Can be used for various financial data types like expenditures, revenues, assets, etc.
 */
const FinancialComparisonTable: React.FC<FinancialComparisonTableProps> = ({
  items,
  currentYear,
  previousYear,
  headers = {
    category: 'Entry',
    subCategory: 'Sub Category',
    itemName: 'Item'
  },
  formatValue = formatCompactNumber,
  title = 'Financial Comparison',
  hideTitle = false,
  size = 'small'
}) => {
  if (!items || items.length === 0) {
    return <Typography>No data available for comparison.</Typography>;
  }

  // Use theme and media query to detect mobile screens
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State to track expanded categories
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  
  // State to track expanded subcategories
  const [expandedSubCategories, setExpandedSubCategories] = useState<Record<string, boolean>>({});

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
      
      summaries.push({
        category,
        currentValue,
        previousValue,
        difference,
        percentChange,
        items: categoryItems
      });
    });
    
    // Sort summaries based on the same logic used in Financials.tsx
    return summaries.sort((a, b) => {
      const categoryOrder: Record<string, number> = {
        "High School Expenditures": 1,
        "Middle/Junior High Expenditures": 2,
        "Elementary Expenditures": 3,
        "Other Financing Uses": 4
      };
      
      const orderA = categoryOrder[a.category] || 999;
      const orderB = categoryOrder[b.category] || 999;
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      if (orderA === 999 && orderB === 999) {
        return a.category.localeCompare(b.category);
      }
      
      return 0;
    });
  }, [processedItems]);

  // Calculate totals for each column
  const totalCurrentValue = processedItems.reduce((sum, row) => sum + row.currentValue, 0);
  const totalPreviousValue = processedItems.reduce((sum, row) => sum + row.previousValue, 0);
  const totalDifference = totalCurrentValue - totalPreviousValue;
  const totalPercentChange = totalPreviousValue > 0 
    ? (totalDifference / totalPreviousValue) * 100 
    : 0;

  return (
    <Box>
      {!hideTitle && (
        <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
          {title}
        </Typography>
      )}
      
      <TableContainer component={Paper} sx={{ mt: 2, mb: 4 }}>
        <Table aria-label="financial comparison table" size={size} sx={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell width={isMobile ? "20px" : "30px"} padding={isMobile ? "none" : "normal"}></TableCell>
              <TableCell width={isMobile ? "50%" : "35%"}><strong>{headers.category}</strong></TableCell>
              <TableCell align="right" width={isMobile ? "25%" : "15%"}><strong>{currentYear || 'Current'} Cost</strong></TableCell>
              <TableCell align="right" width={isMobile ? "25%" : "15%"}><strong>{previousYear || 'Previous'} Cost</strong></TableCell>
              {!isMobile && (
                <>
                  <TableCell align="right" width="15%"><strong>Change</strong></TableCell>
                  <TableCell align="right" width="15%"><strong>% Change</strong></TableCell>
                </>
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
                  <TableCell padding={isMobile ? "none" : "normal"}>
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
                  <TableCell>{summary.category}</TableCell>
                  <TableCell align="right">{formatValue(summary.currentValue)}</TableCell>
                  <TableCell align="right">{formatValue(summary.previousValue)}</TableCell>
                  {!isMobile && (
                    <>
                      <TableCell align="right" sx={{ 
                        color: summary.difference > 0 ? 'success.main' : summary.difference < 0 ? 'error.main' : 'text.primary' 
                      }}>
                        {summary.difference > 0 ? '+' : ''}{formatValue(summary.difference)}
                      </TableCell>
                      <TableCell align="right" sx={{ 
                        color: summary.percentChange > 0 ? 'success.main' : summary.percentChange < 0 ? 'error.main' : 'text.primary' 
                      }}>
                        {summary.difference === 0 ? '0%' : (
                          <>
                            {summary.percentChange > 0 ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
                            {Math.abs(summary.percentChange).toFixed(1)}%
                          </>
                        )}
                      </TableCell>
                    </>
                  )}
                </TableRow>
                
                {/* Collapsible detail rows */}
                <TableRow>
                  <TableCell style={{ padding: 0 }} colSpan={isMobile ? 4 : 6}>
                    <Collapse in={expandedCategories[summary.category]} timeout="auto" unmountOnExit>
                      <Box sx={{ px: 0 }}>
                        <Table size={size} aria-label={`${summary.category} details`} sx={{ tableLayout: 'fixed' }}>
                          <TableBody>
                            {/* Group items by subcategory */}
                            {(() => {
                              // Collect all subcategories for this category
                              const subCategories = Array.from(
                                new Set(summary.items.map(item => item.subCategory))
                              ).sort();
                              
                              return subCategories.map(subCategory => {
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
                                        <Box sx={{ pl: isMobile ? 1 : 2 }}>{subCategory}</Box>
                                      </TableCell>
                                      <TableCell align="right" width={isMobile ? "25%" : "15%"}>{formatValue(subCategoryCurrentTotal)}</TableCell>
                                      <TableCell align="right" width={isMobile ? "25%" : "15%"}>{formatValue(subCategoryPreviousTotal)}</TableCell>
                                      {!isMobile && (
                                        <>
                                          <TableCell align="right" width="15%" sx={{ 
                                            color: subCategoryDifference > 0 ? 'success.main' : subCategoryDifference < 0 ? 'error.main' : 'text.primary' 
                                          }}>
                                            {subCategoryDifference > 0 ? '+' : ''}{formatValue(subCategoryDifference)}
                                          </TableCell>
                                          <TableCell align="right" width="15%" sx={{ 
                                            color: subCategoryPercentChange > 0 ? 'success.main' : subCategoryPercentChange < 0 ? 'error.main' : 'text.primary' 
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
                                    </TableRow>
                                    
                                    {/* Individual items within this subcategory - collapsible */}
                                    <TableRow>
                                      <TableCell style={{ padding: 0 }} colSpan={isMobile ? 4 : 6}>
                                        <Collapse in={expandedSubCategories[subCategoryKey]} timeout="auto" unmountOnExit>
                                          <Box>
                                            <Table size={size} sx={{ tableLayout: 'fixed' }}>
                                              <TableBody>
                                                {subCategoryItems.map(row => (
                                                  <TableRow key={`${row.category}-${row.subCategory}-${row.name}`}>
                                                    <TableCell width={isMobile ? "20px" : "30px"} padding={isMobile ? "none" : "normal"}></TableCell>
                                                    <TableCell width={isMobile ? "50%" : "35%"}>
                                                      <Box sx={{ pl: isMobile ? 2 : 4 }}>{row.name}</Box>
                                                    </TableCell>
                                                    <TableCell align="right" width={isMobile ? "25%" : "15%"}>{formatValue(row.currentValue)}</TableCell>
                                                    <TableCell align="right" width={isMobile ? "25%" : "15%"}>{formatValue(row.previousValue)}</TableCell>
                                                    {!isMobile && (
                                                      <>
                                                        <TableCell align="right" width="15%" sx={{ 
                                                          color: (row.difference ?? 0) > 0 ? 'success.main' : (row.difference ?? 0) < 0 ? 'error.main' : 'text.primary' 
                                                        }}>
                                                          {(row.difference ?? 0) > 0 ? '+' : ''}{formatValue(row.difference ?? 0)}
                                                        </TableCell>
                                                        <TableCell align="right" width="15%" sx={{ 
                                                          color: (row.percentChange ?? 0) > 0 ? 'success.main' : (row.percentChange ?? 0) < 0 ? 'error.main' : 'text.primary' 
                                                        }}>
                                                          {(row.difference ?? 0) === 0 ? '0%' : (
                                                            <>
                                                              {(row.percentChange ?? 0) > 0 ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
                                                              {Math.abs(row.percentChange ?? 0).toFixed(1)}%
                                                            </>
                                                          )}
                                                        </TableCell>
                                                      </>
                                                    )}
                                                  </TableRow>
                                                ))}
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
              <TableCell>Total</TableCell>
              <TableCell align="right">{formatValue(totalCurrentValue)}</TableCell>
              <TableCell align="right">{formatValue(totalPreviousValue)}</TableCell>
              {!isMobile && (
                <>
                  <TableCell align="right" sx={{ 
                    color: totalDifference > 0 ? 'success.main' : totalDifference < 0 ? 'error.main' : 'text.primary' 
                  }}>
                    {totalDifference > 0 ? '+' : ''}{formatValue(totalDifference)}
                  </TableCell>
                  <TableCell align="right" sx={{ 
                    color: totalPercentChange > 0 ? 'success.main' : totalPercentChange < 0 ? 'error.main' : 'text.primary' 
                  }}>
                    {totalDifference === 0 ? '0%' : (
                      <>
                        {totalPercentChange > 0 ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
                        {Math.abs(totalPercentChange).toFixed(1)}%
                      </>
                    )}
                  </TableCell>
                </>
              )}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default FinancialComparisonTable; 