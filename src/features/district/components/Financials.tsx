import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Box, CircularProgress, Tabs, Tab, Paper, useMediaQuery, useTheme, Divider } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCurrentDistrict,
  selectLocationLoading,
  fetchAllDistrictData 
} from '@/store/slices/locationSlice';
import {
  fetchFinancialReport,
  fetchComparisonYearReport,
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
  selectTotalLiabilitiesByYear
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

// Define comparison year configuration
interface ComparisonConfig {
  year: string;
  setYear: (year: string) => void;
  formattedYear: string | null;
  isLoading: boolean;
}

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
  
  // Comparison year selection states
  const [overallComparisonYear, setOverallComparisonYear] = useState<string>('2023');
  const [expendituresComparisonYear, setExpendituresComparisonYear] = useState<string>('2023');
  const [revenuesComparisonYear, setRevenuesComparisonYear] = useState<string>('2023');
  const [assetsComparisonYear, setAssetsComparisonYear] = useState<string>('2023');
  const [liabilitiesComparisonYear, setLiabilitiesComparisonYear] = useState<string>('2023');
  
  // Track loading state for specific comparison year data
  const [yearsBeingLoaded, setYearsBeingLoaded] = useState<Record<string, boolean>>({});
  
  // Current year financial data
  const totalExpenditures = useAppSelector(selectTotalExpenditures);
  const totalRevenues = useAppSelector(selectTotalRevenues);
  const totalAssetsOnly = useAppSelector(selectTotalAssetsOnly);
  const totalLiabilities = useAppSelector(selectTotalLiabilities);
  const financeLoading = useAppSelector(selectFinanceLoading);
  const financeError = useAppSelector(selectFinanceError);
  const financialReport = useAppSelector(selectFinancialReport);
  
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
  
  // Create comparison year configurations
  const comparisonConfigs = useMemo(() => {
    return {
      overall: {
        year: overallComparisonYear,
        setYear: setOverallComparisonYear,
        formattedYear: formatFiscalYear(overallComparisonYear),
        isLoading: yearsBeingLoaded[overallComparisonYear] || false
      },
      expenditures: {
        year: expendituresComparisonYear,
        setYear: setExpendituresComparisonYear,
        formattedYear: formatFiscalYear(expendituresComparisonYear),
        isLoading: yearsBeingLoaded[expendituresComparisonYear] || false
      },
      revenues: {
        year: revenuesComparisonYear,
        setYear: setRevenuesComparisonYear,
        formattedYear: formatFiscalYear(revenuesComparisonYear),
        isLoading: yearsBeingLoaded[revenuesComparisonYear] || false
      },
      assets: {
        year: assetsComparisonYear,
        setYear: setAssetsComparisonYear,
        formattedYear: formatFiscalYear(assetsComparisonYear),
        isLoading: yearsBeingLoaded[assetsComparisonYear] || false
      },
      liabilities: {
        year: liabilitiesComparisonYear,
        setYear: setLiabilitiesComparisonYear,
        formattedYear: formatFiscalYear(liabilitiesComparisonYear),
        isLoading: yearsBeingLoaded[liabilitiesComparisonYear] || false
      }
    };
  }, [
    overallComparisonYear, expendituresComparisonYear, revenuesComparisonYear, 
    assetsComparisonYear, liabilitiesComparisonYear, yearsBeingLoaded, formatFiscalYear
  ]);

  // Get comparison data from Redux store
  const getComparisonData = useCallback((year: string) => {
    return useAppSelector(state => selectProcessedComparisonReportByYear(state, year));
  }, []);
  
  // Get totals for overview
  const comparisonTotalExpenditures = useAppSelector(state => 
    selectTotalExpendituresByYear(state, overallComparisonYear));
  const comparisonTotalRevenues = useAppSelector(state => 
    selectTotalRevenuesByYear(state, overallComparisonYear));
  const comparisonTotalAssets = useAppSelector(state => 
    selectTotalAssetsByYear(state, overallComparisonYear));
  const comparisonTotalLiabilities = useAppSelector(state => 
    selectTotalLiabilitiesByYear(state, overallComparisonYear));
  
  // Generate an array of available years (from 2010 to current year - 1)
  const availableComparisonYears = useMemo(() => {
    const years = [];
    const endYear = currentYear ? currentYear - 1 : 2023;
    const startYear = 2010;
    
    for (let year = endYear; year >= startYear; year--) {
      years.push(year.toString());
    }
    
    return years;
  }, [currentYear]);
  
  // Get processed report from Redux
  const processedReport = useAppSelector(state => state.finance.processedReport);
  
  // Get comparison data for each tab
  const expendituresComparisonData = useAppSelector(state => 
    selectProcessedComparisonReportByYear(state, expendituresComparisonYear));
  const revenuesComparisonData = useAppSelector(state => 
    selectProcessedComparisonReportByYear(state, revenuesComparisonYear));
  const assetsComparisonData = useAppSelector(state => 
    selectProcessedComparisonReportByYear(state, assetsComparisonYear));
  const liabilitiesComparisonData = useAppSelector(state => 
    selectProcessedComparisonReportByYear(state, liabilitiesComparisonYear));
  
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
  
  // Create handler functions for year changes
  const createYearChangeHandler = useCallback((setYearFn: (year: string) => void) => {
    return (year: string) => {
      setYearFn(year);
      loadComparisonYearData(year);
    };
  }, [loadComparisonYearData]);
  
  // Year change handler functions
  const handleOverallComparisonYearChange = useCallback((year: string) => {
    setOverallComparisonYear(year);
    loadComparisonYearData(year);
  }, [loadComparisonYearData]);

  // Initialize handlers with the factory function
  const handleExpendituresComparisonYearChange = useCallback(
    createYearChangeHandler(setExpendituresComparisonYear), 
    [createYearChangeHandler]
  );
  
  const handleRevenuesComparisonYearChange = useCallback(
    createYearChangeHandler(setRevenuesComparisonYear),
    [createYearChangeHandler]
  );
  
  const handleAssetsComparisonYearChange = useCallback(
    createYearChangeHandler(setAssetsComparisonYear),
    [createYearChangeHandler]
  );
  
  const handleLiabilitiesComparisonYearChange = useCallback(
    createYearChangeHandler(setLiabilitiesComparisonYear),
    [createYearChangeHandler]
  );
  
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
        comparisonYear: overallComparisonYear
      }));
    }
  }, [dispatch, id, district, districtLoading, overallComparisonYear]);
  
  // Load needed comparison years when tabs change
  useEffect(() => {
    if (!id) return;
    
    // Determine which comparison years to load based on active tab
    switch (mainTabValue) {
      case 0: // Overall tab
        loadComparisonYearData(overallComparisonYear);
        break;
      case 1: // Expenditures tab
        loadComparisonYearData(expendituresComparisonYear);
        break;
      case 2: // Revenue tab
        loadComparisonYearData(revenuesComparisonYear);
        break;
      case 3: // Balance Sheet tab - load both assets and liabilities years
        loadComparisonYearData(assetsComparisonYear);
        loadComparisonYearData(liabilitiesComparisonYear);
        break;
    }
  }, [
    id,
    mainTabValue,
    loadComparisonYearData,
    overallComparisonYear,
    expendituresComparisonYear,
    revenuesComparisonYear,
    assetsComparisonYear,
    liabilitiesComparisonYear
  ]);

  // Tab change handlers
  const handleMainTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setMainTabValue(newValue);
  };

  // Loading and data availability states
  const isLoading = districtLoading || financeLoading;
  const hasNoData = !processedReport || 
    (processedReport.expenditures.length === 0 && 
     processedReport.revenues.length === 0 && 
     processedReport.balance_sheets.length === 0);

  return (
    <>
      <SectionTitle>
        {district?.name || 'District'} School District
      </SectionTitle>

      {/* Main Tabs - responsive labels for mobile */}
      <Box sx={{ position: 'relative', mb: isMobile ? 2 : 3 }}>
        <Tabs 
          value={mainTabValue} 
          onChange={handleMainTabChange} 
          sx={{ mb: 0 }}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
        >
          <Tab label={isMobile ? "Summary" : "Overall"} sx={isMobile ? { px: 0 } : undefined} />
          <Tab label={isMobile ? "Spend" : "Expenditures"} sx={isMobile ? { px: 0 } : undefined} />
          <Tab label={isMobile ? "Income" : "Revenues"} sx={isMobile ? { px: 0 } : undefined} />
          <Tab label={isMobile ? "Capital" : "Balance Sheet"} sx={isMobile ? { px: 0 } : undefined} />
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
        <>
          {/* Overall Tab */}
          {mainTabValue === 0 && (
            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" gutterBottom>Financial Summary</Typography>
              
              <Typography variant="body1" gutterBottom>
                {formattedCurrentYear ? `${formattedCurrentYear} ` : ''}Expenditures: {formatCompactNumber(totalExpenditures)}
                <FinancialChange current={totalExpenditures} previous={comparisonTotalExpenditures} />
              </Typography>
              
              <Typography variant="body1" gutterBottom>
                {formattedCurrentYear ? `${formattedCurrentYear} ` : ''}Revenues: {formatCompactNumber(totalRevenues)}
                <FinancialChange current={totalRevenues} previous={comparisonTotalRevenues} />
              </Typography>
              
              <Typography variant="body1" gutterBottom>
                {formattedCurrentYear ? `${formattedCurrentYear} ` : ''}Assets: {formatCompactNumber(totalAssetsOnly)}
                <FinancialChange current={totalAssetsOnly} previous={comparisonTotalAssets} />
              </Typography>
              
              <Typography variant="body1" gutterBottom>
                {formattedCurrentYear ? `${formattedCurrentYear} ` : ''}Liabilities: {formatCompactNumber(totalLiabilities)}
                <FinancialChange current={totalLiabilities} previous={comparisonTotalLiabilities} />
              </Typography>
            </Paper>
          )}
          
          {/* Expenditures Tab */}
          {mainTabValue === 1 && (
            <FinancialComparisonTable 
              items={expenditureComparisonItems}
              currentYear={formattedCurrentYear}
              previousYear={comparisonConfigs.expenditures.formattedYear}
              headers={{
                category: 'Category',
                subCategory: 'Sub Category',
                itemName: 'Expenditure Type'
              }}
              title="Expenditure Breakdown"
              formatValue={formatCompactNumber}
              initialViewMode="comparison"
              availableComparisonYears={availableComparisonYears}
              selectedComparisonYear={expendituresComparisonYear}
              onComparisonYearChange={handleExpendituresComparisonYearChange}
              isLoading={comparisonConfigs.expenditures.isLoading}
            />
          )}
          
          {/* Revenues Tab */}
          {mainTabValue === 2 && (
            <FinancialComparisonTable 
              items={revenueComparisonItems}
              currentYear={formattedCurrentYear}
              previousYear={comparisonConfigs.revenues.formattedYear}
              headers={{
                category: 'Category',
                subCategory: 'Sub Category',
                itemName: 'Revenue Source'
              }}
              title="Revenue Breakdown"
              formatValue={formatCompactNumber}
              initialViewMode="comparison"
              availableComparisonYears={availableComparisonYears}
              selectedComparisonYear={revenuesComparisonYear}
              onComparisonYearChange={handleRevenuesComparisonYearChange}
              isLoading={comparisonConfigs.revenues.isLoading}
            />
          )}
          
          {/* Balance Sheet Tab */}
          {mainTabValue === 3 && (
            <>
              {/* Assets Table */}
              <FinancialComparisonTable 
                items={assetsComparisonItems}
                currentYear={formattedCurrentYear}
                previousYear={comparisonConfigs.assets.formattedYear}
                headers={{
                  category: 'Category',
                  subCategory: 'Type',
                  itemName: 'Asset'
                }}
                title="Assets Breakdown"
                formatValue={formatCompactNumber}
                initialViewMode="comparison"
                availableComparisonYears={availableComparisonYears}
                selectedComparisonYear={assetsComparisonYear}
                onComparisonYearChange={handleAssetsComparisonYearChange}
                isLoading={comparisonConfigs.assets.isLoading}
                valueType="Assets"
                totalRowLabel="Total Assets"
              />
              
              {/* Liabilities Table */}
              <Box sx={{ mt: 4 }}>
                <FinancialComparisonTable 
                  items={liabilitiesComparisonItems}
                  currentYear={formattedCurrentYear}
                  previousYear={comparisonConfigs.liabilities.formattedYear}
                  headers={{
                    category: 'Category',
                    subCategory: 'Type',
                    itemName: 'Liability'
                  }}
                  title="Liabilities Breakdown"
                  formatValue={formatCompactNumber}
                  initialViewMode="comparison"
                  availableComparisonYears={availableComparisonYears}
                  selectedComparisonYear={liabilitiesComparisonYear}
                  onComparisonYearChange={handleLiabilitiesComparisonYearChange}
                  isLoading={comparisonConfigs.liabilities.isLoading}
                  valueType="Debts"
                  totalRowLabel="Total Liabilities"
                />
              </Box>
            </>
          )}
        </>
      )}
    </>
  );
};

export default Financials; 