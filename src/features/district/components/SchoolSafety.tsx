import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCurrentDistrict,
  selectLocationLoading,
  fetchAllDistrictData 
} from '@/store/slices/locationSlice';
import SectionTitle from '@/components/ui/SectionTitle';
import { 
  fetchHarassmentIncidents, 
  fetchSchoolSafetyIncidents, 
  fetchTruancyData, 
  LoadingState,
  selectSchoolSafetyData,
  selectHarassmentData,
  selectTruancyData,
  selectSchoolSafetyIncidentsLoadingStatus,
  selectHarassmentIncidentsLoadingStatus,
  selectTruancyLoadingStatus,
  selectSelectedSafetyCategory
} from '@/store/slices/safetySlice';
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

const SchoolSafety: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const districtId = id ? parseInt(id) : 0;
  
  const schoolSafetyData = useAppSelector(state => selectSchoolSafetyData(state, { district_id: districtId }));
  const harassmentData = useAppSelector(state => selectHarassmentData(state, { district_id: districtId }));
  const truancyData = useAppSelector(state => selectTruancyData(state, { district_id: districtId }));
  const schoolSafetyLoading = useAppSelector(state => selectSchoolSafetyIncidentsLoadingStatus(state, { district_id: districtId }));
  const harassmentLoading = useAppSelector(state => selectHarassmentIncidentsLoadingStatus(state, { district_id: districtId }));
  const truancyLoading = useAppSelector(state => selectTruancyLoadingStatus(state, { district_id: districtId }));
  const selectedSafetyCategory = useAppSelector(selectSelectedSafetyCategory);

  const district = useAppSelector(selectCurrentDistrict);
  const districtLoading = useAppSelector(selectLocationLoading);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (id) {
      if(!districtLoading && !district) {
        dispatch(fetchAllDistrictData(districtId));
      }
      if(schoolSafetyLoading === LoadingState.IDLE && schoolSafetyData.length === 0) {
        dispatch(fetchSchoolSafetyIncidents({ district_id: districtId }));
      }
      if(harassmentLoading === LoadingState.IDLE && harassmentData.length === 0) {
        dispatch(fetchHarassmentIncidents({ district_id: districtId }));
      }
      if(truancyLoading === LoadingState.IDLE && truancyData.length === 0) {
        dispatch(fetchTruancyData({ district_id: districtId }));
      }
    }
  }, [dispatch, id, districtId, districtLoading, district, schoolSafetyLoading, schoolSafetyData, harassmentLoading, harassmentData, truancyLoading, truancyData]);

  // Show loading when any data is still loading
  const isLoading = districtLoading || schoolSafetyLoading != LoadingState.SUCCEEDED || harassmentLoading != LoadingState.SUCCEEDED || truancyLoading != LoadingState.SUCCEEDED;

  // Card container styling for responsive layout
  const cardContainerStyles = {
    marginRight: { xs: 0, md: '16px' }, 
    display: 'flex', 
    flexDirection: { 
      xs: selectedSafetyCategory ? 'column' : 'column', 
      md: 'column' 
    },
    flexWrap: { xs: 'nowrap', md: 'nowrap' },
    width: { xs: '100%', md: '300px'}, 
    gap: 0, // Explicitly set gap to 0
    flexShrink: 0,
    mb: selectedSafetyCategory ? 2 : 0,
    justifyContent: 'flex-start'
  };

  // Function to render the appropriate category details based on selection
  const renderCategoryDetails = () => {
    switch(selectedSafetyCategory) {
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
    mb: selectedSafetyCategory ? 1 : 0
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
          {!selectedSafetyCategory && (
          <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 1 }}>
            <Typography variant="body1">
              Please Click A Card For More Information
            </Typography>
          </Box>
          )}
          
          <Box sx={cardContainerStyles}>
            {selectedSafetyCategory ? (
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
            <Box sx={{ display: { xs: selectedSafetyCategory ? 'none' : 'block', md: 'block' } }}>
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

export default SchoolSafety; 