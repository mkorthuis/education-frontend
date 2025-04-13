import React, { useEffect } from 'react';
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

/**
 * Represents the District page/feature.
 * Displays district information based on the ID from the URL.
 */
const District: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  
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
        {schools.map((school) => {
          const gradesDisplay = formatGradesDisplay(school);
          
          return (
            <Typography key={school.id} variant="body1">
              <Link to={`/school/${school.id}`} style={{ textDecoration: 'none', color: 'primary.main' }}>
                {school.name}
              </Link>
              {gradesDisplay && ` (${gradesDisplay})`}
            </Typography>
          );
        })}
      </Box>

      <Divider sx={{ my: 3 }} />
      
      <Stack direction="column" spacing={2} sx={{ mb: 4 }}>
        <Button 
          variant="outlined" 
          component={Link} 
          to={`/district/${id}/academic`}
          fullWidth
        >
          Academic Achievement
        </Button>
        <Button 
          variant="outlined" 
          component={Link} 
          to={`/district/${id}/financials`}
          fullWidth
        >
          Financials
        </Button>
        <Button 
          variant="outlined" 
          component={Link} 
          to={`/district/${id}/demographics`}
          fullWidth
        >
          Demographics
        </Button>
        <Button 
          variant="outlined" 
          component={Link} 
          to={`/district/${id}/safety`}
          fullWidth
        >
          Safety
        </Button>
        <Button 
          variant="outlined" 
          component={Link} 
          to={`/district/${id}/staff`}
          fullWidth
        >
          Staff Metrics
        </Button>
        <Button 
          variant="outlined" 
          component={Link} 
          to={`/district/${id}/contact`}
          fullWidth
        >
          Contact Information
        </Button>
      </Stack>
    </Box>
  );
};

export default District;
