import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, Divider, useTheme, useMediaQuery } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCurrentSchool,
  selectLocationLoading,
  fetchAllSchoolData
} from '@/store/slices/locationSlice';
import SectionTitle from '@/components/ui/SectionTitle';
import * as safetySlice from '@/store/slices/safetySlice';
import { EARLIEST_YEAR } from '@/utils/safetyCalculations';

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
  const { id, category } = useParams<{ id: string; category?: string }>();
  const navigate = useNavigate();
  const schoolId = id ? parseInt(id) : 0;
  const dispatch = useAppDispatch();
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Memoize the parameter objects to avoid recreating them on each render
  const schoolParams = useMemo(() => ({ school_id: schoolId }), [schoolId]);
  const stateParams = useMemo(() => ({}), []);
  
  // School and location data
  const school = useAppSelector(selectCurrentSchool);
  const schoolLoading = useAppSelector(selectLocationLoading);
  
  // Safety data selectors
  const schoolSafetyData = useAppSelector(state => safetySlice.selectSchoolSafetyData(state, schoolParams));
  const schoolHarassmentData = useAppSelector(state => safetySlice.selectSchoolHarassmentData(state, schoolParams));
  const schoolTruancyData = useAppSelector(state => safetySlice.selectSchoolTruancyData(state, schoolParams));
  const schoolSeclusionData = useAppSelector(state => safetySlice.selectSchoolSeclusionData(state, schoolParams));
  const schoolRestraintData = useAppSelector(state => safetySlice.selectSchoolRestraintData(state, schoolParams));
  const schoolBullyingData = useAppSelector(state => safetySlice.selectSchoolBullyingData(state, schoolParams));
  const schoolBullyingClassificationData = useAppSelector(state => safetySlice.selectSchoolBullyingClassificationData(state, schoolParams));
  const schoolBullyingImpactData = useAppSelector(state => safetySlice.selectSchoolBullyingImpactData(state, schoolParams));
  const schoolDisciplineCountData = useAppSelector(state => safetySlice.selectSchoolDisciplineCountData(state, schoolParams));
  const schoolDisciplineIncidentData = useAppSelector(state => safetySlice.selectSchoolDisciplineIncidentData(state, schoolParams));
  const schoolEnrollmentData = useAppSelector(state => safetySlice.selectSchoolEnrollmentData(state, schoolParams));

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
      safety: useAppSelector(state => safetySlice.selectSchoolSafetyIncidentsLoadingStatus(state, schoolParams)),
      harassment: useAppSelector(state => safetySlice.selectSchoolHarassmentIncidentsLoadingStatus(state, schoolParams)),
      truancy: useAppSelector(state => safetySlice.selectSchoolTruancyLoadingStatus(state, schoolParams)),
      seclusion: useAppSelector(state => safetySlice.selectSchoolSeclusionLoadingStatus(state, schoolParams)),
      restraint: useAppSelector(state => safetySlice.selectSchoolRestraintLoadingStatus(state, schoolParams)),
      bullying: useAppSelector(state => safetySlice.selectSchoolBullyingIncidentsLoadingStatus(state, schoolParams)),
      bullyingClassification: useAppSelector(state => safetySlice.selectSchoolBullyingClassificationsLoadingStatus(state, schoolParams)),
      bullyingImpact: useAppSelector(state => safetySlice.selectSchoolBullyingImpactsLoadingStatus(state, schoolParams)),
      disciplineCount: useAppSelector(state => safetySlice.selectSchoolDisciplineCountsLoadingStatus(state, schoolParams)),
      disciplineIncident: useAppSelector(state => safetySlice.selectSchoolDisciplineIncidentsLoadingStatus(state, schoolParams)),
      enrollment: useAppSelector(state => safetySlice.selectSchoolEnrollmentLoadingStatus(state, schoolParams))
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

  // Effect to sync URL with selected category
  useEffect(() => {
    if (!category && selectedSafetyPage) {
      // Clear selected category when visiting base safety page
      dispatch(safetySlice.setSelectedSafetyPage(null));
    } else if (category && !selectedSafetyPage) {
      // Only set the category if it's a valid safety page
      const validCategories = ['bullying', 'harassment', 'restraint', 'serious', 'suspension', 'truancy'];
      if (validCategories.includes(category)) {
        dispatch(safetySlice.setSelectedSafetyPage(category as safetySlice.SafetyPage));
      }
    }
  }, [category, selectedSafetyPage, dispatch]);

  // Helper function to check if data needs to be fetched
  const shouldFetchData = (loadingState: safetySlice.LoadingState, data: any[]) => {
    return loadingState === safetySlice.LoadingState.IDLE && data.length === 0;
  };

  useEffect(() => {
    if (!id) return;

    // Fetch school data if needed
    if(!schoolLoading && !school) {
      dispatch(fetchAllSchoolData(schoolId));
    }

    // Fetch school safety data
    const schoolDataFetches = [
      { condition: shouldFetchData(loadingStates.school.safety, schoolSafetyData), 
        action: () => dispatch(safetySlice.fetchSchoolSafetyIncidents(schoolParams)) },
      { condition: shouldFetchData(loadingStates.school.harassment, schoolHarassmentData), 
        action: () => dispatch(safetySlice.fetchSchoolHarassmentIncidents(schoolParams)) },
      { condition: shouldFetchData(loadingStates.school.truancy, schoolTruancyData), 
        action: () => dispatch(safetySlice.fetchSchoolTruancyData(schoolParams)) },
      { condition: shouldFetchData(loadingStates.school.seclusion, schoolSeclusionData), 
        action: () => dispatch(safetySlice.fetchSchoolSeclusions(schoolParams)) },
      { condition: shouldFetchData(loadingStates.school.restraint, schoolRestraintData), 
        action: () => dispatch(safetySlice.fetchSchoolRestraints(schoolParams)) },
      { condition: shouldFetchData(loadingStates.school.bullying, schoolBullyingData), 
        action: () => dispatch(safetySlice.fetchSchoolBullyingIncidents(schoolParams)) },
      { condition: shouldFetchData(loadingStates.school.bullyingClassification, schoolBullyingClassificationData), 
        action: () => dispatch(safetySlice.fetchSchoolBullyingClassifications(schoolParams)) },
      { condition: shouldFetchData(loadingStates.school.bullyingImpact, schoolBullyingImpactData), 
        action: () => dispatch(safetySlice.fetchSchoolBullyingImpacts(schoolParams)) },
      { condition: shouldFetchData(loadingStates.school.disciplineCount, schoolDisciplineCountData), 
        action: () => dispatch(safetySlice.fetchSchoolDisciplineCounts(schoolParams)) },
      { condition: shouldFetchData(loadingStates.school.disciplineIncident, schoolDisciplineIncidentData), 
        action: () => dispatch(safetySlice.fetchSchoolDisciplineIncidents(schoolParams)) },
      { condition: shouldFetchData(loadingStates.school.enrollment, schoolEnrollmentData), 
        action: () => dispatch(safetySlice.fetchSchoolEnrollmentData(schoolParams)) }
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
    [...schoolDataFetches, ...stateDataFetches].forEach(fetch => {
      if (fetch.condition) {
        fetch.action();
      }
    });
  }, [
    dispatch, id, schoolId, schoolLoading, school,
    loadingStates, schoolParams, stateParams,
    schoolSafetyData, schoolHarassmentData, schoolTruancyData,
    schoolSeclusionData, schoolRestraintData, schoolBullyingData,
    schoolBullyingClassificationData, schoolBullyingImpactData,
    schoolDisciplineCountData, schoolDisciplineIncidentData, schoolEnrollmentData,
    stateSafetyData, stateHarassmentData, stateTruancyData,
    stateSeclusionData, stateRestraintData, stateBullyingData,
    stateBullyingClassificationData, stateBullyingImpactData,
    stateDisciplineCountData, stateDisciplineIncidentData, stateEnrollmentData
  ]);

  // Check if any data is still loading
  const isLoading = useMemo(() => {
    return schoolLoading || 
      Object.values(loadingStates.school).some(state => state !== safetySlice.LoadingState.SUCCEEDED) ||
      Object.values(loadingStates.state).some(state => state !== safetySlice.LoadingState.SUCCEEDED);
  }, [schoolLoading, loadingStates]);

  // Determine if data is available for the school
  const hasDataAvailable = useMemo(() => {
    // Check if safety data exists for this school
    const hasSafetyData = schoolSafetyData.length > 0;
    const hasHarassmentData = schoolHarassmentData.length > 0;
    const hasTruancyData = schoolTruancyData.length > 0;
    const hasBullyingData = schoolBullyingData.length > 0;
    const hasRestraintData = schoolRestraintData.length > 0;
    const hasSeclusionData = schoolSeclusionData.length > 0;
    
    return hasSafetyData || hasHarassmentData || hasTruancyData || 
           hasBullyingData || hasRestraintData || hasSeclusionData;
  }, [
    schoolSafetyData, 
    schoolHarassmentData, 
    schoolTruancyData,
    schoolBullyingData,
    schoolRestraintData,
    schoolSeclusionData
  ]);

  // Determine earliest year of data (if any)
  const earliestDataYear = useMemo(() => {
    if (!hasDataAvailable) return null;
    
    const years = [
      ...schoolSafetyData.map(item => item.year),
      ...schoolHarassmentData.map(item => item.year),
      ...schoolTruancyData.map(item => item.year),
      ...schoolBullyingData.map(item => item.year),
      ...schoolRestraintData.map(item => item.year),
      ...schoolSeclusionData.map(item => item.year)
    ].filter(Boolean);
    
    return years.length > 0 ? Math.min(...years) : null;
  }, [
    hasDataAvailable, 
    schoolSafetyData, 
    schoolHarassmentData, 
    schoolTruancyData,
    schoolBullyingData,
    schoolRestraintData,
    schoolSeclusionData
  ]);

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
          isMobile ? (<></>) : (
            <DefaultCategoryDetails title="Select A Card For More Information">
              {!hasDataAvailable && (
                <Typography variant="body1">
                  No safety data is available for this school.
                </Typography>
              )}
              {hasDataAvailable && earliestDataYear && earliestDataYear > EARLIEST_YEAR && (
                <Typography variant="body1">
                  Note: Data before {earliestDataYear} is unavailable for this school.
                </Typography>
              )}
              {hasDataAvailable && (
                <Typography variant="body1">
                  Click on a safety category card to see detailed information.
                </Typography>
              )}
            </DefaultCategoryDetails>
          )
        );
    }
  };

  // Render data unavailability notice for mobile view
  const renderDataUnavailabilityNotice = () => {
    if (hasDataAvailable && (!earliestDataYear || earliestDataYear <= EARLIEST_YEAR)) return null;
    
    return (
      <>
        {!hasDataAvailable ? (
          <Typography variant="body1">
            Note: No safety data is available for this school.
          </Typography>
        ) : earliestDataYear && earliestDataYear > EARLIEST_YEAR ? (
          <Typography variant="body1">
            Note: Data before {earliestDataYear} is unavailable for this school.
          </Typography>
        ) : null}
      </>
    );
  };

  return (
    <>
      <SectionTitle>
        {school?.name || 'School'}
      </SectionTitle>
      
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
              {renderDataUnavailabilityNotice()}
              {renderDataUnavailabilityNotice() && <Divider sx={{mb: 2, mt: 2}}/>}
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