import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  FormControl, 
  Button, 
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

  const handleViewDistrict = () => {
    if (selectedDistrict?.id) {
      navigate(`/district/${selectedDistrict.id}`);
    }
  };

  const handleDistrictChange = (_event: React.SyntheticEvent, district: District | null) => {
    setSelectedDistrict(district);
    if (district?.id) {
      navigate(`/district/${district.id}`);
    }
  };

  return (
    <Box sx={{ padding: '24px', width: '100%' }}>
      <Typography variant="body1" gutterBottom sx={{fontWeight: 'bold'}}>
        Questions about New Hampshire Schools?
      </Typography>
      <Typography variant="body1" gutterBottom>
        We've made state data accessible to provide clear, politically unbiased answers—just the facts you need.
      </Typography>
      <Typography variant="body1" gutterBottom>
        Start by selecting your district or viewing our statewide data.
      </Typography>
      
      <FormControl fullWidth sx={{ mt: 2 }}>
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
              label="School District"
              variant="outlined"
            />
          )}
        />
      </FormControl>

      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Button 
          variant="contained" 
          color="primary" 
          size="large"
          disabled={!selectedDistrict}
          onClick={handleViewDistrict}
        >
          View District Details
        </Button>
        <Button variant="outlined" color="primary" size="large">
          View Statewide Data
        </Button>
        <Button variant="outlined" color="primary" size="large">
          NH Education FAQ
        </Button>
      </Box>
    </Box>
  );
}