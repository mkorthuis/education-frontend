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

const Staff: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const school = useAppSelector(selectCurrentSchool);
  const schoolLoading = useAppSelector(selectLocationLoading);
  const schoolError = useAppSelector(selectLocationError);
  const dispatch = useAppDispatch();
  const measurements = useAppSelector(selectAllMeasurements);
  const measurementsLoading = useAppSelector(selectMeasurementsLoading);
  const measurementsError = useAppSelector(selectMeasurementsError);

  // List of teacher-related measurement type IDs
  const teacherMeasurementTypeIds = ['13', '14', '15', '43', '44', '45'];

  useEffect(() => {
    if (id && !school && !schoolLoading) {
      dispatch(fetchAllSchoolData(Number(id)));
    }
  }, [id, school, schoolLoading, dispatch]);

  // Filter measurements to only include teacher-related measurement type IDs
  const teacherMeasurements = measurements.filter(
    measurement => teacherMeasurementTypeIds.includes(measurement.measurement_type_id)
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
          <Typography color="error">Error loading staff data: {measurementsError}</Typography>
        ) : teacherMeasurements.length === 0 ? (
          <Typography>No staff information available for this school.</Typography>
        ) : (
          <MeasurementTable data={teacherMeasurements} />
        )}
      </Box>
    </>
  );
};

export default Staff; 