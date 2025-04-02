import React, { useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Box, Typography,  Table, TableBody, TableCell,  TableHead, TableRow, CircularProgress, Divider } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCurrentDistrict,
  selectLocationLoading,
  fetchAllDistrictData
} from '@/features/location/store/locationSlice';
import { 
  selectAllMeasurements, 
  selectMeasurementsLoading,
  selectMeasurementsError,
  Measurement
} from '@/features/measurement/store/measurementSlice';

const AcademicAchievement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const district = useAppSelector(selectCurrentDistrict);
  const districtLoading = useAppSelector(selectLocationLoading);
  const dispatch = useAppDispatch();
  const measurements = useAppSelector(selectAllMeasurements);
  const measurementsLoading = useAppSelector(selectMeasurementsLoading);
  const measurementsError = useAppSelector(selectMeasurementsError);

  // List of measurement type IDs to display
  const targetMeasurementTypeIds = [
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 
    '34', '35', '36', '37', '38'
  ];

  useEffect(() => {
    if (id) {
      // If district data isn't loaded yet, fetch it
      if (!district && !districtLoading) {
        dispatch(fetchAllDistrictData(id));
      }
    }
  }, [dispatch, id, district, districtLoading]);

  // Filter measurements to only include the specified measurement type IDs
  const filteredMeasurements = measurements.filter(
    measurement => targetMeasurementTypeIds.includes(measurement.measurement_type_id)
  );

  // Show loading when either district data or measurement data is loading
  const isLoading = districtLoading || measurementsLoading;

  // Table component to display measurement data
  const MeasurementTable = ({ data }: { data: Measurement[] }) => (
      <Table aria-label="measurement data">
        <TableHead>
          <TableRow>
            <TableCell><strong>Academic Measure</strong></TableCell>
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
  );

  // Loading and error handling component
  const LoadingErrorHandler = ({ data, label }: { data: Measurement[], label: string }) => {
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (measurementsError) {
      return <Typography color="error">Error loading measurement data: {measurementsError}</Typography>;
    }
    
    if (data.length === 0) {
      return <Typography>No {label} data available for the specified measurement types.</Typography>;
    }
    
    return <MeasurementTable data={data} />;
  };

  return (
    <>
      <Divider sx={{ mb: 2 }} />
      <Typography variant="h5" gutterBottom>
        {district?.name} School District
      </Typography>
      
      <LoadingErrorHandler data={filteredMeasurements} label="academic achievement" />
    </>
  );
};

export default AcademicAchievement; 