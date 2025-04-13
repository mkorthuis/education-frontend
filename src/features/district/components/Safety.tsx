import React, { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Divider } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCurrentDistrict,
  selectLocationLoading,
  fetchAllDistrictData,
  selectCurrentSchools
} from '@/store/slices/locationSlice';
import SectionTitle from '@/components/ui/SectionTitle';
import * as safetySlice from '@/store/slices/safetySlice';
import { EARLIEST_YEAR } from '../utils/safetyDataProcessing';

// Import card components
import BullyCard from './safety/card/BullyCard';
import HarassmentCard from './safety/card/HarassmentCard';
import TruancyCard from './safety/card/TruancyCard';
import SuspensionCard from './safety/card/SuspensionCard';
import RestraintCard from './safety/card/RestraintCard';
import SeriousSafetyCard from './safety/card/SeriousSafetyCard';

// Import category detail components
import BullyCategoryDetails from './safety/category/BullyCategoryDetails';
import HarassmentCategoryDetails from './safety/category/HarassmentCategoryDetails';
import RestraintCategoryDetails from './safety/category/RestraintCategoryDetails';
import SeriousSafetyCategoryDetails from './safety/category/SeriousSafetyCategoryDetails';
import SuspensionCategoryDetails from './safety/category/SuspensionCategoryDetails';
import TruancyCategoryDetails from './safety/category/TruancyCategoryDetails';
import DefaultCategoryDetails from './safety/category/DefaultCategoryDetails';

