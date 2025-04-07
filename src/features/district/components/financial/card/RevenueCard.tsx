import React, { useMemo } from 'react';
import { Typography, Card, CardContent, Box } from '@mui/material';
import { useAppSelector } from '@/store/hooks';
import { selectTotalRevenuesByYear, selectFinancialReports, ProcessedReport, Revenue } from '@/store/slices/financeSlice';
import { formatCompactNumber } from '@/utils/formatting';
import { formatFiscalYear } from '../../../utils/financialDataProcessing';
import { FISCAL_YEAR } from '@/utils/environment';

interface RevenueCardProps {
  className?: string;
}

const RevenueCard: React.FC<RevenueCardProps> = ({ className }) => {
  // Get the total revenues for the current fiscal year
  const totalCurrentRevenues = useAppSelector(state => selectTotalRevenuesByYear(state, FISCAL_YEAR));
  const totalPreviousRevenues = useAppSelector(state => selectTotalRevenuesByYear(state, (parseInt(FISCAL_YEAR) - 1).toString()));
  
  // Calculate year-over-year percentage change
  const percentageChange = totalPreviousRevenues 
    ? ((totalCurrentRevenues - totalPreviousRevenues) / totalPreviousRevenues) * 100
    : 0;
  
  // Determine if it's an increase or decrease
  const changeDirection = percentageChange >= 0 ? 'Increased' : 'Decreased';
  
  // Get revenues for 10 years ago
  const currentYear = parseInt(FISCAL_YEAR);
  const tenYearsAgo = currentYear - 10;
  const revenuesTenYearsAgo = useAppSelector(state => 
    selectTotalRevenuesByYear(state, tenYearsAgo.toString())
  );
  
  // Calculate 10-year average change
  const tenYearChange = useMemo(() => {
    if (!revenuesTenYearsAgo || revenuesTenYearsAgo === 0) return null;
    
    // Calculate total percentage change over 10 years
    const totalPercentChange = ((totalCurrentRevenues - revenuesTenYearsAgo) / revenuesTenYearsAgo) * 100;
    
    // Calculate average annual percentage change
    // Using the formula: (final/initial)^(1/n) - 1 where n is the number of years
    const averageAnnualChange = (Math.pow(totalCurrentRevenues / revenuesTenYearsAgo, 1/10) - 1) * 100;
    
    return {
      totalPercentChange,
      averageAnnualChange,
      direction: averageAnnualChange >= 0 ? 'Increased' : 'Decreased',
      tenYearValue: revenuesTenYearsAgo
    };
  }, [totalCurrentRevenues, revenuesTenYearsAgo]);
  
  // Get all financial reports
  const financialReports = useAppSelector(state => selectFinancialReports(state));

  // Get current year and 10 years ago processed reports
  const currentYearReport = financialReports[FISCAL_YEAR];
  const tenYearsAgoReport = financialReports[tenYearsAgo.toString()];

  // Calculate local funding proportion for each year
  const calculateLocalFundingProportion = (report: ProcessedReport | undefined): number | null => {
    if (!report) return null;
    
    // Get total revenue
    const totalRevenue = report.revenues.reduce((sum: number, rev: Revenue) => sum + rev.value, 0);
    
    // Get local revenue (filter by category)
    const localRevenue = report.revenues
      .filter((rev: Revenue) => 
        rev.entry_type.category?.super_category?.name === "Revenue from Local Sources"
      )
      .reduce((sum: number, rev: Revenue) => sum + rev.value, 0);
    
    // Calculate proportion
    return totalRevenue > 0 ? (localRevenue / totalRevenue) * 100 : 0;
  };

  const currentLocalProportion = calculateLocalFundingProportion(currentYearReport);
  const historicalLocalProportion = calculateLocalFundingProportion(tenYearsAgoReport);

  // Determine if local funding proportion has increased or decreased
  const hasIncreased = (currentLocalProportion ?? 0) > (historicalLocalProportion ?? 0);
  const localFundingChangeDirection = hasIncreased ? "Increased" : "Decreased";
  
  // Calculate percentage change in local funding proportion
  const localFundingPercentageChange = historicalLocalProportion && historicalLocalProportion > 0
    ? ((currentLocalProportion ?? 0) - (historicalLocalProportion ?? 0)) / historicalLocalProportion * 100
    : 0;
  
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
            {' Year over Year ('}
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
      </CardContent>
    </Card>
  );
};

export default RevenueCard;