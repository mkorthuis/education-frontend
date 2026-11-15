import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Box, CircularProgress, Tabs, Tab, useMediaQuery, useTheme, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCurrentDistrict,
  selectLocationLoading,
  fetchDistrictById
} from '@/store/slices/locationSlice';
import SectionTitle from '@/components/ui/SectionTitle';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';

import {
  selectLatestPerPupilExpenditureDetails,
  selectLatestStatePerPupilExpenditureDetails,
  fetchPerPupilExpenditure,
  fetchStatePerPupilExpenditure,
  selectFinancialReports,
  fetchFinancialReports,
  selectAnyFinanceLoading,
  selectFinanceError,
  clearFinanceState,
  selectProcessedReportDistrictId,
  selectLatestStateExpenditureRollupDetails,
  fetchStateExpenditureRollups,
  selectLatestStateRevenueDetails,
  fetchStateRevenue,
  fetchStateExpenditure,
  selectLatestStateExpenditureDetails,
  selectLatestStateADM,
  fetchStateADM,
  selectAdjustForInflation,
  toggleInflationAdjustment
} from '@/store/slices/financeSlice';
import { LoadingState } from '@/store/utils/loadingState';
import { FISCAL_YEAR } from '@/utils/environment';
import { downloadWorkbook } from '@/features/state/utils/excel';
import { entityFileName } from '@/features/entity/excel';
import { financialsWorkbook } from '../workbooks/financialsWorkbook';
import { useDistrictStateAid } from '../hooks/useDistrictStateAid';

// Import tab components
import OverallTab from './financial/OverallTab';
import ExpendituresTab from './financial/ExpendituresTab';
import RevenuesTab from './financial/RevenuesTab';
import StateAidTab from './financial/StateAidTab';
import BalanceSheetTab from './financial/BalanceSheetTab';


// Tabs configuration
const TABS = [
  { value: 0, label: 'Overall', mobileLabel: 'Summary', path: 'overall' },
  { value: 1, label: 'Expenditures', mobileLabel: 'Spend', path: 'expenditures' },
  { value: 2, label: 'Revenues', mobileLabel: 'Income', path: 'revenues' },
  { value: 3, label: 'Balance Sheet', mobileLabel: 'Capital', path: 'balance-sheet' },
  // In italics: how the state's aid is calculated, beside the district's own reports. Not a tab on phones,
  // where the Revenues tab links to it
  { value: 4, label: 'State Aid', path: 'state-aid', italic: true, desktopOnly: true }
];

// Tab value for the URL's `:tab?` segment (Overall when missing or unknown)
const tabValueFromPath = (tab?: string) => TABS.find(t => t.path === tab)?.value ?? 0;

/**
 * Custom hook to fetch and manage district financial data
 */
