import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Box, Card, CardContent, CircularProgress, Tabs, Tab, Paper, useMediaQuery, useTheme, Divider, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCurrentDistrict,
  selectLocationLoading,
  fetchAllDistrictData 
} from '@/store/slices/locationSlice';
import {
  fetchFinancialReport,
  fetchComparisonYearReport,
  fetchPerPupilExpenditure,
  fetchStatePerPupilExpenditure,
  selectTotalExpenditures,
  selectTotalRevenues,
  selectFinanceLoading,
  selectFinanceError,
  selectTotalAssetsOnly,
  selectTotalLiabilities,
  selectFinancialReport,
  selectProcessedComparisonReportByYear,
  selectTotalExpendituresByYear,
  selectTotalRevenuesByYear,
  selectTotalAssetsByYear,
  selectTotalLiabilitiesByYear,
  selectLatestPerPupilExpenditureDetails,
  selectLatestStatePerPupilExpenditureDetails,
  selectPerPupilExpenditureByYear,
  selectStatePerPupilExpenditureByYear
} from '@/store/slices/financeSlice';
import SectionTitle from '@/components/ui/SectionTitle';
import { FinancialComparisonTable } from '@/components/ui/tables';
import { formatCompactNumber } from '@/utils/formatting';
import FinancialChange from './financial/FinancialChange';
import { 
  prepareDetailedExpenditureComparisonData,
  prepareDetailedRevenueComparisonData,
  prepareDetailedAssetsComparisonData,
  prepareDetailedLiabilitiesComparisonData
} from '../utils/financialDataProcessing';
import { store } from '@/store/store';
import { FISCAL_YEAR, FISCAL_START_YEAR } from '@/utils/environment';

// Calculate default comparison year (previous fiscal year)
const DEFAULT_COMPARISON_YEAR = (parseInt(FISCAL_YEAR) - 1).toString();

// Tabs configuration
const TABS = [
  { value: 0, label: 'Overall', mobileLabel: 'Summary' },
  { value: 1, label: 'Expenditures', mobileLabel: 'Spend' },
  { value: 2, label: 'Revenues', mobileLabel: 'Income' },
  { value: 3, label: 'Balance Sheet', mobileLabel: 'Capital' }
];

/**
 * Financials component displays district financial data with yearly comparisons
 */
