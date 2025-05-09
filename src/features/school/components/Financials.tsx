import React, { useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCurrentSchool,
  selectSchoolLoading
} from '@/store/slices/locationSlice';
import { 
  fetchLatestMeasurements,
  FetchMeasurementsParams
} from '@/store/slices/measurementSlice';
import { useMeasurements } from '@/hooks/useMeasurements';
import MeasurementTable from '@/components/ui/tables/MeasurementTable';
import SectionTitle from '@/components/ui/SectionTitle';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';

const Financials: React.FC = () => {
  const school = useAppSelector(selectCurrentSchool);
  const schoolLoading = useAppSelector(selectSchoolLoading);
  const dispatch = useAppDispatch();

  // List of financial measurement type IDs
  const financialMeasurementTypeIds = [16, 17, 18, 19, 20, 21, 22];

  const params: FetchMeasurementsParams = {
    entityId: school?.id?.toString() || '',
    entityType: 'school'
  };

  const { measurements, loadingState: measurementsLoading, error: measurementsError } = useMeasurements(params);

  useEffect(() => {
    if (school?.id) {
      if (!measurementsLoading && measurements.length === 0) {
        dispatch(fetchLatestMeasurements(params));
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
      <SectionTitle 
        displayName={PAGE_REGISTRY.school.financials.displayName}
        schoolName={school?.name}
        withDivider={false}
      />
      
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