import React, { useMemo } from 'react';
import { Typography, Card, CardContent, Box } from '@mui/material';
import { useAppSelector } from '@/store/hooks';
import { selectTotalExpendituresByYear } from '@/store/slices/financeSlice';
import { formatCompactNumber } from '@/utils/formatting';
import { formatFiscalYear } from '../../../utils/financialDataProcessing';
import { FISCAL_YEAR } from '@/utils/environment';

interface ExpendituresCardProps {
  className?: string;
}

const ExpendituresCard: React.FC<ExpendituresCardProps> = ({ className }) => {
  // Get the total expenditures for the current fiscal year
  const totalCurrentExpenditures = useAppSelector(state => selectTotalExpendituresByYear(state, FISCAL_YEAR));
  const totalPreviousExpenditures = useAppSelector(state => selectTotalExpendituresByYear(state, (parseInt(FISCAL_YEAR) - 1).toString()));
  
  // Calculate year-over-year percentage change
  const percentageChange = totalPreviousExpenditures 
    ? ((totalCurrentExpenditures - totalPreviousExpenditures) / totalPreviousExpenditures) * 100
    : 0;
  
  // Determine if it's an increase or decrease
  const changeDirection = percentageChange >= 0 ? 'Increased' : 'Decreased';
  
  // Get data for the past 10 years
  const currentYear = parseInt(FISCAL_YEAR);
  const tenYearsAgo = currentYear - 10;
  
  // Get expenditures for 10 years ago
  const expendituresTenYearsAgo = useAppSelector(state => 
    selectTotalExpendituresByYear(state, tenYearsAgo.toString())
  );
  
  // Calculate 10-year average change
  const tenYearChange = useMemo(() => {
    if (!expendituresTenYearsAgo || expendituresTenYearsAgo === 0) return null;
    
    // Calculate total percentage change over 10 years
    const totalPercentChange = ((totalCurrentExpenditures - expendituresTenYearsAgo) / expendituresTenYearsAgo) * 100;
    
    // Calculate average annual percentage change
    // Using the formula: (final/initial)^(1/n) - 1 where n is the number of years
    const averageAnnualChange = (Math.pow(totalCurrentExpenditures / expendituresTenYearsAgo, 1/10) - 1) * 100;
    
    return {
      totalPercentChange,
      averageAnnualChange,
      direction: averageAnnualChange >= 0 ? 'Increased' : 'Decreased',
      tenYearValue: expendituresTenYearsAgo
    };
  }, [totalCurrentExpenditures, expendituresTenYearsAgo]);
  
  return (
    <Card sx={{ flex: 1 }} className={className}>
      <CardContent>
        <Typography variant="h6">
          {formatFiscalYear(FISCAL_YEAR)} Expenditures: {formatCompactNumber(totalCurrentExpenditures || 0)}
        </Typography>
        
        <Box component="ul" sx={{ mt: 1, pl: 2 }}>
          <Typography component="li" variant="body2">
            <Typography
              component="span"
              variant="body2"
              sx={{ 
                fontWeight: 'bold',
                color: percentageChange > 0 ? 'error.main' : 'success.main' 
              }}
            >
              {changeDirection} {Math.abs(percentageChange).toFixed(1)}%
            </Typography>
            {' Year over Year ('}
            {formatCompactNumber(totalPreviousExpenditures || 0)}
            {').'}
          </Typography>
          
          {tenYearChange && (
            <Typography component="li" variant="body2">
              <Typography
                component="span"
                variant="body2"
                sx={{ 
                  fontWeight: 'bold',
                  color: tenYearChange.averageAnnualChange > 0 ? 'error.main' : 'success.main' 
                }}
              >
                {tenYearChange.direction} {Math.abs(tenYearChange.averageAnnualChange).toFixed(1)}%
              </Typography>
              {' Annually Over 10 Years ('}
              {formatCompactNumber(tenYearChange.tenYearValue)}
              {' → '}
              {formatCompactNumber(totalCurrentExpenditures || 0)}
              {').'}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ExpendituresCard;