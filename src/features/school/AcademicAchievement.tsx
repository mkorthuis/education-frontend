import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Divider } from '@mui/material';
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
  selectMeasurementsError,
  Measurement
} from '@/features/measurement/store/measurementSlice';

const AcademicAchievement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const school = useAppSelector(selectCurrentSchool);
  const schoolLoading = useAppSelector(selectLocationLoading);
  const schoolError = useAppSelector(selectLocationError);
  const dispatch = useAppDispatch();
  const measurements = useAppSelector(selectAllMeasurements);
  const measurementsLoading = useAppSelector(selectMeasurementsLoading);
  const measurementsError = useAppSelector(selectMeasurementsError);

  // List of academic measurement type IDs
  const academicMeasurementTypeIds = [
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 
    '34', '35', '36', '37', '38'
  ];

  useEffect(() => {
    if (id) {
      // If school data isn't loaded yet, fetch it
      if (!school && !schoolLoading) {
        dispatch(fetchAllSchoolData(id));
      }
    }
  }, [dispatch, id, school, schoolLoading]);

  // Filter measurements to only include academic measurement type IDs
  const academicMeasurements = measurements.filter(
    measurement => academicMeasurementTypeIds.includes(measurement.measurement_type_id)
  );

  // Show loading when either school data or measurement data is loading
  const isLoading = schoolLoading || measurementsLoading;

  // Table component to display measurement data
  const MeasurementTable = ({ data }: { data: Measurement[] }) => (
    <TableContainer>
      <Table aria-label="academic data">
        <TableHead>
          <TableRow>
            <TableCell><strong>Measurement Type</strong></TableCell>
            <TableCell><strong>Year</strong></TableCell>
            <TableCell align="right"><strong>Value</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((measurement) => (
            <TableRow key={measurement.id}>
              <TableCell>{measurement.measurementType || `Type ${measurement.measurement_type_id}`}</TableCell>
              <TableCell>{measurement.year}</TableCell>
              <TableCell align="right">{measurement.value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <>
      <Divider sx={{ mb: 2 }} />
      
      <Typography variant="h5" gutterBottom>
        {school?.name || 'School'}
      </Typography>
      
      <Box>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : measurementsError ? (
          <Typography color="error">Error loading academic data: {measurementsError}</Typography>
        ) : academicMeasurements.length === 0 ? (
          <Typography>No academic achievement data available for this school.</Typography>
        ) : (
          <MeasurementTable data={academicMeasurements} />
        )}
      </Box>
    </>
  );
};

export default AcademicAchievement; 