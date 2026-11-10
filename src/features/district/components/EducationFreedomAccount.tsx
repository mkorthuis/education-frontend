import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography, CircularProgress, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useTheme, useMediaQuery } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCurrentDistrict,
  selectCurrentTowns,
  selectLocationLoading
} from '@/store/slices/locationSlice';
import SectionTitle from '@/components/ui/SectionTitle';
import { 
  fetchEfaEntries, 
  fetchEfaStateEntries,
  fetchEfaEntryTypes,
  LoadingState, 
  selectEfaEntries, 
  selectEfaEntriesLoadingStatus,
  selectEfaStateEntries,
  selectEfaStateEntriesLoadingStatus,
  selectEfaEntryTypes,
  selectEfaEntryTypesLoadingStatus
} from '@/store/slices/efaSlice';
import {
  fetchTownEnrollment,
  fetchStateTownEnrollment,
  selectTownEnrollment,
  selectTownEnrollmentLoadingStatus,
  selectStateTownEnrollment,
  selectStateTownEnrollmentLoadingStatus
} from '@/store/slices/enrollmentSlice';
import EfaDetailsTable from './efa/EfaDetailsTable';
import EfaTrendChart from './efa/EfaTrendChart';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import { aggregateStatus } from '@/store/utils/loadingState';
import { downloadWorkbook } from '@/features/state/utils/excel';
import { entityFileName } from '@/features/entity/excel';
import { efaWorkbook } from '../workbooks/efaWorkbook';


const EducationFreedomAccount: React.FC = () => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('md'));

  // District data
  const district = useAppSelector(selectCurrentDistrict);
  const districtId = district?.id;
  const towns = useAppSelector(selectCurrentTowns);
  const districtLoading = useAppSelector(selectLocationLoading);

  // EFA data
  const efaLoading = useAppSelector(state => selectEfaEntriesLoadingStatus(state, { district_id: districtId }));
  const efaData = useAppSelector(state => selectEfaEntries(state, { district_id: districtId }));
  
  // State-level EFA data
  const stateEfaLoading = useAppSelector(state => selectEfaStateEntriesLoadingStatus(state, {}));
  const stateEfaData = useAppSelector(state => selectEfaStateEntries(state, {}));
  
  // EFA entry types
  const entryTypesLoading = useAppSelector(selectEfaEntryTypesLoadingStatus);
  const entryTypes = useAppSelector(selectEfaEntryTypes);
  
  // Town enrollment data (district level)
  const townEnrollmentLoading = useAppSelector(state => 
    selectTownEnrollmentLoadingStatus(state, { district_id: districtId }));
  const townEnrollmentData = useAppSelector(state => 
    selectTownEnrollment(state, { district_id: districtId }));
  
  // State-level town enrollment data
  const stateTownEnrollmentLoading = useAppSelector(state => 
    selectStateTownEnrollmentLoadingStatus(state, {}));
  const stateTownEnrollmentData = useAppSelector(state => 
    selectStateTownEnrollment(state, {}));
  
  const shouldFetchData = (loadingState: LoadingState, data: any[]) => {
    return loadingState === LoadingState.IDLE && data.length === 0;
  };

  // Load data if it's not already loaded
  useEffect(() => {
    if (!districtId) return;

    // Only fetch other data if we have the district data
    if (district) {
      // Fetch entry types if needed
      if (shouldFetchData(entryTypesLoading, entryTypes)) {
        dispatch(fetchEfaEntryTypes({}));
      }

      // Fetch district EFA data if needed
      if (shouldFetchData(efaLoading, efaData)) {
        dispatch(fetchEfaEntries({ district_id: districtId }));
      }

      // Fetch state EFA data if needed
      if (shouldFetchData(stateEfaLoading, stateEfaData)) {
        dispatch(fetchEfaStateEntries({}));
      }
      
      // Fetch town enrollment data for district if needed
      if (shouldFetchData(townEnrollmentLoading, townEnrollmentData)) {
        dispatch(fetchTownEnrollment({ district_id: districtId }));
      }
      
      // Fetch state-level town enrollment data if needed
      if (shouldFetchData(stateTownEnrollmentLoading, stateTownEnrollmentData)) {
        dispatch(fetchStateTownEnrollment({}));
      }
    }

  }, [
    districtId, 
    district, 
    dispatch, 
    efaLoading, 
    efaData, 
    stateEfaLoading, 
    stateEfaData, 
    entryTypesLoading, 
    entryTypes,
    townEnrollmentLoading,
    townEnrollmentData,
    stateTownEnrollmentLoading,
    stateTownEnrollmentData
  ]);

  // Loading until every request has finished (a request not dispatched yet counts as loading);
  // a failed request shows the page's empty states
  const loadStatus = aggregateStatus([
    efaLoading,
    stateEfaLoading,
    entryTypesLoading,
    townEnrollmentLoading,
    stateTownEnrollmentLoading
  ]);
  const isLoading = districtLoading || (!!district && loadStatus === 'loading');

  const displayName = PAGE_REGISTRY.district.efa.displayName;
  // Everything on the page as one workbook, every year and aid category, with New Hampshire's
  // grants and enrollment beside the district's
  const downloadExcel = () => {
    if (!district) return;
    return downloadWorkbook(entityFileName('district', district.name, 'education-freedom-accounts'), efaWorkbook({
      name: district.name,
      displayName,
      towns,
      entries: efaData,
      stateEntries: stateEfaData,
      entryTypes,
      townEnrollment: townEnrollmentData,
      stateTownEnrollment: stateTownEnrollmentData,
    }));
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: isLargeScreen ? '60%' : '100%',
      marginRight: 'auto' // Ensures left justification
    }}>
      <SectionTitle 
        displayName={displayName}
        districtName={district?.name}
        onDownload={downloadExcel}
        downloadReady={!!district && loadStatus === 'ready'}
      />
      
      <EfaDetailsTable />
      <EfaTrendChart />
    </Box>
  );
};

export default EducationFreedomAccount;
