import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCurrentSchool,
  selectLocationLoading,
  selectLocationError,
  fetchAllSchoolData
} from '@/store/slices/locationSlice';
import { 
  selectAllMeasurements, 
  selectMeasurementsLoading,
  selectMeasurementsError
} from '@/store/slices/measurementSlice';
import MeasurementTable from '@/components/ui/tables/MeasurementTable';
import SectionTitle from '@/components/ui/SectionTitle';

const Safety: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const school = useAppSelector(selectCurrentSchool);
  const schoolLoading = useAppSelector(selectLocationLoading);
  const schoolError = useAppSelector(selectLocationError);
  const dispatch = useAppDispatch();
  const measurements = useAppSelector(selectAllMeasurements);
  const measurementsLoading = useAppSelector(selectMeasurementsLoading);
  const measurementsError = useAppSelector(selectMeasurementsError);

  // List of safety measurement type IDs
  const safetyMeasurementTypeIds = ['39', '40', '41', '42'];

  useEffect(() => {
    if (id && !school && !schoolLoading) {
      dispatch(fetchAllSchoolData(Number(id)));
    }
  }, [id, school, schoolLoading, dispatch]);

  // Filter measurements to only include safety measurement type IDs
  const safetyMeasurements = measurements.filter(
    measurement => safetyMeasurementTypeIds.includes(measurement.measurement_type_id)
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