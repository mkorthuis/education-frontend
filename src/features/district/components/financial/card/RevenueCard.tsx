import React, { useMemo } from 'react';
import { Typography, Card, CardContent, Box } from '@mui/material';
import { useAppSelector } from '@/store/hooks';
import { selectTotalRevenuesByYear } from '@/store/slices/financeSlice';
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
  
  return (
    <Card sx={{ flex: 1 }} className={className}>
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
        </Box>
      </CardContent>
    </Card>
  );
};

export default RevenueCard;