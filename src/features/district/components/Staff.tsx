import React, { useEffect, useMemo } from 'react';
import { Box, CircularProgress, Divider } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import SectionTitle from '@/components/ui/SectionTitle';
import LoadErrorAlert from '@/components/ui/LoadErrorAlert';
import { aggregateStatus, retryFailedLoads } from '@/store/utils/loadingState';

// Store imports
import { 
  selectCurrentDistrict,
  selectLocationLoading
} from '@/store/slices/locationSlice';
import * as staffSlice from '@/store/slices/staffSlice';
import * as classSizeSlice from '@/store/slices/classSizeSlice';
import { 
  fetchLatestMeasurements,
  selectLatestMeasurements,
  selectLatestMeasurementsLoadingState
} from '@/store/slices/measurementSlice';

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
import { downloadWorkbook } from '@/features/state/utils/excel';
import { entityFileName } from '@/features/entity/excel';
import { staffWorkbook } from '../workbooks/staffWorkbook';

const Staff: React.FC = () => {
  const dispatch = useAppDispatch();

  // District and location data
  const district = useAppSelector(selectCurrentDistrict);
  const districtId = district?.id;
  const districtLoading = useAppSelector(selectLocationLoading);

  // Memoize parameters
  const districtParams = useMemo(() => ({ district_id: districtId }), [districtId]);
  const stateParams = useMemo(() => ({}), []);

  const measurementsLoading = useAppSelector(state => 
    selectLatestMeasurementsLoadingState(state, {
      entityId: districtId?.toString() || '',
      entityType: 'district'
    })
  );
  const measurements = useAppSelector(state => 
    selectLatestMeasurements(state, {
      entityId: districtId?.toString() || '',
      entityType: 'district'
    })
  );

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
    stateClassSizeData
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
    stateClassSizeData: classSizeSlice.selectStateClassSizeData(state, stateParams)
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
      classSize: classSizeSlice.selectDistrictClassSizeLoadingStatus(state, districtParams)
    },
    state: {
      staff: staffSlice.selectStateStaffLoadingStatus(state, stateParams),
      teacherEducation: staffSlice.selectStateTeacherEducationLoadingStatus(state, stateParams),
      teacherAverageSalary: staffSlice.selectStateTeacherAverageSalaryLoadingStatus(state, stateParams),
      teacherSalaryBand: staffSlice.selectStateTeacherSalaryBandLoadingStatus(state, stateParams),
      classSize: classSizeSlice.selectStateClassSizeLoadingStatus(state, stateParams)
    }
  }));

  // Loading until every request succeeded; a failed request shows an error with Retry instead
  const loadStatus = aggregateStatus([
    ...Object.values(loadingStates.types),
    ...Object.values(loadingStates.district),
    ...Object.values(loadingStates.state)
  ]);
  const isLoading = districtLoading || loadStatus !== 'ready';
  const hasLoadError = !districtLoading && !!districtId && loadStatus === 'failed';

  // Helper function to check if data needs to be fetched
  const shouldFetchData = (loadingState: staffSlice.LoadingState, data: any[]) => 
    loadingState === staffSlice.LoadingState.IDLE && data.length === 0;

  useEffect(() => {
    if (!districtId) return;

    // Only fetch other data if we have the district data
    if (district) {
      // Fetch measurement data if needed
      if (shouldFetchData(measurementsLoading, measurements)) {
        dispatch(fetchLatestMeasurements({
          entityId: districtId.toString(),
          entityType: 'district'
        }));
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
    }
  }, [
    dispatch, districtId, district,
    measurementsLoading, measurements, loadingStates,
    districtParams, stateParams, staffTypes, teacherEducationTypes,
    teacherSalaryBandTypes, districtStaffData, districtTeacherEducationData,
    districtTeacherAverageSalaryData, districtTeacherSalaryBandData,
    stateStaffData, stateTeacherEducationData, stateTeacherAverageSalaryData,
    stateTeacherSalaryBandData, districtClassSizeData, stateClassSizeData
  ]);

  const displayName = PAGE_REGISTRY.district.staff.displayName;
  // Everything on the page as one workbook, with New Hampshire's figures beside the district's
  const downloadExcel = () => {
    if (!district) return;
    return downloadWorkbook(entityFileName('district', district.name, 'staff'), staffWorkbook({
      name: district.name,
      displayName,
      staffTypes,
      teacherEducationTypes,
      salaryBandTypes: teacherSalaryBandTypes,
      staff: districtStaffData,
      stateStaff: stateStaffData,
      teacherEducation: districtTeacherEducationData,
      stateTeacherEducation: stateTeacherEducationData,
      salary: districtTeacherAverageSalaryData,
      stateSalary: stateTeacherAverageSalaryData,
      salaryBands: districtTeacherSalaryBandData,
      stateSalaryBands: stateTeacherSalaryBandData,
      classSize: districtClassSizeData,
      stateClassSize: stateClassSizeData,
    }));
  };

  if (hasLoadError) {
    return (
      <>
        <SectionTitle
          pageTitle
          displayName={PAGE_REGISTRY.district.staff.displayName}
          districtName={district?.name}
        />
        <LoadErrorAlert message="Staff data could not be loaded." onRetry={() => dispatch(retryFailedLoads())} />
      </>
    );
  }

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
        pageTitle
        displayName={displayName}
        districtName={district?.name}
        onDownload={downloadExcel}
        downloadReady={!!district}
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