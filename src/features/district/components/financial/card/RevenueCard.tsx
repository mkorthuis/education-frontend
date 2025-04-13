import React, { useMemo, useState } from 'react';
import { Typography, Card, CardContent, Box, useMediaQuery, useTheme, Button, Divider } from '@mui/material';
import { useAppSelector } from '@/store/hooks';
import { 
  selectTotalRevenuesByYear, 
  selectFinancialReports, 
  ProcessedReport, 
  Revenue, 
  selectStateRevenueAllData,
  selectRevenueEntryTypes,
  selectEntryTypesLoaded
} from '@/store/slices/financeSlice';
import { formatCompactNumber } from '@/utils/formatting';
import { formatFiscalYear } from '../../../utils/financialDataProcessing';
import { FISCAL_YEAR } from '@/utils/environment';
import RevenuePieChart from './RevenuePieChart';
import RevenueFundingComparisonTable from './RevenueFundingComparisonTable';
import { selectCurrentDistrict } from '@/store/slices/locationSlice';

interface RevenueCardProps {
  className?: string;
}

// Helper function to calculate local funding proportion
const calculateLocalFundingProportion = (report?: ProcessedReport): number | null => {
  if (!report) return null;
  
  const totalRevenue = report.revenues.reduce((sum: number, rev: Revenue) => sum + rev.value, 0);
  
  const localRevenue = report.revenues
    .filter((rev: Revenue) => 
      rev.entry_type.category?.super_category?.name === "Revenue from Local Sources"
    )
    .reduce((sum: number, rev: Revenue) => sum + rev.value, 0);
  
  return totalRevenue > 0 ? (localRevenue / totalRevenue) * 100 : 0;
};

// Helper function to categorize revenues by source
const categorizeRevenuesBySource = (revenues: Revenue[]) => {
  const data = {
    local: 0,
    state: 0,
    federal: 0,
    other: 0
  };
  
  revenues.forEach((rev: Revenue) => {
    const category = rev.entry_type.category?.super_category?.name || "Uncategorized";
    
    if (category.includes("Local")) {
      data.local += rev.value;
    } else if (category.includes("State")) {
      data.state += rev.value;
    } else if (category.includes("Federal")) {
      data.federal += rev.value;
    } else {
      data.other += rev.value;
    }
  });
  
  return data;
};