const Safety: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const districtId = id ? parseInt(id) : 0;
  const dispatch = useAppDispatch();
  
  // Memoize the parameter objects to avoid recreating them on each render
  const districtParams = useMemo(() => ({ district_id: districtId }), [districtId]);
  const stateParams = useMemo(() => ({}), []);
  
  // District and location data
  const district = useAppSelector(selectCurrentDistrict);
  const districtLoading = useAppSelector(selectLocationLoading);
  const schools = useAppSelector(selectCurrentSchools);
  
  // Safety data selectors
  const schoolSafetyData = useAppSelector(state => safetySlice.selectSchoolSafetyData(state, districtParams));
  const schoolHarassmentData = useAppSelector(state => safetySlice.selectSchoolHarassmentData(state, districtParams));
  const districtSafetyData = useAppSelector(state => safetySlice.selectDistrictSafetyData(state, districtParams));
  const districtHarassmentData = useAppSelector(state => safetySlice.selectDistrictHarassmentData(state, districtParams));
  const districtTruancyData = useAppSelector(state => safetySlice.selectDistrictTruancyData(state, districtParams));
  const districtSeclusionData = useAppSelector(state => safetySlice.selectDistrictSeclusionData(state, districtParams));
  const districtRestraintData = useAppSelector(state => safetySlice.selectDistrictRestraintData(state, districtParams));
  const districtBullyingData = useAppSelector(state => safetySlice.selectDistrictBullyingData(state, districtParams));
  const districtBullyingClassificationData = useAppSelector(state => safetySlice.selectDistrictBullyingClassificationData(state, districtParams));
  const districtBullyingImpactData = useAppSelector(state => safetySlice.selectDistrictBullyingImpactData(state, districtParams));
  const districtDisciplineCountData = useAppSelector(state => safetySlice.selectDistrictDisciplineCountData(state, districtParams));
  const districtDisciplineIncidentData = useAppSelector(state => safetySlice.selectDistrictDisciplineIncidentData(state, districtParams));
  const districtEnrollmentData = useAppSelector(state => safetySlice.selectDistrictEnrollmentData(state, districtParams));

  // State data selectors - used for comparison
  const stateSafetyData = useAppSelector(state => safetySlice.selectStateSafetyData(state, stateParams));
  const stateHarassmentData = useAppSelector(state => safetySlice.selectStateHarassmentData(state, stateParams));
  const stateTruancyData = useAppSelector(state => safetySlice.selectStateTruancyData(state, stateParams));
  const stateSeclusionData = useAppSelector(state => safetySlice.selectStateSeclusionData(state, stateParams));
  const stateRestraintData = useAppSelector(state => safetySlice.selectStateRestraintData(state, stateParams));
  const stateBullyingData = useAppSelector(state => safetySlice.selectStateBullyingData(state, stateParams));
  const stateBullyingClassificationData = useAppSelector(state => safetySlice.selectStateBullyingClassificationData(state, stateParams));
  const stateBullyingImpactData = useAppSelector(state => safetySlice.selectStateBullyingImpactData(state, stateParams));
  const stateDisciplineCountData = useAppSelector(state => safetySlice.selectStateDisciplineCountData(state, stateParams));
  const stateDisciplineIncidentData = useAppSelector(state => safetySlice.selectStateDisciplineIncidentData(state, stateParams));
  const stateEnrollmentData = useAppSelector(state => safetySlice.selectStateEnrollmentData(state, stateParams));

  // Loading states - consolidated to reduce complexity
  const loadingStates = {
    school: {
      safety: useAppSelector(state => safetySlice.selectSchoolSafetyIncidentsLoadingStatus(state, districtParams)),
      harassment: useAppSelector(state => safetySlice.selectSchoolHarassmentIncidentsLoadingStatus(state, districtParams))
    },
    district: {
      safety: useAppSelector(state => safetySlice.selectDistrictSafetyIncidentsLoadingStatus(state, districtParams)),
      harassment: useAppSelector(state => safetySlice.selectDistrictHarassmentIncidentsLoadingStatus(state, districtParams)),
      truancy: useAppSelector(state => safetySlice.selectDistrictTruancyLoadingStatus(state, districtParams)),
      seclusion: useAppSelector(state => safetySlice.selectDistrictSeclusionLoadingStatus(state, districtParams)),
      restraint: useAppSelector(state => safetySlice.selectDistrictRestraintLoadingStatus(state, districtParams)),
      bullying: useAppSelector(state => safetySlice.selectDistrictBullyingIncidentsLoadingStatus(state, districtParams)),
      bullyingClassification: useAppSelector(state => safetySlice.selectDistrictBullyingClassificationsLoadingStatus(state, districtParams)),
      bullyingImpact: useAppSelector(state => safetySlice.selectDistrictBullyingImpactsLoadingStatus(state, districtParams)),
      disciplineCount: useAppSelector(state => safetySlice.selectDistrictDisciplineCountsLoadingStatus(state, districtParams)),
      disciplineIncident: useAppSelector(state => safetySlice.selectDistrictDisciplineIncidentsLoadingStatus(state, districtParams)),
      enrollment: useAppSelector(state => safetySlice.selectDistrictEnrollmentLoadingStatus(state, districtParams))
    },
    state: {
      safety: useAppSelector(state => safetySlice.selectStateSafetyIncidentsLoadingStatus(state, stateParams)),
      harassment: useAppSelector(state => safetySlice.selectStateHarassmentIncidentsLoadingStatus(state, stateParams)),
      truancy: useAppSelector(state => safetySlice.selectStateTruancyLoadingStatus(state, stateParams)),
      seclusion: useAppSelector(state => safetySlice.selectStateSeclusionLoadingStatus(state, stateParams)),
      restraint: useAppSelector(state => safetySlice.selectStateRestraintLoadingStatus(state, stateParams)),
      bullying: useAppSelector(state => safetySlice.selectStateBullyingIncidentsLoadingStatus(state, stateParams)),
      bullyingClassification: useAppSelector(state => safetySlice.selectStateBullyingClassificationsLoadingStatus(state, stateParams)),
      bullyingImpact: useAppSelector(state => safetySlice.selectStateBullyingImpactsLoadingStatus(state, stateParams)),
      disciplineCount: useAppSelector(state => safetySlice.selectStateDisciplineCountsLoadingStatus(state, stateParams)),
      disciplineIncident: useAppSelector(state => safetySlice.selectStateDisciplineIncidentsLoadingStatus(state, stateParams)),
      enrollment: useAppSelector(state => safetySlice.selectStateEnrollmentLoadingStatus(state, stateParams))
    }
  };

  const selectedSafetyPage = useAppSelector(safetySlice.selectSelectedSafetyPage);

  // Helper function to check if data needs to be fetched
  const shouldFetchData = (loadingState: safetySlice.LoadingState, data: any[]) => {
    return loadingState === safetySlice.LoadingState.IDLE && data.length === 0;
  };

  useEffect(() => {
    if (!id) return;

    // Fetch district data if needed
    if (!districtLoading && !district) {
      dispatch(fetchAllDistrictData(districtId));
    }

    // Fetch school data
    if (shouldFetchData(loadingStates.school.harassment, schoolHarassmentData)) {
      dispatch(safetySlice.fetchSchoolHarassmentIncidents(districtParams));
    }
    
    if (shouldFetchData(loadingStates.school.safety, schoolSafetyData)) {
      dispatch(safetySlice.fetchSchoolSafetyIncidents(districtParams));
    }

    // Fetch district data
    const districtDataFetches = [
      { condition: shouldFetchData(loadingStates.district.safety, districtSafetyData), 
        action: () => dispatch(safetySlice.fetchDistrictSafetyIncidents(districtParams)) },
      { condition: shouldFetchData(loadingStates.district.harassment, districtHarassmentData), 
        action: () => dispatch(safetySlice.fetchDistrictHarassmentIncidents(districtParams)) },
      { condition: shouldFetchData(loadingStates.district.truancy, districtTruancyData), 
        action: () => dispatch(safetySlice.fetchDistrictTruancyData(districtParams)) },
      { condition: shouldFetchData(loadingStates.district.seclusion, districtSeclusionData), 
        action: () => dispatch(safetySlice.fetchDistrictSeclusions(districtParams)) },
      { condition: shouldFetchData(loadingStates.district.restraint, districtRestraintData), 
        action: () => dispatch(safetySlice.fetchDistrictRestraints(districtParams)) },
      { condition: shouldFetchData(loadingStates.district.bullying, districtBullyingData), 
        action: () => dispatch(safetySlice.fetchDistrictBullyingIncidents(districtParams)) },
      { condition: shouldFetchData(loadingStates.district.bullyingClassification, districtBullyingClassificationData), 
        action: () => dispatch(safetySlice.fetchDistrictBullyingClassifications(districtParams)) },
      { condition: shouldFetchData(loadingStates.district.bullyingImpact, districtBullyingImpactData), 
        action: () => dispatch(safetySlice.fetchDistrictBullyingImpacts(districtParams)) },
      { condition: shouldFetchData(loadingStates.district.disciplineCount, districtDisciplineCountData), 
        action: () => dispatch(safetySlice.fetchDistrictDisciplineCounts(districtParams)) },
      { condition: shouldFetchData(loadingStates.district.disciplineIncident, districtDisciplineIncidentData), 
        action: () => dispatch(safetySlice.fetchDistrictDisciplineIncidents(districtParams)) },
      { condition: shouldFetchData(loadingStates.district.enrollment, districtEnrollmentData), 
        action: () => dispatch(safetySlice.fetchDistrictEnrollmentData(districtParams)) }
    ];

    // Fetch state data
    const stateDataFetches = [
      { condition: shouldFetchData(loadingStates.state.safety, stateSafetyData), 
        action: () => dispatch(safetySlice.fetchStateSafetyIncidents(stateParams)) },
      { condition: shouldFetchData(loadingStates.state.harassment, stateHarassmentData), 
        action: () => dispatch(safetySlice.fetchStateHarassmentIncidents(stateParams)) },
      { condition: shouldFetchData(loadingStates.state.truancy, stateTruancyData), 
        action: () => dispatch(safetySlice.fetchStateTruancyData(stateParams)) },
      { condition: shouldFetchData(loadingStates.state.seclusion, stateSeclusionData), 
        action: () => dispatch(safetySlice.fetchStateSeclusions(stateParams)) },
      { condition: shouldFetchData(loadingStates.state.restraint, stateRestraintData), 
        action: () => dispatch(safetySlice.fetchStateRestraints(stateParams)) },
      { condition: shouldFetchData(loadingStates.state.bullying, stateBullyingData), 
        action: () => dispatch(safetySlice.fetchStateBullyingIncidents(stateParams)) },
      { condition: shouldFetchData(loadingStates.state.bullyingClassification, stateBullyingClassificationData), 
        action: () => dispatch(safetySlice.fetchStateBullyingClassifications(stateParams)) },
      { condition: shouldFetchData(loadingStates.state.bullyingImpact, stateBullyingImpactData), 
        action: () => dispatch(safetySlice.fetchStateBullyingImpacts(stateParams)) },
      { condition: shouldFetchData(loadingStates.state.disciplineCount, stateDisciplineCountData), 
        action: () => dispatch(safetySlice.fetchStateDisciplineCounts(stateParams)) },
      { condition: shouldFetchData(loadingStates.state.disciplineIncident, stateDisciplineIncidentData), 
        action: () => dispatch(safetySlice.fetchStateDisciplineIncidents(stateParams)) },
      { condition: shouldFetchData(loadingStates.state.enrollment, stateEnrollmentData), 
        action: () => dispatch(safetySlice.fetchStateEnrollmentData(stateParams)) }
    ];

    // Execute all necessary fetches
    [...districtDataFetches, ...stateDataFetches].forEach(fetch => {
      if (fetch.condition) {
        fetch.action();
      }
    });
  }, [
    dispatch, id, districtId, districtLoading, district,
    loadingStates, districtParams, stateParams,
    schoolSafetyData, schoolHarassmentData,
    districtSafetyData, districtHarassmentData, districtTruancyData,
    districtSeclusionData, districtRestraintData, districtBullyingData,
    districtBullyingClassificationData, districtBullyingImpactData,
    districtDisciplineCountData, districtDisciplineIncidentData, districtEnrollmentData,
    stateSafetyData, stateHarassmentData, stateTruancyData,
    stateSeclusionData, stateRestraintData, stateBullyingData,
    stateBullyingClassificationData, stateBullyingImpactData,
    stateDisciplineCountData, stateDisciplineIncidentData, stateEnrollmentData
  ]);

  // Check if any data is still loading
  const isLoading = useMemo(() => {
    return districtLoading || 
      Object.values(loadingStates.district).some(state => state !== safetySlice.LoadingState.SUCCEEDED) ||
      Object.values(loadingStates.state).some(state => state !== safetySlice.LoadingState.SUCCEEDED) ||
      Object.values(loadingStates.school).some(state => state !== safetySlice.LoadingState.SUCCEEDED);
  }, [districtLoading, loadingStates]);

  // Process school harassment data to find earliest years
  const getSchoolsWithEarliestHarassmentYear = useMemo(() => {
    // Early return if schools or data aren't loaded yet
    if (!schools.length || !schoolHarassmentData.length) {
      return [];
    }

    // Create a map to store the earliest year for each school
    const schoolYearMap = new Map<number, number>();

    // Process harassment data to find earliest year for each school
    schoolHarassmentData.forEach(item => {
      const schoolId = item.school_id;
      const year = item.year;
      
      // If this school isn't in our map yet, or this year is earlier than what we have
      if (!schoolYearMap.has(schoolId) || year < schoolYearMap.get(schoolId)!) {
        schoolYearMap.set(schoolId, year);
      }
    });

    // Create the result array with school name and earliest year
    return schools.map(school => ({
      id: school.id,
      name: school.name,
      earliestYear: schoolYearMap.get(school.id) || null
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [schools, schoolHarassmentData]);

  // Filter schools to exclude those with data from EARLIEST_YEAR
  const filteredSchools = useMemo(() => {
    return getSchoolsWithEarliestHarassmentYear.filter(
      school => !school.earliestYear || school.earliestYear > EARLIEST_YEAR
    );
  }, [getSchoolsWithEarliestHarassmentYear]);

  // Card container styling for responsive layout
  const cardContainerStyles = {
    marginRight: { xs: 0, md: '16px' }, 
    display: 'flex', 
    flexDirection: { 
      xs: selectedSafetyPage ? 'column' : 'column', 
      md: 'column' 
    },
    flexWrap: { xs: 'nowrap', md: 'nowrap' },
    width: { xs: '100%', md: '300px'}, 
    gap: 0,
    flexShrink: 0,
    mb: selectedSafetyPage ? 2 : 0,
    justifyContent: 'flex-start'
  };

  // Styles for card rows on mobile when safety category is selected
  const firstRowStyles = {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    mb: selectedSafetyPage ? 1 : 0
  };
  
  const secondRowStyles = {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
  };

  // Function to render the appropriate category details based on selection
  const renderCategoryDetails = () => {
    switch(selectedSafetyPage) {
      case 'bullying':
        return <BullyCategoryDetails />;
      case 'harassment':
        return <HarassmentCategoryDetails />;
      case 'restraint':
        return <RestraintCategoryDetails />;
      case 'serious':
        return <SeriousSafetyCategoryDetails />;
      case 'suspension':
        return <SuspensionCategoryDetails />;
      case 'truancy':
        return <TruancyCategoryDetails />;
      default:
        return (
          <DefaultCategoryDetails title="Select A Card For More Information">
            {filteredSchools.length > 0 && (
              <>
                <Typography variant="body1">
                  Note: The Following Data is Unavailable:
                </Typography>
                <Box component="ul" sx={{pl: 3, mt: 1}}>
                  {filteredSchools.map((school) => (
                    <Typography component="li" variant="body2" key={school.id}>
                      {school.earliestYear 
                        ? `${school.name}: Data Before ${school.earliestYear}`
                        : `${school.name}: No Safety Data`}
                    </Typography>
                  ))}
                </Box>
              </>
            )}
          </DefaultCategoryDetails>
        );
    }
  };

  // Render school unavailability notice for mobile view
  const renderSchoolUnavailabilityNotice = () => {
    if (filteredSchools.length === 0) return null;
    
    return (
      <>
        <Typography variant="body1">
          Note: Following Data is Unavailable:
        </Typography>
        <Box component="ul" sx={{pl: 3, mt: 1}}>
          {filteredSchools.map((school) => (
            <Typography component="li" variant="body2" key={school.id}>
              {school.earliestYear 
                ? `${school.name}: Data Before ${school.earliestYear}`
                : `${school.name}: No Safety Data`}
            </Typography>
          ))}
        </Box>
      </>
    );
  };

  return (
    <>
      <SectionTitle>{district?.name || 'District'} School District</SectionTitle>
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'flex-start' }}>
          {/* Mobile instruction text - only visible on mobile and when no subject is selected */}  
          {!selectedSafetyPage && (
            <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 1 }}>
              <Typography variant="body1" sx={{mb: 2}}>
                Please Click A Card For More Information
              </Typography>
              <Divider sx={{mb: 2}}/>
              {renderSchoolUnavailabilityNotice()}
              <Divider sx={{mb: 2}}/>
            </Box>
          )}
          
          <Box sx={cardContainerStyles}>
            {selectedSafetyPage ? (
              // On mobile with safety category selected, show cards in two rows
              <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                <Box sx={firstRowStyles}>
                  <BullyCard />
                  <HarassmentCard />
                  <SuspensionCard />
                </Box>
                <Box sx={secondRowStyles}>
                  <RestraintCard />
                  <TruancyCard />
                  <SeriousSafetyCard />
                </Box>
              </Box>
            ) : null}
            
            {/* Standard display for desktop or mobile with no category selected */}
            <Box sx={{ display: { xs: selectedSafetyPage ? 'none' : 'block', md: 'block' } }}>
              <BullyCard />
              <HarassmentCard />
              <SuspensionCard />
              <RestraintCard />
              <TruancyCard />
              <SeriousSafetyCard />
            </Box>
          </Box>
          {renderCategoryDetails()}
        </Box>
      )}
    </>
  );
};

export default Safety; 