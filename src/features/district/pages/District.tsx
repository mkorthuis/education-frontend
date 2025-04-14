import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Box, Typography, Divider, CircularProgress, Alert, Button, Stack } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { 
  fetchAllDistrictData, 
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

/**
 * Represents the District page/feature.
 * Displays district information based on the ID from the URL.
 */
const District: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const [showAllSchools, setShowAllSchools] = useState(false);
  
  // Select from Redux store
  const district = useAppSelector(selectCurrentDistrict);
  const towns = useAppSelector(selectCurrentTowns);
  const schools = useAppSelector(selectCurrentSchools);
  const sau = useAppSelector(selectCurrentSau);
  const loading = useAppSelector(selectLocationLoading);
  const error = useAppSelector(selectLocationError);

  useEffect(() => {
    if (id) {
      dispatch(fetchAllDistrictData(Number(id)));
    }
  }, [id, dispatch]);

  // Show loading when:
  // 1. We're explicitly in a loading state
  // 2. OR we've initiated a fetch (id exists) but don't have district data yet
  const isLoading = loading || (!!id && !district && !error);

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

  if (!district || !sau) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning">No district information found.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Divider sx={{ mb: 2 }} />
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
        <Button 
          variant="outlined" 
          color="inherit"
          component={Link} 
          to={`/district/${id}/academic`}
          fullWidth
          sx={navigationButtonStyle}
        >
          Academic Achievement
        </Button>
        <Button 
          variant="outlined" 
          color="inherit"
          component={Link} 
          to={`/district/${id}/financials`}
          fullWidth
          sx={navigationButtonStyle}
        >
          Financials
        </Button>
        <Button 
          variant="outlined" 
          color="inherit"
          component={Link} 
          to={`/district/${id}/safety`}
          fullWidth
          sx={navigationButtonStyle}
        >
          Safety
        </Button>
        <Button 
          variant="outlined" 
          color="inherit"
          component={Link} 
          to={`/district/${id}/contact`}
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

export default District;
