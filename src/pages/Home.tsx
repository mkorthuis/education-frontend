import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import { 
  Box, 
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

/**
 * Home page component that allows users to select a school district
 * and access education information.
 */
export default function Home() {
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const dispatch = useAppDispatch();
  const districts = useAppSelector(selectDistricts);
  const loading = useAppSelector(selectLocationLoading);
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchDistricts());
  }, [dispatch]);

  const handleDistrictChange = (_event: React.SyntheticEvent, district: District | null) => {
    setSelectedDistrict(district);
    if (district?.id) {
      navigate(`/district/${district.id}`);
    }
  };

  return (
    <Box sx={{ 
      padding: {
        xs: '24px 24px 24px 0',
        sm: '24px 24px 24px 8px',
        md: '24px 24px 24px 24px',
      },
      width: '100%',
      maxWidth: {
        xs: '100%',
        sm: '80%',
        md: '60%', 
        lg: '50%',  
        xl: '40%' 
      }
    }}>
      <Typography variant="body1"  sx={{fontWeight: 'bold', mb: 2}}>
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
              label="Select District"
              variant="outlined"
            />
          )}
        />
      </FormControl>

      <Typography variant="body1" sx={{mt: 3}}>
        Or see <Link to={PAGE_REGISTRY.state.overview.urlPatterns[0]}>statewide data for all of New Hampshire</Link>: enrollment, spending, test scores, graduation and more.
      </Typography>
    </Box>
  );
}