const Financials: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const district = useAppSelector(selectCurrentDistrict);
  const districtLoading = useAppSelector(selectLocationLoading);
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Tab state
  const [mainTabValue, setMainTabValue] = useState(0);
  
  // Combined state for all comparison years
  const [comparisonYears, setComparisonYears] = useState({
    overall: DEFAULT_COMPARISON_YEAR,
    expenditures: DEFAULT_COMPARISON_YEAR,
    revenues: DEFAULT_COMPARISON_YEAR,
    assets: DEFAULT_COMPARISON_YEAR, 
    liabilities: DEFAULT_COMPARISON_YEAR
  });
  
  // Track loading state for specific comparison year data
  const [yearsBeingLoaded, setYearsBeingLoaded] = useState<Record<string, boolean>>({});
  
  // Current year financial data
  const totalExpenditures = useAppSelector(selectTotalExpenditures);
  const totalRevenues = useAppSelector(selectTotalRevenues);
  const financeLoading = useAppSelector(selectFinanceLoading);
  const financeError = useAppSelector(selectFinanceError);
  const financialReport = useAppSelector(selectFinancialReport);
  const latestPerPupilExpenditureDetails = useAppSelector(selectLatestPerPupilExpenditureDetails);
  const latestStatePerPupilExpenditureDetails = useAppSelector(selectLatestStatePerPupilExpenditureDetails);
  
  // Get processed report from Redux
  const processedReport = useAppSelector(state => state.finance.processedReport);
  
  // Get the current year from the financial report
  const currentYear = financialReport?.doe_form?.year || null;
  
  // Format a year as fiscal year (YY/YY)
  const formatFiscalYear = useCallback((year: string | number | null): string | null => {
    if (!year) return null;
    const numYear = typeof year === 'string' ? parseInt(year) : year;
    return `${(numYear - 1).toString().slice(-2)}/${numYear.toString().slice(-2)}`;
  }, []);
  
  // Format current year as fiscal year
  const formattedCurrentYear = useMemo(() => formatFiscalYear(currentYear), [currentYear, formatFiscalYear]);
  
  // Generate an array of available years (from FISCAL_START_YEAR to current year - 1)
  const availableComparisonYears = useMemo(() => {
    const years = [];
    const endYear = currentYear ? currentYear - 1 : parseInt(DEFAULT_COMPARISON_YEAR);
    const startYear = parseInt(FISCAL_START_YEAR);
    
    for (let year = endYear; year >= startYear; year--) {
      years.push(year.toString());
    }
    
    return years;
  }, [currentYear]);
  
  // Get totals for overview
  const comparisonTotalExpenditures = useAppSelector(state => 
    selectTotalExpendituresByYear(state, comparisonYears.overall));
  const comparisonTotalRevenues = useAppSelector(state => 
    selectTotalRevenuesByYear(state, comparisonYears.overall));
  
  // Get comparison data for each tab
  const expendituresComparisonData = useAppSelector(state => 
    selectProcessedComparisonReportByYear(state, comparisonYears.expenditures));
  const revenuesComparisonData = useAppSelector(state => 
    selectProcessedComparisonReportByYear(state, comparisonYears.revenues));
  const assetsComparisonData = useAppSelector(state => 
    selectProcessedComparisonReportByYear(state, comparisonYears.assets));
  const liabilitiesComparisonData = useAppSelector(state => 
    selectProcessedComparisonReportByYear(state, comparisonYears.liabilities));
  
  // Pre-process comparison data for tables
  const expenditureComparisonItems = useMemo(() => 
    prepareDetailedExpenditureComparisonData(processedReport, expendituresComparisonData),
    [processedReport, expendituresComparisonData]
  );

  const revenueComparisonItems = useMemo(() => 
    prepareDetailedRevenueComparisonData(processedReport, revenuesComparisonData),
    [processedReport, revenuesComparisonData]
  );
  
  const assetsComparisonItems = useMemo(() => 
    prepareDetailedAssetsComparisonData(processedReport, assetsComparisonData),
    [processedReport, assetsComparisonData]
  );
  
  const liabilitiesComparisonItems = useMemo(() => 
    prepareDetailedLiabilitiesComparisonData(processedReport, liabilitiesComparisonData),
    [processedReport, liabilitiesComparisonData]
  );

  // Helper to load comparison year data
  const loadComparisonYearData = useCallback((year: string) => {
    if (!id) return;
    
    // Check if we already have data for this year or if we're already loading it
    const alreadyHaveData = !!selectProcessedComparisonReportByYear(store.getState(), year);
    if (yearsBeingLoaded[year] || alreadyHaveData) return;
    
    // Mark this year as being loaded
    setYearsBeingLoaded(prev => ({...prev, [year]: true}));
    
    // Fetch the data
    dispatch(fetchComparisonYearReport({
      districtId: id,
      year
    })).finally(() => {
      // Mark as no longer loading
      setYearsBeingLoaded(prev => ({...prev, [year]: false}));
    });
  }, [id, dispatch, yearsBeingLoaded]);
  
  // Unified comparison year change handler
  const handleComparisonYearChange = useCallback((type: keyof typeof comparisonYears, year: string) => {
    setComparisonYears(prev => ({ ...prev, [type]: year }));
    loadComparisonYearData(year);
  }, [loadComparisonYearData]);
  
  // Initial data loading
  useEffect(() => {
    if (id) {
      if (!district && !districtLoading) {
        dispatch(fetchAllDistrictData(id));
      }
      
      // Fetch current year data
      dispatch(fetchFinancialReport({ 
        districtId: id,
        includeComparisonYear: true,
        comparisonYear: comparisonYears.overall
      }));
      
      // Fetch per pupil expenditure data
      dispatch(fetchPerPupilExpenditure({ districtId: id }));
      
      // Fetch state average per pupil expenditure data
      dispatch(fetchStatePerPupilExpenditure({}));
    }
  }, [dispatch, id, district, districtLoading, comparisonYears.overall]);
  
  // Load needed comparison years when tabs change
  useEffect(() => {
    if (!id) return;
    
    // Determine which comparison years to load based on active tab
    switch (mainTabValue) {
      case 0: // Overall tab
        loadComparisonYearData(comparisonYears.overall);
        break;
      case 1: // Expenditures tab
        loadComparisonYearData(comparisonYears.expenditures);
        break;
      case 2: // Revenue tab
        loadComparisonYearData(comparisonYears.revenues);
        break;
      case 3: // Balance Sheet tab - load both assets and liabilities years
        loadComparisonYearData(comparisonYears.assets);
        loadComparisonYearData(comparisonYears.liabilities);
        break;
    }
  }, [
    id,
    mainTabValue,
    loadComparisonYearData,
    comparisonYears
  ]);

  // Tab change handler
  const handleMainTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setMainTabValue(newValue);
  };

  // Loading and data availability states
  const isLoading = districtLoading || financeLoading;
  const hasNoData = !processedReport || 
    (processedReport.expenditures.length === 0 && 
     processedReport.revenues.length === 0 && 
     processedReport.balance_sheets.length === 0);

  // Calculate percentage difference between district and state values
  const calculateDifference = useCallback((districtValue: number, stateValue: number): number => {
    if (!stateValue) return 0;
    return ((districtValue - stateValue) / stateValue) * 100;
  }, []);
  
  // Get the per pupil expenditure data
  const perPupilExpenditureData = useAppSelector(state => {
    if (!latestPerPupilExpenditureDetails) return { current: null, previousYear: null, tenYearsAgo: null };
    
    return {
      current: latestPerPupilExpenditureDetails,
      previousYear: selectPerPupilExpenditureByYear(state, latestPerPupilExpenditureDetails.year - 1),
      tenYearsAgo: selectPerPupilExpenditureByYear(state, latestPerPupilExpenditureDetails.year - 10)
    };
  });
  
  // Get the state per pupil expenditure data
  const statePerPupilExpenditureData = useAppSelector(state => {
    if (!latestStatePerPupilExpenditureDetails) return { current: null, tenYearsAgo: null };
    
    return {
      current: latestStatePerPupilExpenditureDetails,
      tenYearsAgo: selectStatePerPupilExpenditureByYear(state, latestStatePerPupilExpenditureDetails.year - 10)
    };
  });
  
  // Helper to calculate change between two values
  const calculateChange = useCallback((currentValue: number, previousValue: number) => {
    if (!previousValue) return null;
    
    const difference = currentValue - previousValue;
    const percentChange = (difference / previousValue) * 100;
    
    return {
      difference,
      percentChange,
      previousValue
    };
  }, []);
  
  // Calculate year-over-year change for district per pupil expenditure
  const perPupilYearOverYearChange = useMemo(() => {
    const { current, previousYear } = perPupilExpenditureData;
    if (!current || !previousYear) return null;
    
    return calculateChange(current.total, previousYear.total);
  }, [perPupilExpenditureData, calculateChange]);
  
  // Calculate 10-year change for district per pupil expenditure
  const perPupilTenYearChange = useMemo(() => {
    const { current, tenYearsAgo } = perPupilExpenditureData;
    if (!current || !tenYearsAgo) return null;
    
    return calculateChange(current.total, tenYearsAgo.total);
  }, [perPupilExpenditureData, calculateChange]);
  
  // Calculate 10-year change for state average per pupil expenditure
  const statePerPupilTenYearChange = useMemo(() => {
    const { current, tenYearsAgo } = statePerPupilExpenditureData;
    if (!current || !tenYearsAgo) return null;
    
    return calculateChange(current.total, tenYearsAgo.total);
  }, [statePerPupilExpenditureData, calculateChange]);
  
  // Format the comparison year for each section
  const formattedComparisonYears = useMemo(() => ({
    overall: formatFiscalYear(comparisonYears.overall),
    expenditures: formatFiscalYear(comparisonYears.expenditures),
    revenues: formatFiscalYear(comparisonYears.revenues),
    assets: formatFiscalYear(comparisonYears.assets),
    liabilities: formatFiscalYear(comparisonYears.liabilities)
  }), [formatFiscalYear, comparisonYears]);
  
  // Loading states for comparison years
  const comparisonLoading = useMemo(() => ({
    expenditures: yearsBeingLoaded[comparisonYears.expenditures] || false,
    revenues: yearsBeingLoaded[comparisonYears.revenues] || false,
    assets: yearsBeingLoaded[comparisonYears.assets] || false,
    liabilities: yearsBeingLoaded[comparisonYears.liabilities] || false
  }), [yearsBeingLoaded, comparisonYears]);
  
  // Render tab content based on selected tab
  const renderTabContent = () => {
    switch (mainTabValue) {
      case 0: // Overall Tab
        return renderOverallTab();
      case 1: // Expenditures Tab
        return (
          <FinancialComparisonTable 
            items={expenditureComparisonItems}
            currentYear={formattedCurrentYear}
            previousYear={formattedComparisonYears.expenditures}
            headers={{
              category: 'Category',
              subCategory: 'Sub Category',
              itemName: 'Expenditure Type'
            }}
            title="Expenditure Breakdown"
            formatValue={formatCompactNumber}
            initialViewMode="comparison"
            availableComparisonYears={availableComparisonYears}
            selectedComparisonYear={comparisonYears.expenditures}
            onComparisonYearChange={(year) => handleComparisonYearChange('expenditures', year)}
            isLoading={comparisonLoading.expenditures}
          />
        );
      case 2: // Revenues Tab
        return (
          <FinancialComparisonTable 
            items={revenueComparisonItems}
            currentYear={formattedCurrentYear}
            previousYear={formattedComparisonYears.revenues}
            headers={{
              category: 'Category',
              subCategory: 'Sub Category',
              itemName: 'Revenue Source'
            }}
            title="Revenue Breakdown"
            formatValue={formatCompactNumber}
            initialViewMode="comparison"
            availableComparisonYears={availableComparisonYears}
            selectedComparisonYear={comparisonYears.revenues}
            onComparisonYearChange={(year) => handleComparisonYearChange('revenues', year)}
            isLoading={comparisonLoading.revenues}
          />
        );
      case 3: // Balance Sheet Tab
        return renderBalanceSheetTab();
      default:
        return null;
    }
  };
  
  // Render Overall Tab content
  const renderOverallTab = () => (
    <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 3, mb: 4 }}>
      <Card sx={{flex: 1 }}>
        <CardContent>
          <Typography variant="h6">
            {formattedCurrentYear || '23/24'} Expenditures: {formatCompactNumber(totalExpenditures)}
          </Typography>
          <FinancialChange current={totalExpenditures} previous={comparisonTotalExpenditures} />
        </CardContent>
      </Card>
      <Card sx={{flex: 1 }}>
        <CardContent>
          <Typography variant="h6">
            {formattedCurrentYear || '23/24'} Revenue: {formatCompactNumber(totalRevenues)}
          </Typography>
          <FinancialChange current={totalRevenues} previous={comparisonTotalRevenues} />
        </CardContent>
      </Card>
      <Card sx={{flex: isMobile ? 1 : 2 }}>
        <CardContent>
          <Typography variant="h6">
            Cost Per Pupil: {latestPerPupilExpenditureDetails?.total 
              ? formatCompactNumber(latestPerPupilExpenditureDetails.total) 
              : 'Loading...'}
          </Typography>
          
          {renderPerPupilDetails()}
        </CardContent>
      </Card>
    </Box>
  );
  
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
            {' Avg.'}
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
        
        {renderCostBreakdownTable()}
        
      </Box>
    );
  };
  
  // Render 10-year comparison
  const renderTenYearComparison = () => {
    if (!perPupilTenYearChange || !statePerPupilTenYearChange) return null;
    
    return (
      <>
        <Typography component="li" variant="body2">
          Over 10 Years,{' '}
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
              ? ' Faster' 
              : ' Slower'} than the State Average
          </Typography>
          .
        </Typography>
        <Box component="li" sx={{ ml: 3, listStyleType: 'circle' }}>
          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
            {formatCompactNumber(Math.abs(perPupilTenYearChange.difference))} District 
            {perPupilTenYearChange.difference > 0 ? ' Increase' : ' Decrease'} vs. {' '} 
            {formatCompactNumber(Math.abs(statePerPupilTenYearChange.difference))} State 
            {statePerPupilTenYearChange.difference > 0 ? ' Increase' : ' Decrease'}
          </Typography>
        </Box>
      </>
    );
  };
  
  // Render Cost Breakdown table
  const renderCostBreakdownTable = () => {
    if (!latestPerPupilExpenditureDetails || !latestStatePerPupilExpenditureDetails) return null;
    
    return (
      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', mt: 2, gap: 2 }}>
        <TableContainer component={Paper} elevation={0} sx={{ flex: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell></TableCell>
                <TableCell align="right">District</TableCell>
                <TableCell align="right">State</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Elementary</TableCell>
                <TableCell align="right">
                  {formatCompactNumber(latestPerPupilExpenditureDetails?.elementary)}
                </TableCell>
                <TableCell align="right">
                  {formatCompactNumber(latestStatePerPupilExpenditureDetails?.elementary)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Middle</TableCell>
                <TableCell align="right">
                  {formatCompactNumber(latestPerPupilExpenditureDetails?.middle)}
                </TableCell>
                <TableCell align="right">
                  {formatCompactNumber(latestStatePerPupilExpenditureDetails?.middle)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>High</TableCell>
                <TableCell align="right">
                  {formatCompactNumber(latestPerPupilExpenditureDetails?.high)}
                </TableCell>
                <TableCell align="right">
                  {formatCompactNumber(latestStatePerPupilExpenditureDetails?.high)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };
  
  // Render Balance Sheet Tab content
  const renderBalanceSheetTab = () => (
    <>
      {/* Assets Table */}
      <FinancialComparisonTable 
        items={assetsComparisonItems}
        currentYear={formattedCurrentYear}
        previousYear={formattedComparisonYears.assets}
        headers={{
          category: 'Category',
          subCategory: 'Type',
          itemName: 'Asset'
        }}
        title="Assets Breakdown"
        formatValue={formatCompactNumber}
        initialViewMode="comparison"
        availableComparisonYears={availableComparisonYears}
        selectedComparisonYear={comparisonYears.assets}
        onComparisonYearChange={(year) => handleComparisonYearChange('assets', year)}
        isLoading={comparisonLoading.assets}
        valueType="Assets"
        totalRowLabel="Total Assets"
      />
      
      {/* Liabilities Table */}
      <Box sx={{ mt: 4 }}>
        <FinancialComparisonTable 
          items={liabilitiesComparisonItems}
          currentYear={formattedCurrentYear}
          previousYear={formattedComparisonYears.liabilities}
          headers={{
            category: 'Category',
            subCategory: 'Type',
            itemName: 'Liability'
          }}
          title="Liabilities Breakdown"
          formatValue={formatCompactNumber}
          initialViewMode="comparison"
          availableComparisonYears={availableComparisonYears}
          selectedComparisonYear={comparisonYears.liabilities}
          onComparisonYearChange={(year) => handleComparisonYearChange('liabilities', year)}
          isLoading={comparisonLoading.liabilities}
          valueType="Debts"
          totalRowLabel="Total Liabilities"
        />
      </Box>
    </>
  );
  
  return (
    <>
      <SectionTitle>
        {district?.name || 'District'} School District
      </SectionTitle>

      {/* Main Tabs */}
      <Box sx={{ position: 'relative', mb: isMobile ? 2 : 3 }}>
        <Tabs 
          value={mainTabValue} 
          onChange={handleMainTabChange} 
          sx={{ mb: 0 }}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
        >
          {TABS.map(tab => (
            <Tab 
              key={tab.value}
              label={isMobile ? tab.mobileLabel : tab.label} 
              sx={isMobile ? { px: 0 } : undefined} 
            />
          ))}
        </Tabs>
        
        {/* Full-width divider line */}
        <Divider sx={{ width: '100%', position: 'absolute', bottom: 0, left: 0, right: 0 }} />
      </Box>

      {/* Loading, Error and No Data States */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : financeError ? (
        <Typography color="error">{financeError}</Typography>
      ) : hasNoData ? (
        <Typography>No financial data available for this district.</Typography>
      ) : (
        renderTabContent()
      )}
    </>
  );
};

export default Financials; 