import React, { useEffect, useMemo } from 'react';
import { Box, CircularProgress, useTheme, useMediaQuery, Divider } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import SectionTitle from '@/components/ui/SectionTitle';

// Store imports
import { 
  selectCurrentDistrict,
  selectLocationLoading
} from '@/store/slices/locationSlice';
import * as staffSlice from '@/store/slices/staffSlice';
import * as classSizeSlice from '@/store/slices/classSizeSlice';
import * as enrollmentSlice from '@/store/slices/enrollmentSlice';
import { 
  fetchAllMeasurements,
  selectAllMeasurements,
  selectMeasurementsLoadingState 
} from '@/store/slices/measurementSlice';
import * as safetySlice from '@/store/slices/safetySlice';

// Component imports
import PercentStaffTeachersCard from './staff/PercentStaffTeachersCard';
import AverageClassSizeCard from './staff/AverageClassSizeCard';
import TeacherAverageSalaryCard from './staff/TeacherAverageSalaryCard';
import StaffTypeTable from './staff/StaffTypeTable';
import StaffTypeHistoryChart from './staff/StaffTypeHistoryChart';
import TeacherEducation from './staff/TeacherEducation';
import TeacherSalaryBand from './staff/TeacherSalaryBand';
import TeacherAverageSalaryChart from './staff/TeacherAverageSalaryChart';
import AverageClassSizeChart from './staff/AverageClassSizeChart';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';

