import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCurrentSchool,
  fetchAllSchoolData,
  selectSchoolLoading
} from '@/store/slices/locationSlice';
import { 
  selectAllMeasurements, 
  selectMeasurementsLoadingState,
  selectMeasurementsError,
  fetchAllMeasurements
} from '@/store/slices/measurementSlice';
import MeasurementTable from '@/components/ui/tables/MeasurementTable';
import SectionTitle from '@/components/ui/SectionTitle';

const Safety: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const school = useAppSelector(selectCurrentSchool);
  const schoolLoading = useAppSelector(selectSchoolLoading);
  const dispatch = useAppDispatch();
  const measurements = useAppSelector(selectAllMeasurements);
  const measurementsLoading = useAppSelector(selectMeasurementsLoadingState);
  const measurementsError = useAppSelector(selectMeasurementsError);

  // List of safety measurement type IDs
  const safetyMeasurementTypeIds = [39, 40, 41, 42];

  useEffect(() => {
    if (id) {
      if(!schoolLoading && !school) {
        dispatch(fetchAllSchoolData(parseInt(id)));
      }
      if (!measurementsLoading && measurements.length === 0) {
        dispatch(fetchAllMeasurements({ entityId: id, entityType: 'school' }));
      }
    }
  }, [id, schoolLoading, dispatch, measurementsLoading, measurements]);

  // Filter measurements to only include safety measurement type IDs
  const safetyMeasurements = measurements.filter(
    measurement => safetyMeasurementTypeIds.includes(Number(measurement.measurement_type.id))
  );

  // Show loading when either school data or measurement data is loading
  const isLoading = schoolLoading || measurementsLoading;

  return (
    <>
      <SectionTitle>
        {school?.name || 'School'}
      </SectionTitle>
      
      <Box sx={{ mt: 3 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : measurementsError ? (
          <Typography color="error">Error loading safety data: {measurementsError}</Typography>
        ) : safetyMeasurements.length === 0 ? (
          <Typography>No safety data available for this school.</Typography>
        ) : (
          <MeasurementTable data={safetyMeasurements} />
        )}
      </Box>
    </>
  );
};

export default Safety; 