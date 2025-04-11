import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Box, CircularProgress, Tabs, Tab, useMediaQuery, useTheme, Divider } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCurrentDistrict,
  selectLocationLoading,
  fetchDistrictById
} from '@/store/slices/locationSlice';
import SectionTitle from '@/components/ui/SectionTitle';

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
  selectLatestStateExpenditureDetails
} from '@/store/slices/financeSlice';

// Import tab components
import OverallTab from './financial/OverallTab';
import ExpendituresTab from './financial/ExpendituresTab';
import RevenuesTab from './financial/RevenuesTab';
import BalanceSheetTab from './financial/BalanceSheetTab';


// Tabs configuration
const TABS = [
  { value: 0, label: 'Overall', mobileLabel: 'Summary' },
  { value: 1, label: 'Expenditures', mobileLabel: 'Spend' },
  { value: 2, label: 'Revenues', mobileLabel: 'Income' },
  { value: 3, label: 'Balance Sheet', mobileLabel: 'Capital' }
];

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
  // Initial load state tracking
  const [hasInitiatedLoads, setHasInitiatedLoads] = useState(false);
  
  
  useEffect(() => {
    
    // Check if we need to reload the data because district has changed
    const needsReload = districtId !== undefined && processedReportDistrictId !== null && districtId !== processedReportDistrictId;
    
    // Clear previous state if we're loading a different district
    if (needsReload) {
      console.log('District changed, clearing financial state');
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
    if (!latestStateRevenueData || !latestStateRevenueData.length) {
      dispatch(fetchStateRevenue({}));
    }
    // State expenditure rollup data
    if (!latestStateRollupData) {
      dispatch(fetchStateExpenditureRollups({}));
    }
    // State expenditure data
    if (!latestStateExpenditureData || !latestStateRevenueData.length) {
      dispatch(fetchStateExpenditure({}));
    }
  }, [
    districtId, 
    dispatch,
    processedReportDistrictId,
    hasInitiatedLoads,
    loading,
    financialReports,
    latestPerPupilData,
    latestStatePerPupilData
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
  const { id } = useParams<{ id: string }>();
  const district = useAppSelector(selectCurrentDistrict);
  const districtLoading = useAppSelector(selectLocationLoading);
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Tab state
  const [mainTabValue, setMainTabValue] = useState(0);
  
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
  
  // Tab change handler
  const handleMainTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setMainTabValue(newValue);
  };

  // Loading and data availability states
  const isLoading = districtLoading || financeLoading;
  
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
  
  return (
    <>
      {district && (
        <>
          <SectionTitle>
            {district.name} School District
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