const Staff: React.FC = () => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  // District and location data
  const district = useAppSelector(selectCurrentDistrict);
  const districtId = district?.id;
  const districtLoading = useAppSelector(selectLocationLoading);

  // Memoize parameters
  const districtParams = useMemo(() => ({ district_id: districtId }), [districtId]);
  const stateParams = useMemo(() => ({}), []);

  const measurementsLoading = useAppSelector(selectMeasurementsLoadingState);
  const measurements = useAppSelector(selectAllMeasurements);

  // Data selectors
  const {
    staffTypes,
    teacherEducationTypes,
    teacherSalaryBandTypes,
    districtStaffData,
    stateStaffData,
    districtTeacherEducationData,
    stateTeacherEducationData,
    districtTeacherAverageSalaryData,
    stateTeacherAverageSalaryData,
    districtTeacherSalaryBandData,
    stateTeacherSalaryBandData,
    districtClassSizeData,
    stateClassSizeData,
    districtEnrollmentData,
    stateEnrollmentData
  } = useAppSelector(state => ({
    staffTypes: staffSlice.selectStaffTypes(state),
    teacherEducationTypes: staffSlice.selectTeacherEducationTypes(state),
    teacherSalaryBandTypes: staffSlice.selectTeacherSalaryBandTypes(state),
    districtStaffData: staffSlice.selectDistrictStaffData(state, districtParams),
    stateStaffData: staffSlice.selectStateStaffData(state, stateParams),
    districtTeacherEducationData: staffSlice.selectDistrictTeacherEducationData(state, districtParams),
    stateTeacherEducationData: staffSlice.selectStateTeacherEducationData(state, stateParams),
    districtTeacherAverageSalaryData: staffSlice.selectDistrictTeacherAverageSalaryData(state, districtParams),
    stateTeacherAverageSalaryData: staffSlice.selectStateTeacherAverageSalaryData(state, stateParams),
    districtTeacherSalaryBandData: staffSlice.selectDistrictTeacherSalaryBandData(state, districtParams),
    stateTeacherSalaryBandData: staffSlice.selectStateTeacherSalaryBandData(state, stateParams),
    districtClassSizeData: classSizeSlice.selectDistrictClassSizeData(state, districtParams),
    stateClassSizeData: classSizeSlice.selectStateClassSizeData(state, stateParams),
    districtEnrollmentData: enrollmentSlice.selectTownEnrollment(state, districtParams),
    stateEnrollmentData: enrollmentSlice.selectStateTownEnrollment(state, stateParams)
  }));

  // Loading states
  const loadingStates = useAppSelector(state => ({
    types: {
      staffTypes: staffSlice.selectStaffTypesLoadingStatus(state),
      teacherEducationTypes: staffSlice.selectTeacherEducationTypesLoadingStatus(state),
      teacherSalaryBandTypes: staffSlice.selectTeacherSalaryBandTypesLoadingStatus(state)
    },
    district: {
      staff: staffSlice.selectDistrictStaffLoadingStatus(state, districtParams),
      teacherEducation: staffSlice.selectDistrictTeacherEducationLoadingStatus(state, districtParams),
      teacherAverageSalary: staffSlice.selectDistrictTeacherAverageSalaryLoadingStatus(state, districtParams),
      teacherSalaryBand: staffSlice.selectDistrictTeacherSalaryBandLoadingStatus(state, districtParams),
      classSize: classSizeSlice.selectDistrictClassSizeLoadingStatus(state, districtParams),
      enrollment: enrollmentSlice.selectTownEnrollmentLoadingStatus(state, districtParams)
    },
    state: {
      staff: staffSlice.selectStateStaffLoadingStatus(state, stateParams),
      teacherEducation: staffSlice.selectStateTeacherEducationLoadingStatus(state, stateParams),
      teacherAverageSalary: staffSlice.selectStateTeacherAverageSalaryLoadingStatus(state, stateParams),
      teacherSalaryBand: staffSlice.selectStateTeacherSalaryBandLoadingStatus(state, stateParams),
      classSize: classSizeSlice.selectStateClassSizeLoadingStatus(state, stateParams),
      enrollment: enrollmentSlice.selectStateTownEnrollmentLoadingStatus(state, stateParams)
    }
  }));

  // Check if any data is still loading
  const isLoading = useMemo(() => 
    districtLoading || 
    Object.values(loadingStates.types).some(state => state !== staffSlice.LoadingState.SUCCEEDED) ||
    Object.values(loadingStates.district).some(state => state !== staffSlice.LoadingState.SUCCEEDED) ||
    Object.values(loadingStates.state).some(state => state !== staffSlice.LoadingState.SUCCEEDED),
    [districtLoading, loadingStates]
  );

  // Helper function to check if data needs to be fetched
  const shouldFetchData = (loadingState: staffSlice.LoadingState, data: any[]) => 
    loadingState === staffSlice.LoadingState.IDLE && data.length === 0;

  useEffect(() => {
    if (!districtId) return;

    // Only fetch other data if we have the district data
    if (district) {
      // Fetch measurements if needed
      if (measurementsLoading === safetySlice.LoadingState.IDLE && measurements.length === 0) {
        dispatch(fetchAllMeasurements({ entityId: String(districtId), entityType: 'district' }));
      }

      // Fetch types
      if (shouldFetchData(loadingStates.types.staffTypes, staffTypes)) {
        dispatch(staffSlice.fetchStaffTypes());
      }
      if (shouldFetchData(loadingStates.types.teacherEducationTypes, teacherEducationTypes)) {
        dispatch(staffSlice.fetchTeacherEducationTypes());
      }
      if (shouldFetchData(loadingStates.types.teacherSalaryBandTypes, teacherSalaryBandTypes)) {
        dispatch(staffSlice.fetchTeacherSalaryBandTypes());
      }

      // Fetch district data
      if (shouldFetchData(loadingStates.district.staff, districtStaffData)) {
        dispatch(staffSlice.fetchDistrictStaffData(districtParams));
      }
      if (shouldFetchData(loadingStates.district.teacherEducation, districtTeacherEducationData)) {
        dispatch(staffSlice.fetchDistrictTeacherEducationData(districtParams));
      }
      if (shouldFetchData(loadingStates.district.teacherAverageSalary, districtTeacherAverageSalaryData)) {
        dispatch(staffSlice.fetchDistrictTeacherAverageSalary(districtParams));
      }
      if (shouldFetchData(loadingStates.district.teacherSalaryBand, districtTeacherSalaryBandData)) {
        dispatch(staffSlice.fetchDistrictTeacherSalaryBandData(districtParams));
      }
      if (shouldFetchData(loadingStates.district.classSize, districtClassSizeData)) {
        dispatch(classSizeSlice.fetchDistrictClassSizeData(districtParams));
      }
      if (shouldFetchData(loadingStates.district.enrollment, districtEnrollmentData)) {
        dispatch(enrollmentSlice.fetchTownEnrollment(districtParams));
      }

      // Fetch state data
      if (shouldFetchData(loadingStates.state.staff, stateStaffData)) {
        dispatch(staffSlice.fetchStateStaffData(stateParams));
      }
      if (shouldFetchData(loadingStates.state.teacherEducation, stateTeacherEducationData)) {
        dispatch(staffSlice.fetchStateTeacherEducationData(stateParams));
      }
      if (shouldFetchData(loadingStates.state.teacherAverageSalary, stateTeacherAverageSalaryData)) {
        dispatch(staffSlice.fetchStateTeacherAverageSalary(stateParams));
      }
      if (shouldFetchData(loadingStates.state.teacherSalaryBand, stateTeacherSalaryBandData)) {
        dispatch(staffSlice.fetchStateTeacherSalaryBandData(stateParams));
      }
      if (shouldFetchData(loadingStates.state.classSize, stateClassSizeData)) {
        dispatch(classSizeSlice.fetchStateClassSizeData(stateParams));
      }
      if (shouldFetchData(loadingStates.state.enrollment, stateEnrollmentData)) {
        dispatch(enrollmentSlice.fetchStateTownEnrollment(stateParams));
      }
    }
  }, [
    dispatch, districtId, district,
    measurementsLoading, measurements, loadingStates,
    districtParams, stateParams, staffTypes, teacherEducationTypes,
    teacherSalaryBandTypes, districtStaffData, districtTeacherEducationData,
    districtTeacherAverageSalaryData, districtTeacherSalaryBandData,
    stateStaffData, stateTeacherEducationData, stateTeacherAverageSalaryData,
    stateTeacherSalaryBandData, districtClassSizeData, stateClassSizeData,
    districtEnrollmentData, stateEnrollmentData
  ]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <SectionTitle 
        displayName={PAGE_REGISTRY.district.staff.displayName}
        districtName={district?.name}
      />
      
      <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Top Row - Cards */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3,
          '& > *': { flex: 1 }
        }}>
          <Box sx={{ flex: 1 }}>
            <PercentStaffTeachersCard />
          </Box>
          <Box sx={{ flex: 1 }}>
            <TeacherAverageSalaryCard />
          </Box>
          <Box sx={{ flex: 1 }}>
            <AverageClassSizeCard />
          </Box>
        </Box>

        <Divider  />

        {/* Teacher Average Salary Chart */}
        <Box sx={{ flex: 1 }}>
          <TeacherAverageSalaryChart />
        </Box>

        <Divider  />

        {/* Staff Type Section */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', lg: 'row' },
          gap: 3
        }}>
          <Box sx={{ flex: 1 }}>
            <StaffTypeTable />
          </Box>
          <Box sx={{ 
            flex: 1,
            pl: { lg: 1 }  // Add padding on the left for desktop view to maintain spacing
          }}>
            <StaffTypeHistoryChart />
          </Box>
        </Box>

        <Divider />

        {/* Teacher Info Section */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', lg: 'row' },
          gap: 3
        }}>
          <Box sx={{ flex: 1 }}>
            <TeacherEducation />
          </Box>
          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', lg: 'block' } }} />
          <Divider sx={{ display: { xs: 'block', lg: 'none' }, borderBottomWidth: 1 }} />
          <Box sx={{ flex: 1 }}>
            <TeacherSalaryBand />
          </Box>
        </Box>

        <Divider />

        {/* Average Class Size Chart */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', lg: 'row' },
          gap: 3
        }}>
          <Box sx={{ flex: 1 }}>
            <AverageClassSizeChart />
          </Box>
          <Box sx={{ flex: 1 }} />
        </Box>
      </Box>
    </>
  );
};

export default Staff; 