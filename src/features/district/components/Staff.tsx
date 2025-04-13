import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCurrentDistrict,
  selectLocationLoading,
  selectLocationError,
  fetchAllDistrictData
} from '@/store/slices/locationSlice';
import { 
  fetchAllMeasurements, 
  selectAllMeasurements, 
  selectMeasurementsLoadingState,
  selectMeasurementsError
} from '@/store/slices/measurementSlice';
import MeasurementTable from '@/components/ui/tables/MeasurementTable';
import SectionTitle from '@/components/ui/SectionTitle';

const Staff: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const district = useAppSelector(selectCurrentDistrict);
  const districtLoading = useAppSelector(selectLocationLoading);
  const districtError = useAppSelector(selectLocationError);
  const dispatch = useAppDispatch();
  const measurements = useAppSelector(selectAllMeasurements);
  const measurementsLoading = useAppSelector(selectMeasurementsLoadingState);
  const measurementsError = useAppSelector(selectMeasurementsError);

  // List of teacher-related measurement type IDs
  const teacherMeasurementTypeIds = [13, 14, 15, 43, 44, 45];

  useEffect(() => {
    if (id) {
      if(!districtLoading && !district) {
        dispatch(fetchAllDistrictData(parseInt(id)));
      }
      if (!measurementsLoading && measurements.length === 0) {
        dispatch(fetchAllMeasurements({ entityId: id, entityType: 'district' }));
      }
    }
  }, [id, districtLoading, dispatch, measurementsLoading, measurements]);

  // Filter measurements to only include teacher-related measurement type IDs
  const teacherMeasurements = measurements.filter(
    measurement => teacherMeasurementTypeIds.includes(Number(measurement.measurement_type.id))
  );

  // Show loading when either district data or measurement data is loading
  const isLoading = districtLoading || measurementsLoading;

  return (
    <>
      <SectionTitle>
        {district?.name || 'District'} School District
      </SectionTitle>
      
      <Box sx={{ mt: 3 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : measurementsError ? (
          <Typography color="error">Error loading staff data: {measurementsError}</Typography>
        ) : teacherMeasurements.length === 0 ? (
          <Typography>No staff information available for this district.</Typography>
        ) : (
          <MeasurementTable data={teacherMeasurements} />
        )}
      </Box>
    </>
  );
};

export default Staff; 