import React, { useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCurrentSchool, 
  selectSchoolLoading
} from '@/store/slices/locationSlice';
import { 
  selectLatestMeasurements, 
  selectLatestMeasurementsLoadingState,
  selectLatestMeasurementsError,
  fetchLatestMeasurements,
  selectMeasurementsByCategory
} from '@/store/slices/measurementSlice';
import MeasurementTable from '@/components/ui/tables/MeasurementTable';
import SectionTitle from '@/components/ui/SectionTitle';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
const Demographics: React.FC = () => {
  const school = useAppSelector(selectCurrentSchool);
  const schoolLoading = useAppSelector(selectSchoolLoading);
  const dispatch = useAppDispatch();
  const measurements = useAppSelector(selectLatestMeasurements);
  const measurementsLoading = useAppSelector(selectLatestMeasurementsLoadingState);
  const measurementsError = useAppSelector(selectLatestMeasurementsError);

  // List of demographic measurement type IDs
  const demographicMeasurementTypeIds = [23, 24, 25, 26, 27, 28, 29, 30, 31, 32];

  useEffect(() => {
    // Only fetch measurements if we have the school data
    if (school && !measurementsLoading && measurements.length === 0) {
      dispatch(fetchLatestMeasurements({
        entityId: school.id.toString(), 
        entityType: 'school' 
      }));
    }
  }, [school, dispatch, measurementsLoading, measurements]);

  // Filter measurements to only include demographic measurement type IDs
  const demographicMeasurements = measurements.filter(
    measurement => demographicMeasurementTypeIds.includes(Number(measurement.measurement_type.id))
  );

  // Show loading when either school data or measurement data is loading
  const isLoading = schoolLoading || measurementsLoading;

  return (
    <>
      <SectionTitle 
        displayName={PAGE_REGISTRY.school.demographics.displayName}
        schoolName={school?.name}
      />
      
      <Box sx={{ mt: 3 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : measurementsError ? (
          <Typography color="error">Error loading demographic data: {measurementsError}</Typography>
        ) : demographicMeasurements.length === 0 ? (
          <Typography>No demographic data available for this school.</Typography>
        ) : (
          <MeasurementTable data={demographicMeasurements} />
        )}
      </Box>
    </>
  );
};

export default Demographics; 