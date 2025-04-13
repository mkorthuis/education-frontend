import React, { useMemo, useState } from 'react';
import { Typography, Card, CardContent, Box, Divider, Button, useTheme, useMediaQuery } from '@mui/material';
import { useAppSelector } from '@/store/hooks';
import { selectLatestStateExpenditureRollupDetails, selectStateExpenditureRollupsByYear, selectTotalExpendituresByYear } from '@/store/slices/financeSlice';
import { formatCompactNumber } from '@/utils/formatting';
import { formatFiscalYear } from '../../../utils/financialDataProcessing';
import { FISCAL_YEAR } from '@/utils/environment';
import InstructionalVsSupportTrendChart from './InstructionalVsSupportTrendChart';
import CostBreakdownTable from './CostBreakdownTable';

interface ExpendituresCardProps {
  className?: string;
  districtName?: string;
}

const ExpendituresCard: React.FC<ExpendituresCardProps> = ({ className, districtName = 'District' }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showTrendChart, setShowTrendChart] = useState(false);
  const [showCostTable, setShowCostTable] = useState(false);

  const TEN_YEARS_AGO = parseInt(FISCAL_YEAR) - 10;
  // Get the total expenditures for the current fiscal year
  const totalCurrentExpenditures = useAppSelector(state => selectTotalExpendituresByYear(state, FISCAL_YEAR));
  const totalPreviousExpenditures = useAppSelector(state => selectTotalExpendituresByYear(state, (parseInt(FISCAL_YEAR) - 1).toString()));
  const latestStateExpenditureRollupData = useAppSelector(selectLatestStateExpenditureRollupDetails);
  const previousStateExpenditureRollupData = useAppSelector(state => selectStateExpenditureRollupsByYear(state, TEN_YEARS_AGO));
  
  // Calculate year-over-year percentage change
  const percentageChange = totalPreviousExpenditures 
    ? ((totalCurrentExpenditures - totalPreviousExpenditures) / totalPreviousExpenditures) * 100
    : 0;
  
  // Determine if it's an increase or decrease
  const changeDirection = percentageChange >= 0 ? 'Increased' : 'Decreased';
  
  // Get data for the past 10 years
  const tenYearsAgo = TEN_YEARS_AGO;
  
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
  
  // Calculate state average change over 10 years
  const stateComparisonText = useMemo(() => {
    if (!latestStateExpenditureRollupData?.total || !previousStateExpenditureRollupData?.total || 
        !tenYearChange || latestStateExpenditureRollupData.total === 0 || previousStateExpenditureRollupData.total === 0) {
      return null;
    }
    
    // Calculate state average annual change over 10 years
    const stateAverageAnnualChange = (Math.pow(
      latestStateExpenditureRollupData.total / previousStateExpenditureRollupData.total, 
      1/10
    ) - 1) * 100;
    
    // Compare district growth to state growth
    const comparison = tenYearChange.averageAnnualChange > stateAverageAnnualChange ? 'Faster' : 'Slower';
    const districtRate = Math.abs(tenYearChange.averageAnnualChange).toFixed(1);
    const stateRate = Math.abs(stateAverageAnnualChange).toFixed(1);
    
    return {
      comparison,
      isFaster: comparison === 'Faster',
      districtRate,
      stateRate
    };
  }, [latestStateExpenditureRollupData, previousStateExpenditureRollupData, tenYearChange]);

  // Handle chart toggle for mobile view
  const handleToggleChart = () => {
    setShowTrendChart((prevState: boolean) => {
      return !prevState;
    });
  };

  // Handle cost table toggle for mobile view
  const handleToggleCostTable = () => {
    setShowCostTable((prevState: boolean) => {
      return !prevState;
    });
  };

  // Common button style to ensure consistent width
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
      }} 
      className={className}
    >
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
            {' Last Year ('}
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
          {stateComparisonText && (
            <>
              <Typography component="li" variant="body2">
                Over 10 Years, Costs{' '}
                <Typography
                  component="span"
                  variant="body2"
                  sx={{ 
                    fontWeight: 'bold',
                    color: stateComparisonText.isFaster ? 'error.main' : 'success.main' 
                  }}
                >
                  Increased {stateComparisonText.comparison}
                </Typography>
                {' than the State Average.'}
              </Typography>
              <Typography component="li" sx={{ ml: 3, listStyleType: 'circle' }}>
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                  District Annual Increase of {stateComparisonText.districtRate}% vs. State Avg. {stateComparisonText.stateRate}%.
                </Typography>
              </Typography>
            </>
          )}
        </Box>
        
        {!isMobile && <Divider sx={{ my: 2 }} />}
        
        <Box sx={{ mt: 2 }}>
          {isMobile ? (
            <>
              <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 1 }}>
                {!showTrendChart ?(
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={handleToggleChart}
                    sx={toggleButtonStyle}
                  >
                    Instructional & Support Costs Chart
                  </Button>) : (<InstructionalVsSupportTrendChart />)
                }

                {!showCostTable ?(
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={handleToggleCostTable}
                  sx={toggleButtonStyle}
                >
                  District Costs Breakdown Table'
                </Button>) : (<CostBreakdownTable districtName={districtName} />)
                }
              </Box>
            </>
          ) : (
            <>
              <InstructionalVsSupportTrendChart />
              <Divider sx={{ my: 2 }} />
              <CostBreakdownTable districtName={districtName} />
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ExpendituresCard;