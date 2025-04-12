import React, { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCurrentDistrict,
  selectLocationLoading,
  fetchAllDistrictData 
} from '@/store/slices/locationSlice';
import SectionTitle from '@/components/ui/SectionTitle';
import * as safetySlice from '@/store/slices/safetySlice';
import BullyCard from './safety/card/BullyCard';
import HarassmentCard from './safety/card/HarassmentCard';
import TruancyCard from './safety/card/TruancyCard';
import SuspensionCard from './safety/card/SuspensionCard';
import RestraintCard from './safety/card/RestraintCard';
import SeriousSafetyCard from './safety/card/SeriousSafetyCard';

// Import all category detail components
import BullyCategoryDetails from './safety/category/BullyCategoryDetails';
import HarassmentCategoryDetails from './safety/category/HarassmentCategoryDetails';
import RestraintCategoryDetails from './safety/category/RestraintCategoryDetails';
import SeriousSafetyCategoryDetails from './safety/category/SeriousSafetyCategoryDetails';
import SuspensionCategoryDetails from './safety/category/SuspensionCategoryDetails';
import TruancyCategoryDetails from './safety/category/TruancyCategoryDetails';

const Safety: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const districtId = id ? parseInt(id) : 0;
  
  // Memoize the parameter object to avoid recreating it on each render
  const districtParams = useMemo(() => ({ district_id: districtId }), [districtId]);
  const stateParams = useMemo(() => ({}), []);
  
  // Use memoized parameters for all selectors
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

  // Get all safety data from the store using memoized state params
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
  
  // Get loading statuses with memoized params
  const districtSafetyLoading = useAppSelector(state => safetySlice.selectDistrictSafetyIncidentsLoadingStatus(state, districtParams));
  const districtHarassmentLoading = useAppSelector(state => safetySlice.selectDistrictHarassmentIncidentsLoadingStatus(state, districtParams));
  const districtTruancyLoading = useAppSelector(state => safetySlice.selectDistrictTruancyLoadingStatus(state, districtParams));
  const districtSeclusionLoading = useAppSelector(state => safetySlice.selectDistrictSeclusionLoadingStatus(state, districtParams));
  const districtRestraintLoading = useAppSelector(state => safetySlice.selectDistrictRestraintLoadingStatus(state, districtParams));
  const districtBullyingLoading = useAppSelector(state => safetySlice.selectDistrictBullyingIncidentsLoadingStatus(state, districtParams));
  const districtBullyingClassificationLoading = useAppSelector(state => safetySlice.selectDistrictBullyingClassificationsLoadingStatus(state, districtParams));
  const districtBullyingImpactLoading = useAppSelector(state => safetySlice.selectDistrictBullyingImpactsLoadingStatus(state, districtParams));
  const districtDisciplineCountLoading = useAppSelector(state => safetySlice.selectDistrictDisciplineCountsLoadingStatus(state, districtParams));
  const districtDisciplineIncidentLoading = useAppSelector(state => safetySlice.selectDistrictDisciplineIncidentsLoadingStatus(state, districtParams));

  const stateSafetyLoading = useAppSelector(state => safetySlice.selectStateSafetyIncidentsLoadingStatus(state, stateParams));
  const stateHarassmentLoading = useAppSelector(state => safetySlice.selectStateHarassmentIncidentsLoadingStatus(state, stateParams));
  const stateTruancyLoading = useAppSelector(state => safetySlice.selectStateTruancyLoadingStatus(state, stateParams));
  const stateSeclusionLoading = useAppSelector(state => safetySlice.selectStateSeclusionLoadingStatus(state, stateParams));
  const stateRestraintLoading = useAppSelector(state => safetySlice.selectStateRestraintLoadingStatus(state, stateParams));
  const stateBullyingLoading = useAppSelector(state => safetySlice.selectStateBullyingIncidentsLoadingStatus(state, stateParams));  
  const stateBullyingClassificationLoading = useAppSelector(state => safetySlice.selectStateBullyingClassificationsLoadingStatus(state, stateParams));
  const stateBullyingImpactLoading = useAppSelector(state => safetySlice.selectStateBullyingImpactsLoadingStatus(state, stateParams));
  const stateDisciplineCountLoading = useAppSelector(state => safetySlice.selectStateDisciplineCountsLoadingStatus(state, stateParams));
  const stateDisciplineIncidentLoading = useAppSelector(state => safetySlice.selectStateDisciplineIncidentsLoadingStatus(state, stateParams));
  
  const selectedSafetyPage = useAppSelector(safetySlice.selectSelectedSafetyPage);

  const district = useAppSelector(selectCurrentDistrict);
  const districtLoading = useAppSelector(selectLocationLoading);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (id) {
      if(!districtLoading && !district) {
        dispatch(fetchAllDistrictData(districtId));
      }
      
      // Fetch all safety data if not already loaded
      if(districtSafetyLoading === safetySlice.LoadingState.IDLE && districtSafetyData.length === 0) {
        dispatch(safetySlice.fetchDistrictSafetyIncidents(districtParams));
      }
      
      if(districtHarassmentLoading === safetySlice.LoadingState.IDLE && districtHarassmentData.length === 0) {
        dispatch(safetySlice.fetchDistrictHarassmentIncidents(districtParams));
      }
      
      if(districtTruancyLoading === safetySlice.LoadingState.IDLE && districtTruancyData.length === 0) {
        dispatch(safetySlice.fetchDistrictTruancyData(districtParams));
      }
      
      if(districtSeclusionLoading === safetySlice.LoadingState.IDLE && districtSeclusionData.length === 0) {
        dispatch(safetySlice.fetchDistrictSeclusions(districtParams));
      }
      
      if(districtRestraintLoading === safetySlice.LoadingState.IDLE && districtRestraintData.length === 0) {
        dispatch(safetySlice.fetchDistrictRestraints(districtParams));
      }
      
      if(districtBullyingLoading === safetySlice.LoadingState.IDLE && districtBullyingData.length === 0) {
        dispatch(safetySlice.fetchDistrictBullyingIncidents(districtParams));
      }
      
      if(districtBullyingClassificationLoading === safetySlice.LoadingState.IDLE && districtBullyingClassificationData.length === 0) {
        dispatch(safetySlice.fetchDistrictBullyingClassifications(districtParams));
      }
      
      if(districtBullyingImpactLoading === safetySlice.LoadingState.IDLE && districtBullyingImpactData.length === 0) {
        dispatch(safetySlice.fetchDistrictBullyingImpacts(districtParams));
      }
      
      if(districtDisciplineCountLoading === safetySlice.LoadingState.IDLE && districtDisciplineCountData.length === 0) {
        dispatch(safetySlice.fetchDistrictDisciplineCounts(districtParams));
      }
      
      if(districtDisciplineIncidentLoading === safetySlice.LoadingState.IDLE && districtDisciplineIncidentData.length === 0) {
        dispatch(safetySlice.fetchDistrictDisciplineIncidents(districtParams));
      }

      if(stateSafetyLoading === safetySlice.LoadingState.IDLE && stateSafetyData.length === 0) {
        dispatch(safetySlice.fetchStateSafetyIncidents(stateParams));
      }
      
      if(stateHarassmentLoading === safetySlice.LoadingState.IDLE && stateHarassmentData.length === 0) {
        dispatch(safetySlice.fetchStateHarassmentIncidents(stateParams));
      }
      
      if(stateTruancyLoading === safetySlice.LoadingState.IDLE && stateTruancyData.length === 0) {
        dispatch(safetySlice.fetchStateTruancyData(stateParams));
      }

      if(stateSeclusionLoading === safetySlice.LoadingState.IDLE && stateSeclusionData.length === 0) {
        dispatch(safetySlice.fetchStateSeclusions(stateParams));
      }
      
      if(stateRestraintLoading === safetySlice.LoadingState.IDLE && stateRestraintData.length === 0) {
        dispatch(safetySlice.fetchStateRestraints(stateParams));
      }
      
      if(stateBullyingLoading === safetySlice.LoadingState.IDLE && stateBullyingData.length === 0) {
        dispatch(safetySlice.fetchStateBullyingIncidents(stateParams));
      }

      if(stateBullyingClassificationLoading === safetySlice.LoadingState.IDLE && stateBullyingClassificationData.length === 0) {
        dispatch(safetySlice.fetchStateBullyingClassifications(stateParams));
      }

      if(stateBullyingImpactLoading === safetySlice.LoadingState.IDLE && stateBullyingImpactData.length === 0) {
        dispatch(safetySlice.fetchStateBullyingImpacts(stateParams));
      }

      if(stateDisciplineCountLoading === safetySlice.LoadingState.IDLE && stateDisciplineCountData.length === 0) {
        dispatch(safetySlice.fetchStateDisciplineCounts(stateParams));
      }

      if(stateDisciplineIncidentLoading === safetySlice.LoadingState.IDLE && stateDisciplineIncidentData.length === 0) {
        dispatch(safetySlice.fetchStateDisciplineIncidents(stateParams));
      }
      
    }
  }, [
    dispatch, id, districtId, districtLoading, district, 
    districtSafetyLoading, districtSafetyData, 
    districtHarassmentLoading, districtHarassmentData, 
    districtTruancyLoading, districtTruancyData,
    districtSeclusionLoading, districtSeclusionData,
    districtRestraintLoading, districtRestraintData,
    districtBullyingLoading, districtBullyingData,
    districtBullyingClassificationLoading, districtBullyingClassificationData,
    districtBullyingImpactLoading, districtBullyingImpactData,
    districtDisciplineCountLoading, districtDisciplineCountData,
    districtDisciplineIncidentLoading, districtDisciplineIncidentData,
    stateSafetyLoading, stateSafetyData,
    stateHarassmentLoading, stateHarassmentData,
    stateTruancyLoading, stateTruancyData,
    stateSeclusionLoading, stateSeclusionData,
    stateRestraintLoading, stateRestraintData,
    stateBullyingLoading, stateBullyingData,
    stateBullyingClassificationLoading, stateBullyingClassificationData,
    stateBullyingImpactLoading, stateBullyingImpactData,
    stateDisciplineCountLoading, stateDisciplineCountData,
    stateDisciplineIncidentLoading, stateDisciplineIncidentData,
    districtParams, stateParams
  ]);

  // Show loading when any data is still loading
  const isLoading = 
    districtLoading || 
    districtSafetyLoading !== safetySlice.LoadingState.SUCCEEDED || 
    districtHarassmentLoading !== safetySlice.LoadingState.SUCCEEDED || 
    districtTruancyLoading !== safetySlice.LoadingState.SUCCEEDED ||
    districtSeclusionLoading !== safetySlice.LoadingState.SUCCEEDED ||
    districtRestraintLoading !== safetySlice.LoadingState.SUCCEEDED ||
    districtBullyingLoading !== safetySlice.LoadingState.SUCCEEDED ||
    districtBullyingClassificationLoading !== safetySlice.LoadingState.SUCCEEDED ||
    districtBullyingImpactLoading !== safetySlice.LoadingState.SUCCEEDED ||
    districtDisciplineCountLoading !== safetySlice.LoadingState.SUCCEEDED ||
    districtDisciplineIncidentLoading !== safetySlice.LoadingState.SUCCEEDED ||
    stateSafetyLoading !== safetySlice.LoadingState.SUCCEEDED ||
    stateHarassmentLoading !== safetySlice.LoadingState.SUCCEEDED ||
    stateTruancyLoading !== safetySlice.LoadingState.SUCCEEDED ||
    stateSeclusionLoading !== safetySlice.LoadingState.SUCCEEDED ||
    stateRestraintLoading !== safetySlice.LoadingState.SUCCEEDED ||
    stateBullyingLoading !== safetySlice.LoadingState.SUCCEEDED ||
    stateBullyingClassificationLoading !== safetySlice.LoadingState.SUCCEEDED ||
    stateBullyingImpactLoading !== safetySlice.LoadingState.SUCCEEDED ||
    stateDisciplineCountLoading !== safetySlice.LoadingState.SUCCEEDED ||
    stateDisciplineIncidentLoading !== safetySlice.LoadingState.SUCCEEDED;

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
    gap: 0, // Explicitly set gap to 0
    flexShrink: 0,
    mb: selectedSafetyPage ? 2 : 0,
    justifyContent: 'flex-start'
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
          <Box sx={{ display: { xs: 'none', md: 'block' }, flex: 1 }}>
            <Typography variant="body1">
              Select a safety category to see detailed information
            </Typography>
          </Box>
        );
    }
  };

  // Styles for the first row of cards on mobile when safety category is selected
  const firstRowStyles = {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    mb: selectedSafetyPage ? 1 : 0
  };
  
  // Styles for the second row of cards on mobile when safety category is selected
  const secondRowStyles = {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
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
            <Typography variant="body1">
              Please Click A Card For More Information
            </Typography>
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

export default  Safety; 