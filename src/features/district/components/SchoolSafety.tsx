import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCurrentDistrict,
  selectLocationLoading,
  fetchAllDistrictData 
} from '@/store/slices/locationSlice';
import { 
  selectAllMeasurements, 
  selectMeasurementsLoading,
  selectMeasurementsError
} from '@/store/slices/measurementSlice';
import MeasurementTable from '@/components/ui/tables/MeasurementTable';
import SectionTitle from '@/components/ui/SectionTitle';

const SchoolSafety: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const district = useAppSelector(selectCurrentDistrict);
  const districtLoading = useAppSelector(selectLocationLoading);
  const dispatch = useAppDispatch();
  const measurements = useAppSelector(selectAllMeasurements);
  const measurementsLoading = useAppSelector(selectMeasurementsLoading);
  const measurementsError = useAppSelector(selectMeasurementsError);

  // List of school safety measurement type IDs
  const safetyMeasurementTypeIds = ['39', '40', '41', '42', '43'];

  useEffect(() => {
    if (id) {
      // If district data isn't loaded yet, fetch it
      if (!district && !districtLoading) {
        dispatch(fetchAllDistrictData(id));
      }
    }
  }, [dispatch, id, district, districtLoading]);

  // Filter measurements to only include safety measurement type IDs
  const safetyMeasurements = measurements.filter(
    measurement => safetyMeasurementTypeIds.includes(measurement.measurement_type_id)
  );

  // Show loading when either district data or measurement data is loading
  const isLoading = districtLoading || measurementsLoading;

  return (
    <>
      <SectionTitle>
      {district?.name || 'District'}
      </SectionTitle>
      
      <Box sx={{ mt: 3 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : measurementsError ? (
          <Typography color="error">Error loading safety data: {measurementsError}</Typography>
        ) : safetyMeasurements.length === 0 ? (
          <Typography>No safety data available for this district.</Typography>
        ) : (
          <MeasurementTable data={safetyMeasurements} />
        )}
      </Box>
    </>
  );
};

export default SchoolSafety; 