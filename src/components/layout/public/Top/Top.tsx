import { AppBar, Toolbar, Typography, Container, useMediaQuery, IconButton, Box, Autocomplete, TextField, Popper, InputAdornment } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MobileMenu from './MobileMenu';
import { useLocation, matchPath, useNavigate } from 'react-router-dom';
import { PATHS } from '@/routes/paths';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { 
  fetchDistricts,
  District
} from '@/store/slices/locationSlice';
import SearchIcon from '@mui/icons-material/Search';

export default function Top() {
  const theme = useTheme();
  const isMediumOrLarger = useMediaQuery(theme.breakpoints.up('md'));
  const isLargeOrLarger = useMediaQuery(theme.breakpoints.up('lg'));
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const prevPathsRef = useRef<string[]>([]);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  
  // District search state using direct state access
  const locationState = useAppSelector((state) => state.location);
  const districts = locationState.districts;
  const loading = locationState.loadingStates?.districts || false;
  const currentDistrict = locationState.currentDistrict;
  const currentSchool = locationState.currentSchool;
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);

  // Track navigation history within our app
  useEffect(() => {
    // Only add to history if it's a new path (prevents duplicates)
    const currentPaths = prevPathsRef.current;
    const lastPath = currentPaths.length > 0 ? currentPaths[currentPaths.length - 1] : null;
    
    // Only add the path if it's different from the last one
    if (lastPath !== location.pathname) {
      prevPathsRef.current = [...currentPaths, location.pathname].slice(-5); // Keep last 5 paths
    }
  }, [location]);

  // Load districts when component mounts
  useEffect(() => {
    dispatch(fetchDistricts());
  }, [dispatch]);

  // Find the current path title
  let currentTitle = 'NH Education Facts'; // Default title
  
  // Check if we're on the home page
  const isHomePage = location.pathname === '/' || location.pathname === '/home';
  
  for (const key in PATHS.PUBLIC) {
    const route = PATHS.PUBLIC[key as keyof typeof PATHS.PUBLIC];
    if (matchPath({ path: route.path, end: true }, location.pathname)) {
        currentTitle = route.title;
        break;
    }
  }

  const handleBackClick = () => {
    try {
      // Check if there's history to go back to
      if (window.history.length > 1) {
        // Check if we have previous paths in our app's history
        const hasInternalHistory = prevPathsRef.current.length > 1;
        
        if (hasInternalHistory) {
          // We have previous paths in our app, navigate back
          navigate(-1);
        } else {
          // No internal history or coming from external source, go to home
          navigate('/');
        }
      } else {
        // No history at all, go to home
        navigate('/');
      }
    } catch (e) {
      // Fallback to home if navigation fails for any reason
      navigate('/');
    }
  };

  const handleDistrictChange = (_event: React.SyntheticEvent, district: District | null) => {
    setSelectedDistrict(district);
    if (district?.id) {
      navigate(`/district/${district.id}`);
      setShowMobileSearch(false);
    }
  };

  // Custom Popper for mobile that opens below the top bar
  const CustomPopper = function (props: any) {
    return <Popper {...props} placement="bottom-start" style={{ width: '100%' }} />;
  };
  
  const toggleMobileSearch = () => {
    setShowMobileSearch(!showMobileSearch);
  };

  return (
    <>
      <AppBar position="static">
        <Container maxWidth={false} sx={{ px: { xs: '2', md: '50px' } }}>
          <Toolbar disableGutters>
            <Typography
              variant={isMediumOrLarger ? "h4" : "h5"}
              noWrap
              sx={{ flexGrow: isMediumOrLarger ? 0 : 1 }}
            >
              {currentTitle}
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            
            {/* Search on desktop (medium and larger screens) - only on non-home pages */}
            {!isHomePage && isMediumOrLarger && (
              <Box sx={{ width: '300px', mr: 2 }}>
                <Autocomplete
                  id="top-district-search"
                  options={districts}
                  getOptionLabel={(option) => option.name}
                  value={selectedDistrict}
                  onChange={handleDistrictChange}
                  loading={loading}
                  size="small"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search districts..."
                      variant="outlined"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        )
                      }}
                    />
                  )}
                />
              </Box>
            )}
            
            {/* Search icon for mobile - only on non-home pages */}
            {!isHomePage && !isMediumOrLarger && (
              <IconButton
                color="inherit"
                aria-label="search"
                onClick={toggleMobileSearch}
                sx={{ ml: 1 }}
              >
                <SearchIcon />
              </IconButton>
            )}
            
            <MobileMenu />
          </Toolbar>
        </Container>
      </AppBar>
      
      {/* Mobile search bar that appears below the app bar when toggled */}
      {!isHomePage && !isMediumOrLarger && showMobileSearch && (
        <Box sx={{ 
          width: '100%', 
          padding: '8px 16px', 
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText
        }}>
          <Autocomplete
            id="mobile-district-search"
            options={districts}
            getOptionLabel={(option) => option.name}
            value={selectedDistrict}
            onChange={handleDistrictChange}
            loading={loading}
            PopperComponent={CustomPopper}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search districts..."
                variant="outlined"
                fullWidth
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'white'
                  }
                }}
              />
            )}
          />
        </Box>
      )}
    </>
  );
}
