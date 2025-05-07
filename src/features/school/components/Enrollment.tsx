import React, { useEffect, useMemo } from 'react';
import { Box, Typography, Divider, CircularProgress } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCurrentSchool,
  selectLocationLoading
} from '@/store/slices/locationSlice';
import {
  fetchSchoolEnrollments,
  LoadingState,
  selectSchoolEnrollment,
  selectSchoolEnrollmentLoadingStatus
} from '@/store/slices/enrollmentSlice';

// Import the enrollment components
import SchoolEnrollmentChart from './enrollment/SchoolEnrollmentChart';
import SchoolEnrollmentDetails from './enrollment/SchoolEnrollmentDetails';
import SectionTitle from '@/components/ui/SectionTitle';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';

/**
 * Represents the School Enrollment page/feature.
 * Layout is responsive:
 * - On desktop: Details and charts display in two columns
 * - On mobile: Components stack in a single column
 */
const Enrollment: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // Get school data from Redux store
  const school = useAppSelector(selectCurrentSchool);
  const schoolLoading = useAppSelector(selectLocationLoading);
  
  // Get school ID for API calls
  const schoolId = school?.id;
  
  // School enrollment data
  const schoolEnrollmentLoading = useAppSelector(state => 
    selectSchoolEnrollmentLoadingStatus(state, { schoolId }));
  const schoolEnrollmentData = useAppSelector(state => 
    selectSchoolEnrollment(state, { schoolId }));
    
  // Helper to determine if we should fetch data
  const shouldFetchData = (loadingState: LoadingState, data: any[]) => {
    return loadingState === LoadingState.IDLE && data.length === 0;
  };

  // Load data if it's not already loaded
  useEffect(() => {
    if (!schoolId) return;

    // Only fetch data if we have the school data
    if (school) {
      // Fetch school enrollment data if needed
      if (shouldFetchData(schoolEnrollmentLoading, schoolEnrollmentData)) {
        dispatch(fetchSchoolEnrollments({ schoolId }));
      }
    }

  }, [
    schoolId, 
    school, 
    dispatch, 
    schoolEnrollmentLoading,
    schoolEnrollmentData
  ]);
  
  // Check if all data is loading
  const isLoading = schoolLoading || 
                    schoolEnrollmentLoading === LoadingState.LOADING;

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
      <SectionTitle 
        displayName={PAGE_REGISTRY.school.enrollment.displayName}
        schoolName={school?.name}
      />


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
            schoolId={school?.id} 
            enrollmentData={schoolEnrollmentData}
          />
        </Box>
        <Box sx={{ flex: { md: 1 }, width: '100%' }}>
          <SchoolEnrollmentDetails 
            schoolId={school?.id} 
            enrollmentData={schoolEnrollmentData}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Enrollment; 