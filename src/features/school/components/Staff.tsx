import React, { useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCurrentSchool,
  selectSchoolLoading
} from '@/store/slices/locationSlice';
import { 
  selectAllMeasurements, 
  selectMeasurementsLoadingState,
  selectMeasurementsError,
  fetchAllMeasurements
} from '@/store/slices/measurementSlice';
import { fetchTownEnrollment } from '@/store/slices/enrollmentSlice';
import MeasurementTable from '@/components/ui/tables/MeasurementTable';
import SectionTitle from '@/components/ui/SectionTitle';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
const Staff: React.FC = () => {
  const school = useAppSelector(selectCurrentSchool);
  const schoolLoading = useAppSelector(selectSchoolLoading);
  const dispatch = useAppDispatch();
  const measurements = useAppSelector(selectAllMeasurements);
  const measurementsLoading = useAppSelector(selectMeasurementsLoadingState);
  const measurementsError = useAppSelector(selectMeasurementsError);

  // List of teacher-related measurement type IDs
  const teacherMeasurementTypeIds = [13, 14, 15, 43, 44, 45];

  useEffect(() => {
    if (school?.id) {
      if (!measurementsLoading && measurements.length === 0) {
        dispatch(fetchAllMeasurements({ 
          entityId: school.id.toString(), 
          entityType: 'school' 
        }));
      }
      // Fetch enrollment data
      dispatch(fetchTownEnrollment({ town_id: school.id }));
    }
  }, [school, dispatch, measurementsLoading, measurements]);

  // Filter measurements to only include teacher-related measurement type IDs
  const teacherMeasurements = measurements.filter(
    measurement => teacherMeasurementTypeIds.includes(Number(measurement.measurement_type.id))
  );

  // Show loading when either school data or measurement data is loading
  const isLoading = schoolLoading || measurementsLoading;

  return (
    <>
      <SectionTitle 
        displayName={PAGE_REGISTRY.school.staff.displayName}
        schoolName={school?.name}
      />
      
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