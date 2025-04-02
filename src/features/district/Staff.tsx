import React, { useEffect } from 'react';
import { useParams} from 'react-router-dom';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCurrentDistrict,
  selectLocationLoading,
  selectLocationError,
  fetchAllDistrictData
} from '@/features/location/store/locationSlice';
import { 
  fetchAllMeasurements, 
  selectAllMeasurements, 
  selectMeasurementsLoading,
  selectMeasurementsError
} from '@/features/measurement/store/measurementSlice';

const Staff: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const district = useAppSelector(selectCurrentDistrict);
  const districtLoading = useAppSelector(selectLocationLoading);
  const districtError = useAppSelector(selectLocationError);
  const dispatch = useAppDispatch();
  const measurements = useAppSelector(selectAllMeasurements);
  const measurementsLoading = useAppSelector(selectMeasurementsLoading);
  const measurementsError = useAppSelector(selectMeasurementsError);

  // List of teacher-related measurement type IDs
  const teacherMeasurementTypeIds = ['13', '14', '15', '43', '44', '45'];

  useEffect(() => {
    if (id) {
      // If district data isn't loaded yet, fetch it
      if (!district && !districtLoading) {
        dispatch(fetchAllDistrictData(id));
      }
      
      // Fetch measurement data
      dispatch(fetchAllMeasurements(id));
    }
  }, [dispatch, id, district, districtLoading]);

  // Filter measurements to only include teacher-related measurement type IDs
  const teacherMeasurements = measurements.filter(
    measurement => teacherMeasurementTypeIds.includes(measurement.measurement_type_id)
  );

  // Show loading when either district data or measurement data is loading
  const isLoading = districtLoading || measurementsLoading;

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      
      <Typography variant="h5" gutterBottom>
        Staff
      </Typography>
      
      <Typography variant="h6" gutterBottom>
        {district?.name || 'District'}
      </Typography>
      
      <Box sx={{ mt: 3 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : measurementsError ? (
          <Typography color="error">Error loading staff data: {measurementsError}</Typography>
        ) : teacherMeasurements.length === 0 ? (
          <Typography>No staff data available for this district.</Typography>
        ) : (
          <TableContainer>
            <Table aria-label="staff data">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Measurement Type</strong></TableCell>
                  <TableCell><strong>Year</strong></TableCell>
                  <TableCell align="right"><strong>Value</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {teacherMeasurements.map((measurement) => (
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

export default Staff; 