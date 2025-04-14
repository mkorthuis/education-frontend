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

// Common button styles
const navigationButtonStyle = {
  backgroundColor: 'grey.100', 
  borderColor: 'divider',
  color: 'text.primary',
  '&:hover': {
    backgroundColor: 'grey.300',
  }
};

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
          color="inherit"
          component={Link} 
          to={`/school/${id}/contact`}
          fullWidth
          sx={navigationButtonStyle}
        >
          Contact Information
        </Button>
        <Divider sx={{ my: 2 }} />
        <Button 
          variant="outlined" 
          color="inherit"
          component="div" 
          disabled
          fullWidth
          sx={{
            ...navigationButtonStyle,
            opacity: 0.6,
            cursor: 'not-allowed',
            '&.Mui-disabled': {
              color: 'text.secondary',
              backgroundColor: 'grey.100',
              borderColor: 'divider'
            }
          }}
        >
          Academic Achievement
        </Button>
        <Button 
          variant="outlined" 
          color="inherit"
          component="div" 
          disabled
          fullWidth
          sx={{
            ...navigationButtonStyle,
            opacity: 0.6,
            cursor: 'not-allowed',
            '&.Mui-disabled': {
              color: 'text.secondary',
              backgroundColor: 'grey.100',
              borderColor: 'divider'
            }
          }}
        >
          Financials
        </Button>
        <Button 
          variant="outlined" 
          color="inherit"
          component="div" 
          disabled
          fullWidth
          sx={{
            ...navigationButtonStyle,
            opacity: 0.6,
            cursor: 'not-allowed',
            '&.Mui-disabled': {
              color: 'text.secondary',
              backgroundColor: 'grey.100',
              borderColor: 'divider'
            }
          }}
        >
          School Safety
        </Button>
        <Button 
          variant="outlined" 
          color="inherit"
          component="div" 
          disabled
          fullWidth
          sx={{
            ...navigationButtonStyle,
            opacity: 0.6,
            cursor: 'not-allowed',
            '&.Mui-disabled': {
              color: 'text.secondary',
              backgroundColor: 'grey.100',
              borderColor: 'divider'
            }
          }}
        >
          Demographics
        </Button>
        <Button 
          variant="outlined" 
          color="inherit"
          component="div" 
          disabled
          fullWidth
          sx={{
            ...navigationButtonStyle,
            opacity: 0.6,
            cursor: 'not-allowed',
            '&.Mui-disabled': {
              color: 'text.secondary',
              backgroundColor: 'grey.100',
              borderColor: 'divider'
            }
          }}
        >
          Staff Metrics
        </Button>
      </Stack>
    </Box>
  );
};

export default School;
