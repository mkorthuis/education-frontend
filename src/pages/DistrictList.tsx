import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Link, CircularProgress, Container } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { locationApi } from '@/services/api/endpoints/locations';
import SectionTitle from '@/components/ui/SectionTitle';

// Define District interface based on the existing interface in the codebase
interface District {
  id: number;
  name: string;
  grades?: { id: number; name: string }[];
}

/**
 * Districts page that displays all available districts in a simple 3-column list
 */
const DistrictList: React.FC = () => {
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all districts when component mounts
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        setLoading(true);
        const districtsData = await locationApi.getDistricts();
        // Create a copy of the array before sorting to avoid modifying a potentially read-only array
        const sortedDistricts = [...districtsData].sort((a: District, b: District) => 
          a.name.localeCompare(b.name)
        );
        setDistricts(sortedDistricts);
      } catch (error) {
        console.error('Failed to fetch districts:', error);
        setError('Failed to load districts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDistricts();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <SectionTitle displayName="NH School Districts" />
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="body1">
          Explore all school districts in New Hampshire. Click on any district to view detailed information.
        </Typography>
      </Box>
      
      <Grid container spacing={1}>
        {districts.map((district) => (
          <Grid item xs={12} sm={6} md={4} key={district.id}>
            <Link
              component={RouterLink}
              to={`/district/${district.id}`}
              color="primary"
              underline="hover"
              sx={{ 
                display: 'block',
                py: 0,
                fontWeight: 500
              }}
            >
              {district.name}
            </Link>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default DistrictList; 