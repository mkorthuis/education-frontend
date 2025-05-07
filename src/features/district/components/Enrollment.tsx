import React, { useEffect, useMemo } from 'react';
import { Box, Typography, Divider, CircularProgress } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCurrentDistrict, 
  selectCurrentSchools,
  selectCurrentTowns,
  selectLocationLoading
} from '@/store/slices/locationSlice';
import {
  fetchTownEnrollment,
  fetchStateTownEnrollment,
  LoadingState,
  selectTownEnrollment,
  selectTownEnrollmentLoadingStatus,
  selectStateTownEnrollment,
  selectStateTownEnrollmentLoadingStatus
} from '@/store/slices/enrollmentSlice';
import {
  fetchAllMeasurements,
  selectAllMeasurements,
  selectAllMeasurementsLoadingState
} from '@/store/slices/measurementSlice';

// Import the enrollment components directly with their full paths
import TownEnrollmentDetails from './enrollment/TownEnrollmentDetails';
import TownEnrollmentChart from './enrollment/TownEnrollmentChart';
import SchoolEnrollmentDetails from './enrollment/SchoolEnrollmentDetails';
import SchoolEnrollmentChart from './enrollment/SchoolEnrollmentChart';

/**
 * Represents the District Enrollment page/feature.
 * Layout is responsive:
 * - On desktop: Details and charts display in two columns
 * - On mobile: Components stack in a single column
 */
const Enrollment: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // Get district and schools data from Redux store
  const district = useAppSelector(selectCurrentDistrict);
  const schools = useAppSelector(selectCurrentSchools);
  const towns = useAppSelector(selectCurrentTowns);
  const districtLoading = useAppSelector(selectLocationLoading);
  
  // Get district ID for API calls
  const districtId = district?.id;
  
  // Get school IDs
  const schoolIds = schools.map(school => school.id);
  
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

  // Create memoized measurement params
  const measurementParams = useMemo(() => ({
    entityId: districtId?.toString() || '',
    entityType: 'district' as const
  }), [districtId]);

  // Measurement data
  const measurementsLoading = useAppSelector(state => 
    selectAllMeasurementsLoadingState(state, measurementParams));
  const measurements = useAppSelector(state => 
    selectAllMeasurements(state, measurementParams));
    
  // Helper to determine if we should fetch data
  const shouldFetchData = (loadingState: LoadingState, data: any[]) => {
    return loadingState === LoadingState.IDLE && data.length === 0;
  };

  // Load data if it's not already loaded
  useEffect(() => {
    if (!districtId) return;

    // Only fetch data if we have the district data
    if (district) {
      // Fetch town enrollment data for district if needed
      if (shouldFetchData(townEnrollmentLoading, townEnrollmentData)) {
        dispatch(fetchTownEnrollment({ district_id: districtId }));
      }
      
      // Fetch state-level town enrollment data if needed
      if (shouldFetchData(stateTownEnrollmentLoading, stateTownEnrollmentData)) {
        dispatch(fetchStateTownEnrollment({}));
      }

      // Fetch measurement data if needed
      if (shouldFetchData(measurementsLoading, measurements)) {
        dispatch(fetchAllMeasurements(measurementParams));
      }
    }

  }, [
    districtId, 
    district, 
    dispatch, 
    townEnrollmentLoading,
    townEnrollmentData,
    stateTownEnrollmentLoading,
    stateTownEnrollmentData,
    measurementsLoading,
    measurements,
    measurementParams
  ]);
  
  // Check if all data is loading
  const isLoading = districtLoading || 
                    townEnrollmentLoading === LoadingState.LOADING ||
                    stateTownEnrollmentLoading === LoadingState.LOADING ||
                    measurementsLoading === LoadingState.LOADING;

  // Show loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Enrollment Data for {district?.name || 'District'}
      </Typography>

      <Typography variant="body2" sx={{ mb: 2 }}>
        The <i>first graphs</i> display students <i>part of district towns</i>. The <i>second graphs</i> display students <i>enrolled in district schools</i>.
      </Typography>

      <Typography variant="body2" sx={{ mb: 2 }}>
        These numbers are often different from each another. Many districts send/recieve students to/from other districts. This is especially true in rural areas and higher grades.
      </Typography>

      <Divider sx={{ my: 3 }} />

      {/* Two columns on desktop, one column on mobile using flexbox */}
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          gap: 2 
        }}
      >
        <Box sx={{ flex: { md: 1 }, width: '100%' }}>
          <TownEnrollmentChart 
            districtId={district?.id} 
            enrollmentData={townEnrollmentData}
            stateEnrollmentData={stateTownEnrollmentData}
            towns={towns}
          />
        </Box>
        <Box sx={{ flex: { md: 1 }, width: '100%' }}>
          <TownEnrollmentDetails 
            districtId={district?.id} 
            enrollmentData={townEnrollmentData} 
            stateEnrollmentData={stateTownEnrollmentData}
            towns={towns}
          />
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />
      
      {/* Two columns on desktop, one column on mobile using flexbox */}
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          gap: 2 
        }}
      >
        <Box sx={{ flex: { md: 1 }, width: '100%' }}>
          <SchoolEnrollmentChart 
            measurements={measurements}
          />
        </Box>
        <Box sx={{ flex: { md: 1 }, width: '100%' }}>
          <SchoolEnrollmentDetails 
            measurements={measurements}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Enrollment; 