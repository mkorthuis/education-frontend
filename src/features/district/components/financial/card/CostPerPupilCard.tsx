import React, { useMemo, useCallback, useState } from 'react';
import { Typography, Box, Card, CardContent, useMediaQuery, useTheme, Button, Divider, Tooltip, Chip } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useAppSelector } from '@/store/hooks';
import {
  selectLatestPerPupilExpenditureDetails,
  selectLatestStatePerPupilExpenditureDetails,
  selectPerPupilExpenditureByYear,
  selectStatePerPupilExpenditureByYear,
  selectAdjustForInflation
} from '@/store/slices/financeSlice';
import { formatCompactNumber } from '@/utils/formatting';
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';
import PerPupilExpenditureTrendChart from './PerPupilExpenditureTrendChart';
import PerPupilCostBreakdownTable from './PerPupilCostBreakdownTable';
import { calculateInflationAdjustedAmount } from '@/utils/calculations';
import { FISCAL_YEAR } from '@/utils/environment';

interface CostPerPupilCardProps {
  className?: string;
}

// Memoized selectors
const selectPerPupilExpenditureData = createSelector(
  [
    (state: RootState) => state,
    selectLatestPerPupilExpenditureDetails
  ],
  (state, latestDetails) => {
    if (!latestDetails) return { current: null, previousYear: null, tenYearsAgo: null };
    
    return {
      current: latestDetails,
      previousYear: selectPerPupilExpenditureByYear(state, latestDetails.year - 1),
      tenYearsAgo: selectPerPupilExpenditureByYear(state, latestDetails.year - 10)
    };
  }
);

const selectStatePerPupilExpenditureData = createSelector(
  [
    (state: RootState) => state,
    selectLatestStatePerPupilExpenditureDetails
  ],
  (state, latestDetails) => {
    if (!latestDetails) return { current: null, tenYearsAgo: null };
    
    return {
      current: latestDetails,
      tenYearsAgo: selectStatePerPupilExpenditureByYear(state, latestDetails.year - 10)
    };
  }
);

