import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Link, CircularProgress, Container } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { locationApi } from '@/services/api/endpoints/locations';
import SectionTitle from '@/components/ui/SectionTitle';

interface School {
  id: number;
  name: string;
  district_id: number;
  city?: string | null;
}

/** "BEDFORD" as "Bedford"; towns come from the state's list in mixed case. */
const townName = (city: string) => city.toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase());

/**
 * Schools page that lists every public school in a simple 3-column list, like the districts page
 */
const SchoolList: React.FC = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch the schools and the public districts when the page mounts
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setLoading(true);
        const [schoolsData, districtsData] = await Promise.all([locationApi.getSchools(), locationApi.getDistricts()]);
        // Public schools only, like the districts page: schools in a public school district
        const publicDistricts = new Set((districtsData as { id: number }[]).map(district => district.id));
        const sortedSchools = (schoolsData as School[])
          .filter(school => publicDistricts.has(school.district_id))
          .sort((a, b) => a.name.localeCompare(b.name));
        setSchools(sortedSchools);
      } catch (error) {
        console.error('Failed to fetch schools:', error);
        setError('Failed to load schools. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSchools();
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

  // Names more than one school shares get their town, so they can be told apart
  const nameCounts = new Map<string, number>();
  schools.forEach(school => nameCounts.set(school.name, (nameCounts.get(school.name) ?? 0) + 1));

  return (
    <Container maxWidth="xl">
      <SectionTitle displayName="NH Public Schools" />

      <Box sx={{ mb: 3 }}>
        <Typography variant="body1">
          Explore all public schools in New Hampshire. Click on any school to view detailed information.
        </Typography>
      </Box>

      <Grid container spacing={1}>
        {schools.map((school) => (
          <Grid item xs={12} sm={6} md={4} key={school.id}>
            <Link
              component={RouterLink}
              to={`/school/${school.id}`}
              color="primary"
              underline="hover"
              sx={{
                display: 'block',
                py: 0,
                fontWeight: 500
              }}
            >
              {school.name}
              {(nameCounts.get(school.name) ?? 0) > 1 && school.city ? ` (${townName(school.city)})` : ''}
            </Link>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default SchoolList;