const RevenueCard: React.FC<RevenueCardProps> = ({ className }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showPieChart, setShowPieChart] = useState(false);
  const [showFundingTable, setShowFundingTable] = useState(false);
  
  const district = useAppSelector(selectCurrentDistrict);
  const financialReports = useAppSelector(selectFinancialReports);
  const entryTypesLoaded = useAppSelector(selectEntryTypesLoaded);
  const revenueEntryTypes = useAppSelector(selectRevenueEntryTypes);
  const stateRevenueAllData = useAppSelector(selectStateRevenueAllData);
  
  // Get revenue data for current year and previous years
  const currentYear = parseInt(FISCAL_YEAR);
  const previousYear = (currentYear - 1).toString();
  const tenYearsAgo = (currentYear - 10).toString();
  
  const totalCurrentRevenues = useAppSelector(state => selectTotalRevenuesByYear(state, FISCAL_YEAR));
  const totalPreviousRevenues = useAppSelector(state => selectTotalRevenuesByYear(state, previousYear));
  const revenuesTenYearsAgo = useAppSelector(state => selectTotalRevenuesByYear(state, tenYearsAgo));
  
  // Calculate year-over-year percentage change
  const percentageChange = useMemo(() => {
    if (!totalPreviousRevenues) return 0;
    return ((totalCurrentRevenues - totalPreviousRevenues) / totalPreviousRevenues) * 100;
  }, [totalCurrentRevenues, totalPreviousRevenues]);
  
  const changeDirection = percentageChange >= 0 ? 'Increased' : 'Decreased';
  
  // Calculate 10-year average change
  const tenYearChange = useMemo(() => {
    if (!revenuesTenYearsAgo || revenuesTenYearsAgo === 0) return null;
    
    // Calculate average annual percentage change using CAGR formula
    const averageAnnualChange = (Math.pow(totalCurrentRevenues / revenuesTenYearsAgo, 1/10) - 1) * 100;
    
    return {
      averageAnnualChange,
      direction: averageAnnualChange >= 0 ? 'Increased' : 'Decreased',
      tenYearValue: revenuesTenYearsAgo
    };
  }, [totalCurrentRevenues, revenuesTenYearsAgo]);
  
  // Get current year and 10 years ago processed reports
  const currentYearReport = financialReports[FISCAL_YEAR];
  const tenYearsAgoReport = financialReports[tenYearsAgo];

  // Calculate local funding proportions and changes
  const currentLocalProportion = useMemo(
    () => calculateLocalFundingProportion(currentYearReport), 
    [currentYearReport]
  );
  
  const historicalLocalProportion = useMemo(
    () => calculateLocalFundingProportion(tenYearsAgoReport),
    [tenYearsAgoReport]
  );

  const localFundingPercentageChange = (currentLocalProportion ?? 0) - (historicalLocalProportion ?? 0);
  const hasIncreased = localFundingPercentageChange > 0;
  const localFundingChangeDirection = hasIncreased ? "Increased" : "Decreased";
  
  // Process district revenue data for the funding comparison table
  const districtFundingData = useMemo(() => {
    if (!currentYearReport?.revenues?.length) return null;
    return categorizeRevenuesBySource(currentYearReport.revenues);
  }, [currentYearReport]);
  
  // Process state revenue data for funding comparison
  const stateFundingData = useMemo(() => {
    // If we don't have state revenue data or entry types aren't loaded, return null
    if (!stateRevenueAllData?.length || !entryTypesLoaded || !revenueEntryTypes.length) {
      return null;
    }
    
    // Create a map to track entry type categories
    const entryTypeCategories = new Map<number, string>();
    
    // Create a mapping of entry type IDs to their categories
    revenueEntryTypes.forEach(entryType => {
      const superCategoryName = entryType.category?.super_category?.name || "Uncategorized";
      entryTypeCategories.set(entryType.id, superCategoryName);
    });
    
    // Initialize the state data
    const stateData = {
      local: 0,
      state: 0,
      federal: 0,
      other: 0
    };
    
    // Filter to current fiscal year if available, or latest year
    const currentYearData = stateRevenueAllData.filter(
      item => item.year === parseInt(FISCAL_YEAR)
    );
    
    // Use current year data if available, otherwise use all data
    const dataToProcess = currentYearData.length > 0 ? currentYearData : stateRevenueAllData;
    
    dataToProcess.forEach(item => {
      const categoryName = entryTypeCategories.get(item.entry_type_id) || "Uncategorized";
      
      if (categoryName.includes("Local")) {
        stateData.local += item.value;
      } else if (categoryName.includes("State")) {
        stateData.state += item.value;
      } else if (categoryName.includes("Federal")) {
        stateData.federal += item.value;
      } else {
        stateData.other += item.value;
      }
    });
    
    return stateData;
  }, [stateRevenueAllData, entryTypesLoaded, revenueEntryTypes]);
  
  // Determine if we should display N/A for state data
  const showStateNA = useMemo(() => {
    if (!stateFundingData) return true;
    
    return (
      stateFundingData.local === 0 && 
      stateFundingData.state === 0 && 
      stateFundingData.federal === 0 && 
      stateFundingData.other === 0
    );
  }, [stateFundingData]);
  
  // Handle toggle for pie chart and funding table in mobile view
  const handleTogglePieChart = () => {
    setShowPieChart(prev => !prev);
  };
  
  const handleToggleFundingTable = () => {
    setShowFundingTable(prev => !prev);
  };
  
  // Common button style 
  const toggleButtonStyle = { 
    minWidth: 320, 
    mb: 1,
    backgroundColor: 'grey.100',
    color: 'text.primary',
    borderColor: 'divider',
    '&:hover': {
      backgroundColor: 'grey.300',
    }
  };
  
  return (
    <Card 
      sx={{ 
        flex: 1,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 3
      }} 
      className={className}
    >
      <CardContent>
        <Typography variant="h6">
          {formatFiscalYear(FISCAL_YEAR)} Revenue: {formatCompactNumber(totalCurrentRevenues || 0)}
        </Typography>
        
        <Box component="ul" sx={{ mt: 1, pl: 2 }}>
          <Typography component="li" variant="body2">
            <Typography
              component="span"
              variant="body2"
              sx={{ 
                fontWeight: 'bold',
                color: percentageChange > 0 ? 'success.main' : 'error.main'
              }}
            >
              {changeDirection} {Math.abs(percentageChange).toFixed(1)}%
            </Typography>
            {' Last Year ('}
            {formatCompactNumber(totalPreviousRevenues || 0)}
            {').'}
          </Typography>
          
          {tenYearChange && (
            <Typography component="li" variant="body2">
              <Typography
                component="span"
                variant="body2"
                sx={{ 
                  fontWeight: 'bold',
                  color: tenYearChange.averageAnnualChange > 0 ? 'success.main' : 'error.main' 
                }}
              >
                {tenYearChange.direction} {Math.abs(tenYearChange.averageAnnualChange).toFixed(1)}%
              </Typography>
              {' Annually Over 10 Years ('}
              {formatCompactNumber(tenYearChange.tenYearValue)}
              {' → '}
              {formatCompactNumber(totalCurrentRevenues || 0)}
              {').'}
            </Typography>
          )}
          
          <Typography component="li" variant="body2">
            Over 10 years, Local Funding {" "}
            <Typography 
              component="span" 
              variant="body2" 
              sx={{ 
                fontWeight: 'bold',
                color: hasIncreased ? 'error.main': 'success.main'
              }}
            >
              {localFundingChangeDirection} {Math.abs(localFundingPercentageChange).toFixed(1)}%
            </Typography>
            {" "}as % of Revenue.
          </Typography>

          <Typography component="li" sx={{ ml: 3, listStyleType: 'circle' }}>
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              Local Funding: {" "}
              {(currentLocalProportion ?? 0).toFixed(1)}%
              {" Today vs "}
              {(historicalLocalProportion ?? 0).toFixed(1)}%
              {" Ten Years Ago."}
            </Typography>
          </Typography>
        </Box>
        
        {!isMobile && <Divider sx={{ my: 1 }} />}
        
        <Box sx={{ mt: 2 }}>
          {isMobile ? (
            <>
              <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 1 }}>
              {!showPieChart ? (
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={handleTogglePieChart}
                    sx={toggleButtonStyle}
                  >
                    See Funding Breakdown
                  </Button>
                ) : (<RevenuePieChart />)
                }

                {!showFundingTable ? (
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={handleToggleFundingTable}
                    sx={toggleButtonStyle}
                  >
                    See State Comparison
                  </Button>
                ) : (<RevenueFundingComparisonTable 
                    districtData={districtFundingData}
                    stateData={stateFundingData}
                    showStateNA={showStateNA}
                    districtName={district?.name}
                  />)
                }
              </Box>
            </>
          ) : (
            <>
              <RevenuePieChart />
              
              <Divider sx={{ my: 2 }} />
              
              <RevenueFundingComparisonTable 
                districtData={districtFundingData}
                stateData={stateFundingData}
                showStateNA={showStateNA}
                districtName={district?.name}
              />
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default RevenueCard;