function useDistrictFinancialData(districtId?: number) {
  const dispatch = useAppDispatch();
  const processedReportDistrictId = useAppSelector(selectProcessedReportDistrictId);
  const financialReports = useAppSelector(selectFinancialReports);
  const loading = useAppSelector(selectAnyFinanceLoading);
  const error = useAppSelector(selectFinanceError);
  const latestPerPupilData = useAppSelector(selectLatestPerPupilExpenditureDetails);
  const latestStatePerPupilData = useAppSelector(selectLatestStatePerPupilExpenditureDetails);
  const latestStateRollupData = useAppSelector(selectLatestStateExpenditureRollupDetails);
  const latestStateRevenueData = useAppSelector(selectLatestStateRevenueDetails);
  const latestStateExpenditureData = useAppSelector(selectLatestStateExpenditureDetails);
  const latestStateAdmData = useAppSelector(selectLatestStateADM);
  // The state revenue and expenditure selectors return [] when there is no data
  const hasStateRevenueData = latestStateRevenueData.length > 0;
  const hasStateExpenditureData = latestStateExpenditureData.length > 0;
  // Initial load state tracking
  const [hasInitiatedLoads, setHasInitiatedLoads] = useState(false);
  
  
  useEffect(() => {
    
    // Check if we need to reload the data because district has changed
    const needsReload = districtId !== undefined && processedReportDistrictId !== null && districtId !== processedReportDistrictId;
    
    // Clear previous state if we're loading a different district
    if (needsReload) {
      dispatch(clearFinanceState());
      setHasInitiatedLoads(false);
    }
    
    // Only proceed if we have a district ID and haven't already initiated loads
    if (!districtId || (hasInitiatedLoads && !needsReload) || loading) return;
  
    // Mark that we've initiated loads to prevent duplicate requests
    setHasInitiatedLoads(true);
    
    // Financial reports
    const reportsExist = Object.keys(financialReports).length > 0;
    if (!reportsExist) {
      dispatch(fetchFinancialReports({ districtId }));
    }
    
    // Per pupil expenditure data
    if (!latestPerPupilData) {
      dispatch(fetchPerPupilExpenditure({ districtId }));
    }
    
    // State per pupil expenditure data
    if (!latestStatePerPupilData) {
      dispatch(fetchStatePerPupilExpenditure({}));
    }

    // State revenue data
    if (!hasStateRevenueData) {
      dispatch(fetchStateRevenue({}));
    }
    // State expenditure rollup data
    if (!latestStateRollupData) {
      dispatch(fetchStateExpenditureRollups({}));
    }
    // State expenditure data
    if (!hasStateExpenditureData) {
      dispatch(fetchStateExpenditure({}));
    }
    // State ADM data
    if (!latestStateAdmData) {
      dispatch(fetchStateADM({}));
    }
  }, [
    districtId, 
    dispatch,
    processedReportDistrictId,
    hasInitiatedLoads,
    loading,
    financialReports,
    latestPerPupilData,
    latestStatePerPupilData,
    hasStateRevenueData,
    latestStateRollupData,
    hasStateExpenditureData,
    latestStateAdmData
  ]);
  
  return {
    financialReports,
    latestPerPupilData,
    latestStatePerPupilData,
    loading,
    error
  };
}

/**
 * Financials component displays district financial data with yearly comparisons
 */
