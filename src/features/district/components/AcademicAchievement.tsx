import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Divider } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCurrentDistrict,
  selectLocationLoading,
  fetchAllDistrictData
} from '@/store/slices/locationSlice';
import { 
  selectAllMeasurements, 
  selectMeasurementsLoading,
  selectMeasurementsError,
  Measurement
} from '@/store/slices/measurementSlice';
import MeasurementTable from '@/components/ui/tables/MeasurementTable';
import SectionTitle from '@/components/ui/SectionTitle';

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
      <SectionTitle>
        {district?.name} School District
      </SectionTitle>
      
      <LoadingErrorHandler data={filteredMeasurements} label="academic achievement" />
    </>
  );
};

export default AcademicAchievement; 