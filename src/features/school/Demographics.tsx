import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCurrentSchool, 
  selectLocationLoading, 
  selectLocationError,
  fetchAllSchoolData
} from '@/features/location/store/locationSlice';
import { 
  selectAllMeasurements, 
  selectMeasurementsLoading,
  selectMeasurementsError
} from '@/features/measurement/store/measurementSlice';

const Demographics: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const school = useAppSelector(selectCurrentSchool);
  const schoolLoading = useAppSelector(selectLocationLoading);
  const schoolError = useAppSelector(selectLocationError);
  const dispatch = useAppDispatch();
  const measurements = useAppSelector(selectAllMeasurements);
  const measurementsLoading = useAppSelector(selectMeasurementsLoading);
  const measurementsError = useAppSelector(selectMeasurementsError);

  // List of demographic measurement type IDs
  const demographicMeasurementTypeIds = ['23', '24', '25', '26', '27', '28', '29', '30', '31', '32'];

  useEffect(() => {
    if (id) {
      // If school data isn't loaded yet, fetch it
      if (!school && !schoolLoading) {
        dispatch(fetchAllSchoolData(id));
      }
    }
  }, [dispatch, id, school, schoolLoading]);

  // Filter measurements to only include demographic measurement type IDs
  const demographicMeasurements = measurements.filter(
    measurement => demographicMeasurementTypeIds.includes(measurement.measurement_type_id)
  );

  // Show loading when either school data or measurement data is loading
  const isLoading = schoolLoading || measurementsLoading;

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        Demographics
      </Typography>
      
      <Typography variant="h6" gutterBottom>
        {school?.name || 'School'}
      </Typography>
      
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
          <TableContainer>
            <Table aria-label="demographic data">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Measurement Type</strong></TableCell>
                  <TableCell><strong>Year</strong></TableCell>
                  <TableCell align="right"><strong>Value</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {demographicMeasurements.map((measurement) => (
                  <TableRow key={measurement.id}>
                    <TableCell>{measurement.measurementType || `Type ${measurement.measurement_type_id}`}</TableCell>
                    <TableCell>{measurement.year}</TableCell>
                    <TableCell align="right">{measurement.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Paper>
  );
};

export default Demographics; 