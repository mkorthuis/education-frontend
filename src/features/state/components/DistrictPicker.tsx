import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Autocomplete, Box, Button, Link, TextField, Typography, useMediaQuery, useTheme } from '@mui/material';
import { locationApi } from '@/services/api/endpoints/locations';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';

interface DistrictOption {
  id: number;
  name: string;
  grades?: { id: number; name: string }[];
}

// One request for the district list, shared by every picker on the page and across pages
let districtsRequest: Promise<DistrictOption[]> | null = null;
const loadDistricts = () => {
  districtsRequest ??= Promise.resolve(locationApi.getDistricts())
    .then((districts: DistrictOption[]) => [...districts].sort((a, b) => a.name.localeCompare(b.name)))
    .catch(() => {
      districtsRequest = null;
      return [];
    });
  return districtsRequest;
};

/**
 * Whether the district has this page, by the same rule its own section tabs use (e.g. no
 * Graduation page for a district without a high school), and the reason when it doesn't.
 */
const sectionAvailability = async (district: DistrictOption, section: string): Promise<{ available: boolean; reason: string }> => {
  const page = PAGE_REGISTRY.district[section];
  if (!page || page.enabled === true) return { available: true, reason: '' };
  if (page.enabled === false) return { available: false, reason: '' };
  const schools = await Promise.resolve(locationApi.getSchoolsByDistrictId(district.id)).catch(() => null);
  // When the schools can't be checked, open the page and let it say what it has
  if (!Array.isArray(schools)) return { available: true, reason: '' };
  const available = Boolean(page.enabled({ ...district, schools }));
  const reason = available ? '' : schools.length === 0
    ? `${district.name} doesn't run its own schools; its students attend schools in other districts.`
    : section === 'outcomes' ? `${district.name} doesn't run a high school.` : '';
  return { available, reason };
};

interface DistrictPickerProps {
  /** The district page to open, e.g. "financials"; the district overview when left out */
  section?: string;
  label?: string;
}

/** "See these figures for your district": picks a district and opens the same page for it. */
const DistrictPicker: React.FC<DistrictPickerProps> = ({ section, label = 'See these figures for your district' }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  // On phones the picker starts as a one-line link, to keep the first chart near the top
  const [opened, setOpened] = useState(false);
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState<{ district: DistrictOption; reason: string } | null>(null);
  const inputId = `district-picker-${section ?? 'overview'}`;
  const sectionName = section ? PAGE_REGISTRY.district[section]?.shortName ?? section : '';

  useEffect(() => {
    let active = true;
    loadDistricts().then(list => {
      if (!active) return;
      setDistricts(list);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const choose = async (district: DistrictOption | null) => {
    setUnavailable(null);
    if (!district) return;
    if (!section) {
      navigate(`/district/${district.id}`);
      return;
    }
    const { available, reason } = await sectionAvailability(district, section);
    if (available) navigate(`/district/${district.id}/${section}`);
    else setUnavailable({ district, reason });
  };

  // Without a district list there's nothing to pick from; the menu still links to every district
  if (!loading && districts.length === 0) return null;

  if (isPhone && !opened) {
    return (
      <Box sx={{ mb: 3 }}>
        <Button variant="text" onClick={() => setOpened(true)} sx={{ px: 0, minHeight: 40, textTransform: 'none', fontSize: '1rem' }}>
          {section ? 'Compare your district' : label}{'\u00a0'}<span aria-hidden>→</span>
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 4, maxWidth: 420 }}>
      <Typography component="label" htmlFor={inputId} variant="body1" sx={{ display: 'block', fontWeight: 500, mb: 1 }}>
        {label}
      </Typography>
      <Autocomplete
        id={inputId}
        options={districts}
        loading={loading}
        getOptionLabel={option => option.name}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        onChange={(_event, district) => { choose(district); }}
        size="small"
        openOnFocus
        renderInput={params => <TextField {...params} placeholder="Type a district name" autoFocus={isPhone && opened} />}
      />
      {unavailable && (
        <Typography role="status" variant="body2" sx={{ mt: 1 }}>
          {unavailable.reason ? `${unavailable.reason} ` : ''}It has no {sectionName} page on this site.{' '}
          <Link component={RouterLink} to={`/district/${unavailable.district.id}`}>
            Go to {unavailable.district.name}'s overview
          </Link>.
        </Typography>
      )}
    </Box>
  );
};

export default DistrictPicker;
