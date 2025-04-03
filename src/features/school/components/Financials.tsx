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

const Financials: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const school = useAppSelector(selectCurrentSchool);
  const schoolLoading = useAppSelector(selectLocationLoading);
  const schoolError = useAppSelector(selectLocationError);
  const dispatch = useAppDispatch();
  const measurements = useAppSelector(selectAllMeasurements);
  const measurementsLoading = useAppSelector(selectMeasurementsLoading);
  const measurementsError = useAppSelector(selectMeasurementsError);

  // List of financial measurement type IDs
  const financialMeasurementTypeIds = ['16', '17', '18', '19', '20', '21', '22'];

  useEffect(() => {
    if (id) {
      // If school data isn't loaded yet, fetch it
      if (!school && !schoolLoading) {
        dispatch(fetchAllSchoolData(id));
      }
    }
  }, [dispatch, id, school, schoolLoading]);

  // Filter measurements to only include financial measurement type IDs
  const financialMeasurements = measurements.filter(
    measurement => financialMeasurementTypeIds.includes(measurement.measurement_type_id)
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