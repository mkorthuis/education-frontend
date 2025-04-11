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
  selectTruancyLoadingStatus
} from '@/store/slices/safetySlice';

const SchoolSafety: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const districtId = id ? parseInt(id) : 0;
  
  const schoolSafetyData = useAppSelector(state => selectSchoolSafetyData(state, { district_id: districtId }));
  const harassmentData = useAppSelector(state => selectHarassmentData(state, { district_id: districtId }));
  const truancyData = useAppSelector(state => selectTruancyData(state, { district_id: districtId }));
  const schoolSafetyLoading = useAppSelector(state => selectSchoolSafetyIncidentsLoadingStatus(state, { district_id: districtId }));
  const harassmentLoading = useAppSelector(state => selectHarassmentIncidentsLoadingStatus(state, { district_id: districtId }));
  const truancyLoading = useAppSelector(state => selectTruancyLoadingStatus(state, { district_id: districtId }));

  const district = useAppSelector(selectCurrentDistrict);
  const districtLoading = useAppSelector(selectLocationLoading);
  const dispatch = useAppDispatch();

  // List of school safety measurement type IDs
  const safetyMeasurementTypeIds = [39, 40, 41, 42, 43];

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

  return (
    <>
      <SectionTitle>
      {district?.name || 'District'}
      </SectionTitle>
      
      <Box sx={{ mt: 3 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
            <Box>
                <Typography>School Safety</Typography>{JSON.stringify(schoolSafetyData)}
                <Typography>Harassment</Typography>{JSON.stringify(harassmentData)}
                <Typography>Truancy</Typography>{JSON.stringify(truancyData)}
            </Box>
        )}
      </Box>
    </>
  );
};

export default SchoolSafety; 