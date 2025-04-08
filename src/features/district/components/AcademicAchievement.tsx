import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCurrentDistrict,
  selectAnyLocationLoading,
  fetchAllDistrictData
} from '@/store/slices/locationSlice';
import { 
  fetchAllMeasurements, 
  fetchMeasurementTypes,
  selectMeasurementsLoading,
  selectAllMeasurements,
  selectMeasurementTypesLoaded,
  MeasurementCategory
} from '@/store/slices/measurementSlice';
import SectionTitle from '@/components/ui/SectionTitle';
import MeasurementCard from '@/features/district/components/academic/MeasurementCard';

const AcademicAchievement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const district = useAppSelector(selectCurrentDistrict);
  const districtLoading = useAppSelector(selectAnyLocationLoading);
  const measurementsLoading = useAppSelector(selectMeasurementsLoading);
  const measurements = useAppSelector(selectAllMeasurements);
  const measurementTypesLoaded = useAppSelector(selectMeasurementTypesLoaded);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (id) {
      // If district data isn't loaded yet, fetch it
      if (!district && !districtLoading) {
        dispatch(fetchAllDistrictData(id));
      }
      
      // If measurement types are not loaded, fetch them
      if (!measurementTypesLoaded) {
        dispatch(fetchMeasurementTypes());
      }
      
      // If we have the district but no measurements, fetch them
      if (district && !measurementsLoading && measurements.length === 0) {
        dispatch(fetchAllMeasurements({ entityId: id, entityType: 'district' }));
      }
    }
  }, [dispatch, id, district, districtLoading, measurementsLoading, measurements.length, measurementTypesLoaded]);


  // Show loading when either district data or measurement data is loading
  const isLoading = districtLoading || measurementsLoading;

  // Placeholder data for measurement cards if no real data is available
  const placeholderData = [
    { title: 'Math Proficiency', value: '82%', type: 'Academic Performance' },
    { title: 'Reading Proficiency', value: '78%', type: 'Academic Performance' },
    { title: 'Science Proficiency', value: '75%', type: 'Academic Performance' }
  ];

  return (
    <>
      <SectionTitle>{district?.name} School District</SectionTitle>    
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }}}>
            <Box sx={{display: 'flex', flexDirection: 'column', width: { xs: '100%', md: '300px' }, flexShrink: 0}}>
              {placeholderData.map((item, index) => (
                <MeasurementCard
                  key={index}
                  title={item.title}
                  value={item.value}
                  type={item.type}
                />
              ))}
            </Box>
            <Box sx={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                <Typography variant="h5" gutterBottom>
                  District Performance Overview
                </Typography>
            </Box>
          </Box>
        )}
    </>
  );
};

export default AcademicAchievement; 