const Financials: React.FC = () => {
  const { id, tab } = useParams<{ id: string; tab?: string }>();
  const navigate = useNavigate();
  const district = useAppSelector(selectCurrentDistrict);
  const districtLoading = useAppSelector(selectLocationLoading);
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Get inflation adjustment state from Redux
  const adjustForInflation = useAppSelector(selectAdjustForInflation);
  
  // Tab state, seeded from the URL parameter
  const [mainTabValue, setMainTabValue] = useState(() => tabValueFromPath(tab));

  // Follow the URL when it changes without a tab click (back/forward)
  useEffect(() => {
    setMainTabValue(tabValueFromPath(tab));
  }, [tab]);
  
  // Fetch district data on component mount - only use URL param if district is not set
  useEffect(() => {
    if (!district && id) {
      dispatch(fetchDistrictById(parseInt(id)));
    }
  }, [id, district, dispatch]);

  // Get the district ID to use for financial data - use district.id if available, otherwise URL param
  const districtId = district?.id || (id ? parseInt(id) : undefined);
  
  // Convert districtId to string for component props
  const districtIdString = districtId?.toString();
  
  // Use the custom hook to handle data fetching with the determined district ID
  const { 
    loading: financeLoading, 
    error: financeError
  } = useDistrictFinancialData(districtId);
  // The state's adequacy aid and how it's calculated, for the State Aid tab (not the download)
  const stateAid = useDistrictStateAid(districtId);
  
  const visibleTabs = TABS.filter(tab => !(isMobile && tab.desktopOnly));
  const tabPath = (tabName: string) => PAGE_REGISTRY.district.financials.urlPatterns[0].replace(':id', id || '').replace(':tab?', tabName);

  // Tab change handler
  const handleMainTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setMainTabValue(newValue);
    const selectedTab = TABS.find(t => t.value === newValue);
    if (selectedTab) navigate(tabPath(selectedTab.path));
  };

  // Handler for inflation adjustment toggle
  const handleToggleInflationAdjustment = () => {
    dispatch(toggleInflationAdjustment());
  };

  // Loading and data availability states
  const isLoading = districtLoading || financeLoading;

  // The page's four report tabs as one workbook, once all of it has loaded for this district. The State Aid
  // tab isn't in it; its state revenue is, in the Revenues tab's lines
  const finance = useAppSelector(state => state.finance);
  const downloadReady = !!district && !isLoading && !financeError
    && finance.processedReportDistrictId === district.id
    && Object.values(finance.loadingStates).every(status => status === LoadingState.SUCCEEDED);
  const downloadExcel = () => {
    if (!district) return;
    return downloadWorkbook(entityFileName('district', district.name, 'financials'), financialsWorkbook({
      name: district.name,
      displayName: PAGE_REGISTRY.district.financials.displayName,
      breakdownYear: parseInt(FISCAL_YEAR),
      reports: finance.processedReports,
      perPupil: finance.perPupilExpenditureAllData,
      statePerPupil: finance.statePerPupilExpenditureAllData,
      stateRollups: finance.stateExpenditureRollupData,
      stateRevenue: finance.stateRevenueAllData,
      stateExpenditure: finance.stateExpenditureAllData,
      stateADM: finance.stateADMData,
      revenueEntryTypes: finance.revenueEntryTypes,
      expenditureEntryTypes: finance.expenditureEntryTypes,
    }));
  };
  
  // Render tab content based on selected tab
  const renderTabContent = () => {
    switch (mainTabValue) {
      case 0: 
        return ( <OverallTab districtId={districtIdString} /> );
      case 1: 
        return ( <ExpendituresTab districtId={districtIdString} />);
      case 2: 
        return ( <RevenuesTab districtId={districtIdString} /> );
      case 3:
        return ( <BalanceSheetTab districtId={districtIdString} /> );
      case 4:
        return ( <StateAidTab districtName={district?.name ?? ''} aid={stateAid} /> );
      default:
        return null;
    }
  };
  
  // Handle error state
  if (financeError && !isLoading) {
    return (
      <Box sx={{ padding: 2 }}>
        <Typography color="error">
          Error loading financial data: {financeError}
        </Typography>
      </Box>
    );
  }
  
  const title = district && (
    <SectionTitle
      pageTitle
      displayName={PAGE_REGISTRY.district.financials.displayName}
      districtName={district.name}
      // The tabs' line is the page's line under the title
      withDivider={false}
      onDownload={downloadExcel}
      downloadReady={downloadReady}
    >
      {/* Inflation-adjusted figures are in today's dollars; on State Aid, only its chart of the years is, and it says so */}
      {adjustForInflation && TABS[mainTabValue]?.path !== 'state-aid' && <Box component="span" sx={{ color: 'error.main' }}> In Current Dollars</Box>}
    </SectionTitle>
  );
  const inflationToggle = (
    <ToggleButtonGroup
      value={adjustForInflation}
      exclusive
      onChange={() => handleToggleInflationAdjustment()}
      size="small"
      sx={{
        flexShrink: 0,
        '& .MuiToggleButton-root': {
          color: 'rgba(0, 0, 0, 0.87)',
          fontWeight: 500,
          minWidth: '140px'
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
      <ToggleButton value={true}>
        Adjust For Inflation
      </ToggleButton>
    </ToggleButtonGroup>
  );

  return (
    <>
      {district && (
        <>
          {/* On phones, where the tabs fill their row and there's no download button, Adjust For Inflation
              sits at the top right beside the title */}
          {isMobile ? (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', columnGap: 2 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>{title}</Box>
              {inflationToggle}
            </Box>
          ) : title}

          {/* The tabs, with Adjust For Inflation at the end of their row */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            columnGap: 2,
            borderBottom: 1,
            borderColor: 'divider',
            mb: isMobile ? 2 : 3
          }}>
            <Tabs
              // On phones, State Aid has no tab, so none is chosen; any of them goes back
              value={visibleTabs.some(tab => tab.value === mainTabValue) ? mainTabValue : false}
              onChange={handleMainTabChange}
              variant={isMobile ? "scrollable" : "standard"}
              scrollButtons={isMobile ? "auto" : false}
            >
              {visibleTabs.map(tab => (
                <Tab
                  key={tab.value}
                  value={tab.value}
                  label={isMobile ? tab.mobileLabel : tab.label}
                  sx={{ ...(isMobile && { px: 0 }), ...(tab.italic && { fontStyle: 'italic' }) }}
                />
              ))}
            </Tabs>
            {!isMobile && inflationToggle}
          </Box>

          {/* Loading, Error and No Data States */}
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            renderTabContent()
          )}
        </>
      )}
      
      {!district && isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
    </>
  );
};

export default Financials; 