const CostPerPupilCard: React.FC<CostPerPupilCardProps> = ({ className }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showTrendChart, setShowTrendChart] = useState(false);
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);
  
  // Get inflation adjustment state from Redux
  const adjustForInflation = useAppSelector(selectAdjustForInflation);
  
  // Finance data from Redux
  const latestPerPupilExpenditureDetails = useAppSelector(selectLatestPerPupilExpenditureDetails);
  const latestStatePerPupilExpenditureDetails = useAppSelector(selectLatestStatePerPupilExpenditureDetails);
  
  // Get the per pupil expenditure data using memoized selector
  const perPupilExpenditureData = useAppSelector(selectPerPupilExpenditureData);
  
  // Get the state per pupil expenditure data using memoized selector
  const statePerPupilExpenditureData = useAppSelector(selectStatePerPupilExpenditureData);
  
  // Helper to calculate change between two values, accounting for inflation
  const calculateChange = useCallback((currentValue: number, previousValue: number, previousYear: number) => {
    if (!previousValue) return null;
    
    // If adjusting for inflation, adjust previousValue to current dollars
    const adjustedPreviousValue = adjustForInflation 
      ? calculateInflationAdjustedAmount(
          previousValue, 
          previousYear, 
          latestPerPupilExpenditureDetails?.year || parseInt(FISCAL_YEAR)
        )
      : previousValue;
    
    const difference = currentValue - adjustedPreviousValue;
    const percentChange = (difference / adjustedPreviousValue) * 100;
    
    return {
      difference,
      percentChange,
      previousValue: adjustedPreviousValue,
      originalPreviousValue: previousValue
    };
  }, [adjustForInflation, latestPerPupilExpenditureDetails]);
  
  // Calculate year-over-year change for district per pupil expenditure
  const perPupilYearOverYearChange = useMemo(() => {
    const { current, previousYear } = perPupilExpenditureData;
    if (!current || !previousYear) return null;
    
    return calculateChange(current.total, previousYear.total, previousYear.year);
  }, [perPupilExpenditureData, calculateChange]);
  
  // Calculate 10-year change for district per pupil expenditure
  const perPupilTenYearChange = useMemo(() => {
    const { current, tenYearsAgo } = perPupilExpenditureData;
    if (!current || !tenYearsAgo) return null;
    
    return calculateChange(current.total, tenYearsAgo.total, tenYearsAgo.year);
  }, [perPupilExpenditureData, calculateChange]);
  
  // Calculate 10-year change for state average per pupil expenditure
  const statePerPupilTenYearChange = useMemo(() => {
    const { current, tenYearsAgo } = statePerPupilExpenditureData;
    if (!current || !tenYearsAgo) return null;
    
    return calculateChange(current.total, tenYearsAgo.total, tenYearsAgo.year);
  }, [statePerPupilExpenditureData, calculateChange]);
  
  // Calculate percentage difference between district and state values
  const calculateDifference = useCallback((districtValue: number, stateValue: number): number => {
    if (!stateValue) return 0;
    return ((districtValue - stateValue) / stateValue) * 100;
  }, []);

  // Handle chart toggle for mobile view
  const handleToggleChart = () => {
    setShowTrendChart(prevState => !prevState);
  };

  // Handle cost breakdown toggle for mobile view
  const handleToggleCostBreakdown = () => {
    setShowCostBreakdown(prevState => !prevState);
  };

  // Common button style to ensure consistent width
  const toggleButtonStyle = { 
    minWidth: 320,
    backgroundColor: 'grey.100',
    color: 'text.primary',
    borderColor: 'divider',
    '&:hover': {
      backgroundColor: 'grey.300',
    }
  };

  // Render Per Pupil Cost details
  const renderPerPupilDetails = () => {
    if (!latestPerPupilExpenditureDetails || !latestStatePerPupilExpenditureDetails) return null;
    
    return (
      <Box>
        <Box component="ul" sx={{ mt: 1, pl: 2 }}>
          {/* Comparison to state average */}
          <Typography component="li" variant="body2">
            <Typography
              component="span"
              variant="body2"
              sx={{ 
                fontWeight: 'bold',
                color: latestPerPupilExpenditureDetails.total > latestStatePerPupilExpenditureDetails.total 
                  ? 'error.main' 
                  : 'success.main' 
              }}
            >
              {Math.abs(calculateDifference(
                latestPerPupilExpenditureDetails.total, 
                latestStatePerPupilExpenditureDetails.total
              )).toFixed(1)}%
              {latestPerPupilExpenditureDetails.total > latestStatePerPupilExpenditureDetails.total 
                ? ' Higher' 
                : ' Lower'}
            </Typography>
            {' than the State\'s '}
            {formatCompactNumber(latestStatePerPupilExpenditureDetails.total)}
            {' Average'}
          </Typography>
          
          {/* Year over year change */}
          {perPupilYearOverYearChange && (
            <Typography component="li" variant="body2">
              <Typography
                component="span"
                variant="body2"
                sx={{ 
                  fontWeight: 'bold',
                  color: perPupilYearOverYearChange.difference > 0 ? 'error.main' : 'success.main' 
                }}
              >
                {perPupilYearOverYearChange.difference > 0 ? 'Increased' : 'Decreased'} {Math.abs(perPupilYearOverYearChange.percentChange).toFixed(1)}%
              </Typography>
              {' Year over Year ('}
              {formatCompactNumber(perPupilYearOverYearChange.previousValue)}
              {').'}
            </Typography>
          )}
          
          {/* 10-year changes */}
          {renderTenYearComparison()}
        </Box>
      </Box>
    );
  };
  
  // Render 10-year comparison
  const renderTenYearComparison = () => {
    if (!perPupilTenYearChange || !statePerPupilTenYearChange) return null;
    
    return (
      <>
        <Typography component="li" variant="body2">
          Over 10 Years, it {' '}
          <Typography
            component="span"
            variant="body2"
            sx={{ 
              fontWeight: 'bold',
              color: Math.abs(perPupilTenYearChange.difference) > Math.abs(statePerPupilTenYearChange.difference) 
                ? 'error.main' 
                : 'success.main' 
            }}
          >
            {perPupilTenYearChange.difference > 0 ? 'Increased' : 'Decreased'}
            {Math.abs(perPupilTenYearChange.difference) > Math.abs(statePerPupilTenYearChange.difference) 
              ? ' Faster ' 
              : ' Slower '} 
          </Typography>
          than the State Average.
        </Typography>
        <Typography component="li" sx={{ ml: 3, listStyleType: 'circle' }}>
          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
            {formatCompactNumber(Math.abs(perPupilTenYearChange.difference))} District 
            {perPupilTenYearChange.difference > 0 ? ' Increase' : ' Decrease'} vs. {' '} 
            {formatCompactNumber(Math.abs(statePerPupilTenYearChange.difference))} State 
            {statePerPupilTenYearChange.difference > 0 ? ' Increase' : ' Decrease'}.
          </Typography>
        </Typography>
      </>
    );
  };
  
  // Render Cost Breakdown table
  const renderCostBreakdownTable = () => {
    if (!latestPerPupilExpenditureDetails || !latestStatePerPupilExpenditureDetails) return null;
    
    if (isMobile) {
      return (
        <Box sx={{ mt: 3 }}>
          {showCostBreakdown ? (
              <PerPupilCostBreakdownTable
                districtData={latestPerPupilExpenditureDetails}
                stateData={latestStatePerPupilExpenditureDetails}
              />
          ) : (
            <Box sx={{ textAlign: 'center' }}>
              <Button 
                variant="outlined" 
                size="small"
                onClick={handleToggleCostBreakdown}
                sx={toggleButtonStyle}
              >
                See Cost Breakdown By School Level
              </Button>
            </Box>
          )}
        </Box>
      );
    }
    
    return (
      <PerPupilCostBreakdownTable
        districtData={latestPerPupilExpenditureDetails}
        stateData={latestStatePerPupilExpenditureDetails}
      />
    );
  };
  
  return (
    <Card 
      sx={{ 
        flex: isMobile ? 1 : 2,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 3
      }} 
      className={className}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip 
            title={
              <Typography variant="body2">
                The Cost per Pupil represents, with certain adjustments, current expenditures for schools daily operations. Payments to other school districts and private schools are subtracted. Revenues from the sales of lunches are excluded.
                <br /><br />
                Cost per Pupil is calculated by subtracting tuition and transportation from the K-12 current operating expenditures, and then dividing by the average daily membership in attendance (ADM-A).
              </Typography>
            }
            arrow
          >
            <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'help' }}>
              <Typography variant="h6">
                Cost Per Pupil: {latestPerPupilExpenditureDetails?.total 
                  ? formatCompactNumber(latestPerPupilExpenditureDetails.total) 
                  : ''}
              </Typography>
              <HelpOutlineIcon 
                fontSize="small" 
                sx={{ ml: 1, color: 'primary.main' }} 
              />
            </Box>
          </Tooltip>
        </Box>
        
        {latestPerPupilExpenditureDetails?.total 
          ? (
            <>
              {renderPerPupilDetails()}
              
              {!isMobile && <Divider sx={{ my: 1 }} />}

              <Box sx={{ mt: 2 }}>
                {isMobile ? (
                  <>
                    {showTrendChart ? (
                        <PerPupilExpenditureTrendChart />
                    ) : (
                      <Box sx={{ textAlign: 'center' }}>
                        <Button 
                          variant="outlined" 
                          size="small"
                          onClick={handleToggleChart}
                          sx={toggleButtonStyle}
                        >
                          See Cost Per Pupil Trend Chart
                        </Button>
                      </Box>
                    )}
                  </>
                ) : (
                  <PerPupilExpenditureTrendChart />
                )}
              </Box>
              
              {!isMobile && <Divider sx={{ my: 1 }} />}
              
              {renderCostBreakdownTable()}
            </>
          ) 
          : (
            <Typography variant="body1">
              This school district does not have cost per pupil data
            </Typography>
          )
        }
      </CardContent>
    </Card>
  );
};

export default CostPerPupilCard;