import React, { useEffect, useMemo } from 'react';
import { Box, CircularProgress, Divider } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCurrentDistrict,
  selectLocationLoading
} from '@/store/slices/locationSlice';
import SectionTitle from '@/components/ui/SectionTitle';
import * as outcomeSlice from '@/store/slices/outcomeSlice';
import OutcomeSummaryCard from './outcome/OutcomeSummaryCard';
import WhatIsNextDetails from './outcome/WhatIsNextDetails';
import GraduationRateChart from './outcome/GraduationRateChart';
import WhatIsNextChart from './outcome/WhatIsNextChart';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';

const Outcomes: React.FC = () => {
  const dispatch = useAppDispatch();

  // District and location data
  const district = useAppSelector(selectCurrentDistrict);
  const districtId = district?.id;
  const districtLoading = useAppSelector(selectLocationLoading);

  // Memoize the parameter objects to avoid recreating them on each render
  const districtParams = useMemo(() => ({ district_id: districtId }), [districtId]);
  const stateParams = useMemo(() => ({}), []);

  const districtPostGraduationData = useAppSelector(state => 
    outcomeSlice.selectDistrictPostGraduationData(state, districtParams));
  const statePostGraduationData = useAppSelector(state => 
    outcomeSlice.selectStatePostGraduationData(state, stateParams));

  const districtEarlyExitData = useAppSelector(state => 
    outcomeSlice.selectDistrictEarlyExitData(state, districtParams));
  const stateEarlyExitData = useAppSelector(state => 
    outcomeSlice.selectStateEarlyExitData(state, stateParams));

  const districtGraduationCohortData = useAppSelector(state => 
    outcomeSlice.selectDistrictGraduationCohortData(state, districtParams));
  const stateGraduationCohortData = useAppSelector(state => 
    outcomeSlice.selectStateGraduationCohortData(state, stateParams));

  // Post-graduation types data
  const postGraduationTypes = useAppSelector(outcomeSlice.selectPostGraduationTypes);

  // Loading states
  const loadingStates = {
    types: {
      postGraduationTypes: useAppSelector(outcomeSlice.selectPostGraduationTypesLoadingStatus)
    },
    district: {
      postGraduation: useAppSelector(state => 
        outcomeSlice.selectDistrictPostGraduationLoadingStatus(state, districtParams)),
      earlyExit: useAppSelector(state => 
        outcomeSlice.selectDistrictEarlyExitLoadingStatus(state, districtParams)),
      graduationCohort: useAppSelector(state => 
        outcomeSlice.selectDistrictGraduationCohortLoadingStatus(state, districtParams))
    },
    state: {
      postGraduation: useAppSelector(state => 
        outcomeSlice.selectStatePostGraduationLoadingStatus(state, stateParams)),
      earlyExit: useAppSelector(state => 
        outcomeSlice.selectStateEarlyExitLoadingStatus(state, stateParams)),
      graduationCohort: useAppSelector(state => 
        outcomeSlice.selectStateGraduationCohortLoadingStatus(state, stateParams))
    }
  };

  // Check if any data is still loading
  const isLoading = useMemo(() => {
    return districtLoading || 
      loadingStates.types.postGraduationTypes !== outcomeSlice.LoadingState.SUCCEEDED ||
      Object.values(loadingStates.district).some(state => state !== outcomeSlice.LoadingState.SUCCEEDED) ||
      Object.values(loadingStates.state).some(state => state !== outcomeSlice.LoadingState.SUCCEEDED);
  }, [districtLoading, loadingStates]);

  // Helper function to check if data needs to be fetched
  const shouldFetchData = (loadingState: outcomeSlice.LoadingState, data: any[]) => {
    return loadingState === outcomeSlice.LoadingState.IDLE && data.length === 0;
  };

  useEffect(() => {
    if (!districtId) return;

    // Only fetch other data if we have the district data
    if (district) {

      // Fetch post-graduation types if needed
      if (shouldFetchData(loadingStates.types.postGraduationTypes, postGraduationTypes)) {
        dispatch(outcomeSlice.fetchPostGraduationTypes());
      }

      // Fetch district data
      if (shouldFetchData(loadingStates.district.postGraduation, districtPostGraduationData)) {
        dispatch(outcomeSlice.fetchDistrictPostGraduationOutcomes(districtParams));
      }
      if (shouldFetchData(loadingStates.district.earlyExit, districtEarlyExitData)) {
        dispatch(outcomeSlice.fetchDistrictEarlyExitData(districtParams));
      }
      if (shouldFetchData(loadingStates.district.graduationCohort, districtGraduationCohortData)) {
        dispatch(outcomeSlice.fetchDistrictGraduationCohortData(districtParams));
      }

      // Fetch state data
      if (shouldFetchData(loadingStates.state.postGraduation, statePostGraduationData)) {
        dispatch(outcomeSlice.fetchStatePostGraduationOutcomes(stateParams));
      }
      if (shouldFetchData(loadingStates.state.earlyExit, stateEarlyExitData)) {
        dispatch(outcomeSlice.fetchStateEarlyExitData(stateParams));
      }
      if (shouldFetchData(loadingStates.state.graduationCohort, stateGraduationCohortData)) {
        dispatch(outcomeSlice.fetchStateGraduationCohortData(stateParams));
      }
    }
  }, [
    dispatch, districtId, district,
    loadingStates, districtParams, stateParams,
    districtPostGraduationData, districtEarlyExitData, districtGraduationCohortData,
    statePostGraduationData, stateEarlyExitData, stateGraduationCohortData,
    postGraduationTypes
  ]);

  return (
    <>
      <SectionTitle 
        displayName={PAGE_REGISTRY.district.outcomes.displayName}
        districtName={district?.name}
      />
      
      <Box sx={{ mt: 3 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
              <Box sx={{ flex: 1 }}>
                <OutcomeSummaryCard />
              </Box>
              <Divider sx={{ display: { xs: 'block', lg: 'none' }, borderBottomWidth: 1 }} />
              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
              <Box sx={{ flex: 1 }}>
                <GraduationRateChart />
              </Box>
            </Box>
            <Divider sx={{ display: { xs: 'block', md: 'none' }, borderBottomWidth: 2 }} />
            <Divider sx={{ display: { xs: 'none', md: 'block' }, borderBottomWidth: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>
              <Box sx={{ flex: 1 }}>
                <WhatIsNextDetails />
              </Box>
              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', lg: 'block' } }} />
              <Divider sx={{ display: { xs: 'block', lg: 'none' }, borderBottomWidth: 1 }} />
              <Box sx={{ flex: 1 }}>
                <WhatIsNextChart />
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </>
  );
};

export default Outcomes; 