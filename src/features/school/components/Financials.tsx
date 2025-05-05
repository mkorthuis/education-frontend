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
import MeasurementTable from '@/components/ui/tables/MeasurementTable';
import SectionTitle from '@/components/ui/SectionTitle';

const Financials: React.FC = () => {
  const school = useAppSelector(selectCurrentSchool);
  const schoolLoading = useAppSelector(selectSchoolLoading);
  const dispatch = useAppDispatch();
  const measurements = useAppSelector(selectAllMeasurements);
  const measurementsLoading = useAppSelector(selectMeasurementsLoadingState);
  const measurementsError = useAppSelector(selectMeasurementsError);

  // List of financial measurement type IDs
  const financialMeasurementTypeIds = [16, 17, 18, 19, 20, 21, 22];

  useEffect(() => {
    if (school?.id) {
      if (!measurementsLoading && measurements.length === 0) {
        dispatch(fetchAllMeasurements({ 
          entityId: school.id.toString(), 
          entityType: 'school' 
        }));
      }
    }
  }, [school, dispatch, measurementsLoading, measurements]);

  // Filter measurements to only include financial measurement type IDs
  const financialMeasurements = measurements.filter(
    measurement => financialMeasurementTypeIds.includes(Number(measurement.measurement_type.id))
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
          <Typography color="error">Error loading financial data: {measurementsError}</Typography>
        ) : financialMeasurements.length === 0 ? (
          <Typography>No financial data available for this school.</Typography>
        ) : (
          <MeasurementTable data={financialMeasurements} />
        )}
      </Box>
    </>
  );
};

export default Financials; 