import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Divider, CircularProgress, Alert, Button, Stack, Tooltip, Link } from '@mui/material';
import { useAppSelector } from '@/store/hooks';
import { 
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

const GRADUATION_GRADE = import.meta.env.VITE_GRADUATION_GRADE;

/**
 * Represents the School page/feature.
 * Displays school information from the Redux store.
 */
const School: React.FC = () => {
  // Select from Redux store
  const school = useAppSelector(selectCurrentSchool);
  const district = useAppSelector(selectCurrentDistrict);
  const sau = useAppSelector(selectCurrentSau);
  const loading = useAppSelector(selectLocationLoading);
  const error = useAppSelector(selectLocationError);

  // Determine if the school includes the graduation grade
  const hasGraduationGrade = school?.grades?.some(
    (grade) => grade.name === GRADUATION_GRADE
  );

  if (loading) {
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
      <Typography variant="h5" gutterBottom>
        {school.name}
      </Typography>
      <Typography variant="body1">{school.school_type?.name || 'School Type Not Available'}</Typography>
      <Typography variant="body1">Grades: {gradesDisplay}</Typography>
      <Typography variant="body1">Total Enrollment: {totalEnrollment} students</Typography>
      {district && (
        <Typography variant="body1">
          District: <Link component={RouterLink} to={`/district/${district.id}`} color="primary" underline="hover">{district.name}</Link>
        </Typography>
      )}
      {sau && (
        <Typography variant="body1">SAU: {sau.id}</Typography>
      )}
      
      <Divider sx={{ my: 3 }} />
      
      <Stack direction="column" spacing={2} sx={{ mb: 4 }}>
      <Button 
          variant="outlined" 
          color="inherit"
          component={RouterLink} 
          to={`/school/${school.id}/academic`}
          fullWidth
          sx={navigationButtonStyle}
        >
          Academic Achievement
        </Button>
        {hasGraduationGrade ? (
          <Button 
            variant="outlined" 
            color="inherit"
            component={RouterLink} 
            to={`/school/${school.id}/outcomes`}
            fullWidth
            sx={navigationButtonStyle}
          >
            Graduation / College
          </Button>
        ) : (
          <Tooltip 
            title={`This school does not educate ${GRADUATION_GRADE} students.`} 
            arrow
          >
            <span style={{ width: '100%' }}>
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
                Graduation / College
              </Button>
            </span>
          </Tooltip>
        )}
        <Button 
          variant="outlined" 
          color="inherit"
          component={RouterLink} 
          to={`/school/${school.id}/safety`}
          fullWidth
          sx={navigationButtonStyle}
        >
          School Safety
        </Button>
        <Button 
          variant="outlined" 
          color="inherit"
          component={RouterLink} 
          to={`/school/${school.id}/contact`}
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
          Demographics
        </Button>
      </Stack>
    </Box>
  );
};

export default School;
