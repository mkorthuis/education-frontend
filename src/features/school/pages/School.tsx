import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Box, Typography, Divider, CircularProgress, Alert, Button, Stack } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { 
  fetchAllSchoolData, 
  selectCurrentSchool, 
  selectCurrentDistrict,
  selectCurrentSau,
  selectLocationLoading, 
  selectLocationError
} from '@/store/slices/locationSlice';
import { formatGradesDisplay } from '@/utils/formatting';
import { calculateTotalEnrollment } from '@/utils/calculations';

/**
 * Represents the School page/feature.
 * Displays school information based on the ID from the URL.
 */
const School: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  
  // Select from Redux store
  const school = useAppSelector(selectCurrentSchool);
  const district = useAppSelector(selectCurrentDistrict);
  const sau = useAppSelector(selectCurrentSau);
  const loading = useAppSelector(selectLocationLoading);
  const error = useAppSelector(selectLocationError);

  useEffect(() => {
    if (id) {
      dispatch(fetchAllSchoolData(Number(id)));
    }
  }, [id, dispatch]);

  // Show loading when:
  // 1. We're explicitly in a loading state
  // 2. OR we've initiated a fetch (id exists) but don't have school data yet
  const isLoading = loading || (!!id && !school && !error);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!school) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning">No school information found.</Alert>
      </Box>
    );
  }

  const gradesDisplay = formatGradesDisplay(school);
  const totalEnrollment = calculateTotalEnrollment(school);

  return (
    <Box>
      <Divider sx={{ mb: 2 }} />
      <Typography variant="h5" gutterBottom>
        {school.name}
      </Typography>
      <Typography variant="body1">{school.school_type?.name || 'School Type Not Available'}</Typography>
      <Typography variant="body1">Grades: {gradesDisplay}</Typography>
      <Typography variant="body1">Total Enrollment: {totalEnrollment} students</Typography>
      {district && (
        <Typography variant="body1">District: {district.name}</Typography>
      )}
      {sau && (
        <Typography variant="body1">SAU: {sau.id}</Typography>
      )}
      
      <Divider sx={{ my: 3 }} />
      
      <Stack direction="column" spacing={2} sx={{ mb: 4 }}>
        <Button 
          variant="outlined" 
          component={Link} 
          to={`/school/${id}/academic`}
          fullWidth
        >
          Academic Achievement
        </Button>
        <Button 
          variant="outlined" 
          component={Link} 
          to={`/school/${id}/financials`}
          fullWidth
        >
          Financials
        </Button>
        <Button 
          variant="outlined" 
          component={Link} 
          to={`/school/${id}/demographics`}
          fullWidth
        >
          Demographics
        </Button>
        <Button 
          variant="outlined" 
          component={Link} 
          to={`/school/${id}/safety`}
          fullWidth
        >
          School Safety
        </Button>
        <Button 
          variant="outlined" 
          component={Link} 
          to={`/school/${id}/staff`}
          fullWidth
        >
          Staff Metrics
        </Button>
        <Button 
          variant="outlined" 
          component={Link} 
          to={`/school/${id}/contact`}
          fullWidth
        >
          Contact Information
        </Button>
      </Stack>
    </Box>
  );
};

export default School;
