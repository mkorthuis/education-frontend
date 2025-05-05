import React, { useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCurrentDistrict, 
  selectLocationLoading
} from '@/store/slices/locationSlice';
import { 
  selectAllMeasurements, 
  selectMeasurementsLoadingState,
  selectMeasurementsError,
  fetchAllMeasurements
} from '@/store/slices/measurementSlice';
import MeasurementTable from '@/components/ui/tables/MeasurementTable';
import SectionTitle from '@/components/ui/SectionTitle';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';

const Demographics: React.FC = () => {
  const district = useAppSelector(selectCurrentDistrict);
  const districtLoading = useAppSelector(selectLocationLoading);
  const dispatch = useAppDispatch();
  const measurements = useAppSelector(selectAllMeasurements);
  const measurementsLoading = useAppSelector(selectMeasurementsLoadingState);
  const measurementsError = useAppSelector(selectMeasurementsError);

  // List of demographic measurement type IDs
  const demographicMeasurementTypeIds = [23, 24, 25, 26, 27, 28, 29, 30, 31, 32];

  useEffect(() => {
    // Only fetch measurements if we have the district data
    if (district && !measurementsLoading && measurements.length === 0) {
      dispatch(fetchAllMeasurements({ 
        entityId: district.id.toString(), 
        entityType: 'district' 
      }));
    }
  }, [district, dispatch, measurementsLoading, measurements]);

  // Filter measurements to only include demographic measurement type IDs
  const demographicMeasurements = measurements.filter(
    measurement => demographicMeasurementTypeIds.includes(Number(measurement.measurement_type.id))
  );

  // Show loading when either district data or measurement data is loading
  const isLoading = districtLoading || measurementsLoading;

  return (
    <>
      <SectionTitle 
        displayName={PAGE_REGISTRY.district.demographics.displayName}
        districtName={district?.name}
      />
      
      <Box sx={{ mt: 3 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : measurementsError ? (
          <Typography color="error">Error loading demographic data: {measurementsError}</Typography>
        ) : demographicMeasurements.length === 0 ? (
          <Typography>No demographic data available for this district.</Typography>
        ) : (
          <MeasurementTable data={demographicMeasurements} />
        )}
      </Box>
    </>
  );
};

export default Demographics; 