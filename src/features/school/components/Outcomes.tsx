import React, { useEffect, useMemo } from 'react';
import { Box, Typography, CircularProgress, Divider } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCurrentSchool,
  selectLocationLoading
} from '@/store/slices/locationSlice';
import SectionTitle from '@/components/ui/SectionTitle';
import * as outcomeSlice from '@/store/slices/outcomeSlice';
import { fetchAllMeasurements } from '@/store/slices/measurementSlice';
import * as safetySlice from '@/store/slices/safetySlice';
import { selectAllMeasurements } from '@/store/slices/measurementSlice';
import { selectMeasurementsLoadingState } from '@/store/slices/measurementSlice';
import OutcomeSummaryCard from './outcome/OutcomeSummaryCard';
import WhatIsNextDetails from './outcome/WhatIsNextDetails';
import GraduationRateChart from './outcome/GraduationRateChart';
import WhatIsNextChart from './outcome/WhatIsNextChart';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';

const Outcomes: React.FC = () => {
  const dispatch = useAppDispatch();
  // List of outcome-related measurement type IDs
  const outcomeMeasurementTypeIds = [9, 10, 11];

  // School and location data
  const school = useAppSelector(selectCurrentSchool);
  const schoolId = school?.id;
  const schoolLoading = useAppSelector(selectLocationLoading);

  // Memoize the parameter objects to avoid recreating them on each render
  const schoolParams = useMemo(() => ({ school_id: schoolId }), [schoolId]);
  const stateParams = useMemo(() => ({}), []);
  
  const measurementsLoading = useAppSelector(selectMeasurementsLoadingState);
  const measurements = useAppSelector(selectAllMeasurements);

  const schoolPostGraduationData = useAppSelector(state => 
    outcomeSlice.selectSchoolPostGraduationData(state, schoolParams));
  const statePostGraduationData = useAppSelector(state => 
    outcomeSlice.selectStatePostGraduationData(state, stateParams));

  const schoolEarlyExitData = useAppSelector(state => 
    outcomeSlice.selectSchoolEarlyExitData(state, schoolParams));
  const stateEarlyExitData = useAppSelector(state => 
    outcomeSlice.selectStateEarlyExitData(state, stateParams));

  const schoolGraduationCohortData = useAppSelector(state => 
    outcomeSlice.selectSchoolGraduationCohortData(state, schoolParams));
  const stateGraduationCohortData = useAppSelector(state => 
    outcomeSlice.selectStateGraduationCohortData(state, stateParams));

  // Post-graduation types data
  const postGraduationTypes = useAppSelector(outcomeSlice.selectPostGraduationTypes);

  // Loading states
  const loadingStates = {
    types: {
      postGraduationTypes: useAppSelector(outcomeSlice.selectPostGraduationTypesLoadingStatus)
    },
    school: {
      postGraduation: useAppSelector(state => 
        outcomeSlice.selectSchoolPostGraduationLoadingStatus(state, schoolParams)),
      earlyExit: useAppSelector(state => 
        outcomeSlice.selectSchoolEarlyExitLoadingStatus(state, schoolParams)),
      graduationCohort: useAppSelector(state => 
        outcomeSlice.selectSchoolGraduationCohortLoadingStatus(state, schoolParams))
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
    return schoolLoading || 
      loadingStates.types.postGraduationTypes !== outcomeSlice.LoadingState.SUCCEEDED ||
      Object.values(loadingStates.school).some(state => state !== outcomeSlice.LoadingState.SUCCEEDED) ||
      Object.values(loadingStates.state).some(state => state !== outcomeSlice.LoadingState.SUCCEEDED);
  }, [schoolLoading, loadingStates]);

  // Helper function to check if data needs to be fetched
  const shouldFetchData = (loadingState: outcomeSlice.LoadingState, data: any[]) => {
    return loadingState === outcomeSlice.LoadingState.IDLE && data.length === 0;
  };

  useEffect(() => {
    if (!schoolId) return;

    // Only fetch other data if we have the school data
    if (school) {
      // Fetch measurements if needed
      if (measurementsLoading === safetySlice.LoadingState.IDLE && measurements.length === 0 && schoolId) {
        dispatch(fetchAllMeasurements({ 
          entityId: String(schoolId), 
          entityType: 'school' 
        }));
      }

      // Fetch post-graduation types if needed
      if (shouldFetchData(loadingStates.types.postGraduationTypes, postGraduationTypes)) {
        dispatch(outcomeSlice.fetchPostGraduationTypes());
      }

      // Fetch school data
      if (shouldFetchData(loadingStates.school.postGraduation, schoolPostGraduationData)) {
        dispatch(outcomeSlice.fetchSchoolPostGraduationOutcomes(schoolParams));
      }
      if (shouldFetchData(loadingStates.school.earlyExit, schoolEarlyExitData)) {
        dispatch(outcomeSlice.fetchSchoolEarlyExitData(schoolParams));
      }
      if (shouldFetchData(loadingStates.school.graduationCohort, schoolGraduationCohortData)) {
        dispatch(outcomeSlice.fetchSchoolGraduationCohortData(schoolParams));
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
    dispatch, schoolId, school,
    measurementsLoading, measurements,
    loadingStates, schoolParams, stateParams,
    schoolPostGraduationData, schoolEarlyExitData, schoolGraduationCohortData,
    statePostGraduationData, stateEarlyExitData, stateGraduationCohortData,
    postGraduationTypes
  ]);

  return (
    <>
      <SectionTitle 
        displayName={PAGE_REGISTRY.school.outcomes.displayName}
        schoolName={school?.name}
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