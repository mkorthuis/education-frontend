import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import {
  Box,
  GlobalStyles,
  Typography,
  FormControl,
  Autocomplete,
  TextField
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchDistricts,
  selectDistricts,
  selectLocationLoading,
  District
} from '@/store/slices/locationSlice';
import { READING_WIDTH, type } from '@/theme/tokens';
import AskSection from '@/features/ask/AskSection';

/**
 * Home page component that allows users to select a school district, see statewide data, or ask
 * a question about New Hampshire schools.
 */
export default function Home() {
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const dispatch = useAppDispatch();
  const districts = useAppSelector(selectDistricts);
  const loading = useAppSelector(selectLocationLoading);
  const navigate = useNavigate();
  const districtInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dispatch(fetchDistricts());
  }, [dispatch]);

  const handleDistrictChange = (_event: React.SyntheticEvent, district: District | null) => {
    setSelectedDistrict(district);
    if (district?.id) {
      navigate(`/district/${district.id}`);
    }
  };

  // "Look Up a District" from the question box's messages
  const lookUpDistrict = () => {
    districtInputRef.current?.scrollIntoView({ block: 'center' });
    districtInputRef.current?.focus({ preventScroll: true });
  };

  return (
    // One reading-width column; the layout's container supplies the side gutters
    <Box sx={{ width: '100%', maxWidth: READING_WIDTH, py: 3 }}>
      {/* Keep focused and scrolled-to items clear of the fixed header */}
      <GlobalStyles styles={{ html: { scrollPaddingTop: 72 } }} />
      <Typography component="h1" sx={{ ...type.pageTitle, mb: 2 }}>
        New Hampshire Education Data Made Accessible
      </Typography>
      <Typography variant="body1" sx={{mb: 2}}>
        Start by Selecting Your District:
      </Typography>

      <FormControl fullWidth>
        <Autocomplete
          id="district-autocomplete"
          options={districts}
          getOptionLabel={(option) => option.name}
          value={selectedDistrict}
          onChange={handleDistrictChange}
          loading={loading}
          renderInput={(params) => (
            <TextField
              {...params}
              inputRef={districtInputRef}
              label="Select District"
              variant="outlined"
            />
          )}
        />
      </FormControl>

      <Typography variant="body1" sx={{mt: 3}}>
        Or see <Link to={PAGE_REGISTRY.state.overview.urlPatterns[0]}>statewide data for all of New Hampshire</Link>: enrollment, spending, test scores, graduation and more.
      </Typography>

      <AskSection onLookUpDistrict={lookUpDistrict} />
    </Box>
  );
}
