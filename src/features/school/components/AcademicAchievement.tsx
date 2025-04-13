import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCurrentSchool,
  fetchAllSchoolData,
  selectSchoolLoading
} from '@/store/slices/locationSlice';
import { 
  selectAllMeasurements, 
  selectMeasurementsLoadingState,
  selectMeasurementsError,
  fetchAllMeasurements
} from '@/store/slices/measurementSlice';
import MeasurementTable from '@/components/ui/tables/MeasurementTable';
import SectionTitle from '@/components/ui/SectionTitle';

const AcademicAchievement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const school = useAppSelector(selectCurrentSchool);
  const schoolLoading = useAppSelector(selectSchoolLoading);
  const dispatch = useAppDispatch();
  const measurements = useAppSelector(selectAllMeasurements);
  const measurementsLoading = useAppSelector(selectMeasurementsLoadingState);
  const measurementsError = useAppSelector(selectMeasurementsError);

  // List of academic measurement type IDs
  const academicMeasurementTypeIds = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 
    34, 35, 36, 37, 38
  ];

  useEffect(() => {
    if (id) {
      if(!schoolLoading && !school) {
        dispatch(fetchAllSchoolData(parseInt(id)));
      }
      if (!measurementsLoading && measurements.length === 0) {
        dispatch(fetchAllMeasurements({ entityId: id, entityType: 'school' }));
      }
    }
  }, [id, schoolLoading, dispatch, measurementsLoading, measurements]);

  // Filter measurements to only include academic measurement type IDs
  const academicMeasurements = measurements.filter(
    measurement => academicMeasurementTypeIds.includes(Number(measurement.measurement_type.id))
  );

  // Show loading when either school data or measurement data is loading
  const isLoading = schoolLoading || measurementsLoading;

  return (
    <>
      <SectionTitle>
        {school?.name || 'School'}
      </SectionTitle>
      
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