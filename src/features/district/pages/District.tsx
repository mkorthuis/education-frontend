import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Divider, CircularProgress, Alert, Button, Stack, Tooltip } from '@mui/material';
import { useAppSelector } from '@/store/hooks';
import { 
  selectCurrentDistrict, 
  selectCurrentTowns, 
  selectCurrentSchools, 
  selectCurrentSau, 
  selectLocationLoading, 
  selectLocationError
} from '@/store/slices/locationSlice';
import { formatGradesDisplay } from '@/utils/formatting';

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
 * Represents the District page/feature.
 * Displays district information from the Redux store.
 */
const District: React.FC = () => {
  const [showAllSchools, setShowAllSchools] = useState(false);
  
  // Select from Redux store
  const district = useAppSelector(selectCurrentDistrict);
  const towns = useAppSelector(selectCurrentTowns);
  const schools = useAppSelector(selectCurrentSchools);
  const sau = useAppSelector(selectCurrentSau);
  const loading = useAppSelector(selectLocationLoading);
  const error = useAppSelector(selectLocationError);

  // Determine if the district includes the graduation grade
  const hasGraduationGrade = district?.grades?.some(
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

  if (!district || !sau) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning">No district information found.</Alert>
      </Box>
    );
  }


  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        {district.name} (SAU #{sau.id})
      </Typography>
      
      <Typography variant="h6">Towns Served</Typography>
      <Box sx={{ mb: 2 }}>
        {towns.map((town) => (
          <Typography key={town.id} variant="body1">
            {town.name}
          </Typography>
        ))}
      </Box>
      
      <Typography variant="h6">Schools</Typography>
      <Box sx={{ mb: 4 }}>
        {schools.length > 0 && (
          schools.length <= 7 || showAllSchools 
            ? schools.map((school) => {
                const gradesDisplay = formatGradesDisplay(school);
                
                return (
                  <Typography key={school.id} variant="body1">
                    <Link to={`/school/${school.id}`} style={{ textDecoration: 'none', color: 'primary.main' }}>
                      {school.name}
                    </Link>
                    {gradesDisplay && ` (${gradesDisplay})`}
                  </Typography>
                );
              })
            : schools.slice(0, 5).map((school) => {
                const gradesDisplay = formatGradesDisplay(school);
                
                return (
                  <Typography key={school.id} variant="body1">
                    <Link to={`/school/${school.id}`} style={{ textDecoration: 'none', color: 'primary.main' }}>
                      {school.name}
                    </Link>
                    {gradesDisplay && ` (${gradesDisplay})`}
                  </Typography>
                );
              })
        )}
        
        {schools.length > 7 && (
          <Typography 
            component="span"
            onClick={() => setShowAllSchools(!showAllSchools)} 
            sx={{ 
              color: 'primary.main', 
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'inline-block'
            }}
          >
            {showAllSchools ? 'Show less' : `Show All ${schools.length} Schools`}
          </Typography>
        )}
      </Box>

      <Divider sx={{ my: 3 }} />
      
      <Stack direction="column" spacing={2} sx={{ mb: 4 }}>
        {schools.length === 0 ? (
          <Tooltip 
            title="Your town does not operate schools. Please view the districts who receive your students for information" 
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
                Academic Achievement
              </Button>
            </span>
          </Tooltip>
        ) : (
          <Button 
            variant="outlined" 
            color="inherit"
            component={Link} 
            to={`/district/${district.id}/academic`}
            fullWidth
            sx={navigationButtonStyle}
          >
            Academic Achievement
          </Button>
        )}

        {schools.length === 0 ? (
          <Tooltip 
            title="Your town does not operate schools. Please view the districts who receive your students for information" 
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
        ) : hasGraduationGrade ? (
          <Button 
            variant="outlined" 
            color="inherit"
            component={Link} 
            to={`/district/${district.id}/outcomes`}
            fullWidth
            sx={navigationButtonStyle}
          >
            Graduation / College
          </Button>
        ) : (
          <Tooltip 
            title={`This District Does Not Educate ${GRADUATION_GRADE} Students. For Information, Refer to the District ${GRADUATION_GRADE} Students Are Sent To.`} 
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
          component={Link} 
          to={`/district/${district.id}/financials`}
          fullWidth
          sx={navigationButtonStyle}
        >
          Financials
        </Button>

        {schools.length === 0 ? (
          <Tooltip 
            title="Your town does not operate schools. Please view the districts who receive your students for information" 
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
                Safety
              </Button>
            </span>
          </Tooltip>
        ) : (
          <Button 
            variant="outlined" 
            color="inherit"
            component={Link} 
            to={`/district/${district.id}/safety`}
            fullWidth
            sx={navigationButtonStyle}
          >
            Safety
          </Button>
        )}

        <Button 
          variant="outlined" 
          color="inherit"
          component={Link} 
          to={`/district/${district.id}/enrollment`}
          fullWidth
          sx={navigationButtonStyle}
        >
          Enrollment
        </Button>

        <Button 
          variant="outlined" 
          color="inherit"
          component={Link} 
          to={`/district/${district.id}/efa`}
          fullWidth
          sx={navigationButtonStyle}
        >
          Education Freedom Accounts
        </Button>

        {schools.length === 0 ? (
          <Tooltip 
            title="Your town does not operate schools. Please view the districts who receive your students for information" 
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
                Staff
              </Button>
            </span>
          </Tooltip>
        ) : (
          <Button 
            variant="outlined" 
            color="inherit"
            component={Link} 
            to={`/district/${district.id}/staff`}
            fullWidth
            sx={navigationButtonStyle}
          >
            Staff
          </Button>
        )}

        <Button 
          variant="outlined" 
          color="inherit"
          component={Link} 
          to={`/district/${district.id}/contact`}
          fullWidth
          sx={navigationButtonStyle}
        >
          Contact Information
        </Button>
      </Stack>
    </Box>
  );
};

export default District;
