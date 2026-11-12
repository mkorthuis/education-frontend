import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Link, CircularProgress, Container, ToggleButton, ToggleButtonGroup, useMediaQuery, useTheme } from '@mui/material';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { locationApi } from '@/services/api/endpoints/locations';
import SectionTitle from '@/components/ui/SectionTitle';

interface School {
  id: number;
  name: string;
  district_id: number;
  city?: string | null;
  kind?: string | null;
}

// Which schools the list shows, kept in the address (/schools?type=charter) so a link can open it
// filtered: every public school, the school districts' or the public charter schools
type Filter = 'all' | 'district' | 'charter';
// Phones get the short labels, so the three fit on one line
const FILTERS: { value: Filter; label: string; shortLabel: string }[] = [
  { value: 'all', label: 'All', shortLabel: 'All' },
  { value: 'district', label: 'District Schools', shortLabel: 'District' },
  { value: 'charter', label: 'Charter Schools', shortLabel: 'Charter' },
];
const filterFrom = (type: string | null): Filter => (type === 'district' || type === 'charter' ? type : 'all');

const isCharter = (school: School) => school.kind === 'charter';

/** "BEDFORD" as "Bedford"; towns come from the state's list in mixed case. */
const townName = (city: string) => city.toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase());

/**
 * Schools page that lists every public school in a simple 3-column list, like the districts page:
 * the school districts' schools and the public charter schools, each marked, with a filter for either
 */
const SchoolList: React.FC = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = filterFrom(searchParams.get('type'));
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));

  // Fetch the schools and the public districts when the page mounts
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setLoading(true);
        const [schoolsData, districtsData] = await Promise.all([locationApi.getSchools(), locationApi.getDistricts()]);
        // Public schools only, like the districts page: schools in a public school district, and charter schools
        const publicDistricts = new Set((districtsData as { id: number }[]).map(district => district.id));
        const sortedSchools = (schoolsData as School[])
          .filter(school => publicDistricts.has(school.district_id) || isCharter(school))
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

  const counts: Record<Filter, number> = {
    all: schools.length,
    district: schools.filter(school => !isCharter(school)).length,
    charter: schools.filter(isCharter).length,
  };
  const shown = filter === 'all' ? schools : schools.filter(school => isCharter(school) === (filter === 'charter'));

  return (
    <Container maxWidth="xl">
      <SectionTitle displayName="NH Public Schools" />

      <Box sx={{ mb: 2 }}>
        <Typography variant="body1">
          Explore all public schools in New Hampshire, including public charter schools, which are run by their own
          boards rather than a school district. Click on any school to view detailed information.
        </Typography>
      </Box>

      <ToggleButtonGroup
        value={filter}
        exclusive
        onChange={(_event, value: Filter | null) => value && setSearchParams(value === 'all' ? {} : { type: value }, { replace: true })}
        aria-label="Which schools to list"
        size="small"
        sx={{
          mb: 3,
          '& .MuiToggleButton-root': { color: 'text.primary', fontWeight: 500, textTransform: 'none' },
          '& .MuiToggleButton-root.Mui-selected': { bgcolor: 'rgba(0, 0, 0, 0.08)', color: 'text.primary' },
        }}
      >
        {FILTERS.map(({ value, label, shortLabel }) => (
          <ToggleButton key={value} value={value}>{isPhone ? shortLabel : label} ({counts[value]})</ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Grid container spacing={1}>
        {shown.map((school) => (
          <Grid item xs={12} sm={6} md={4} key={school.id}>
            <Link
              component={RouterLink}
              to={`/school/${school.id}`}
              color="primary"
              underline="hover"
              sx={{ fontWeight: 500 }}
            >
              {school.name}
              {(nameCounts.get(school.name) ?? 0) > 1 && school.city ? ` (${townName(school.city)})` : ''}
            </Link>
            {/* Marked in the full list; the charter list needs no mark */}
            {isCharter(school) && filter !== 'charter' && (
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.75, fontSize: '0.8125rem' }}>
                Charter
              </Typography>
            )}
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default SchoolList;
