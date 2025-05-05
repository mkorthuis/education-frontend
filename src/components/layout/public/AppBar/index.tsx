import { 
  AppBar as MuiAppBar, 
  Toolbar, 
  Typography, 
  Container, 
  useMediaQuery, 
  IconButton, 
  Box, 
  Autocomplete, 
  TextField, 
  InputAdornment,
  Popper
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useLocation, matchPath, useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/Menu';
import { useRef, useState } from 'react';
import MainMenu from '../Navigation/MainMenu';
import SecondaryNav from './SecondaryNav';

// Define District interface locally
interface District {
  id: number;
  name: string;
  grades?: { id: number; name: string }[];
}

interface AppBarProps {
  districts: District[];
  loading: boolean;
  selectedDistrict: District | null;
  onDistrictChange: (event: React.SyntheticEvent, district: District | null) => void;
}

/**
 * Main application bar with navigation and search functionality
 */
const AppBar: React.FC<AppBarProps> = ({ 
  districts, 
  loading, 
  selectedDistrict, 
  onDistrictChange 
}) => {
  const theme = useTheme();
  const isMediumOrLarger = useMediaQuery(theme.breakpoints.up('md'));
  const location = useLocation();
  const navigate = useNavigate();
  
  const [mainMenuOpen, setMainMenuOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const isHomePage = location.pathname === '/' || location.pathname === '/home';

  const toggleMobileSearch = () => {
    setShowMobileSearch(!showMobileSearch);
  };

  const handleMobileDistrictChange = (event: React.SyntheticEvent, district: District | null) => {
    onDistrictChange(event, district);
    if (district) {
      setShowMobileSearch(false);
    }
  };

  const handleDesktopDistrictChange = (event: React.SyntheticEvent, district: District | null) => {
    onDistrictChange(event, district);
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
  };

  const toggleMainMenu = () => {
    setMainMenuOpen(!mainMenuOpen);
  };
  
  // Check if SecondaryNav should be displayed (only on medium screens and up, and not on homepage)
  const showSecondaryNav = isMediumOrLarger && !isHomePage;

  // Custom Popper for mobile search
  const CustomPopper = function (props: any) {
    return <Popper {...props} placement="bottom-start" style={{ width: '100%' }} />;
  };

  return (
    <>
      {/* Outer AppBar container with full width but transparent background */}
      <Box sx={{ 
        width: '100%', 
        height: 56, 
        position: 'fixed',
        top: 0,
        zIndex: theme.zIndex.appBar + 50,
        bgcolor: 'transparent'
      }}>
        {/* Centered XL width AppBar with the colored background */}
        <Container 
          maxWidth="xl" 
          disableGutters
          sx={{ 
            height: '100%',
            margin: '0 auto',
            bgcolor: theme.palette.primary.main,
            boxShadow: 4,
            position: 'relative'
          }}
        >
          <Toolbar 
            disableGutters 
            sx={{ 
              px: { xs: 2, md: 3 },
              height: '100%',
              minHeight: '56px !important'
            }}
          >
            {/* Hamburger Menu Button */}
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={toggleMainMenu}
              edge="start"
              sx={{ mr: 2, color: 'white' }}
              ref={menuButtonRef}
            >
              <MenuIcon />
            </IconButton>

            {/* Page Title */}
            <Typography
              variant="h5"
              noWrap
              sx={{ flexGrow: isMediumOrLarger ? 0 : 1, color: 'white', fontWeight: 'bold' }}
            >
              NH Education Facts
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            
            {/* Desktop Search (medium+ screens) */}
            {!isHomePage && isMediumOrLarger && (
              <Box sx={{ width: '300px' }}>
                <Autocomplete
                  id="top-district-search"
                  options={districts}
                  getOptionLabel={(option) => option.name}
                  value={isSearchFocused ? null : selectedDistrict}
                  onChange={handleDesktopDistrictChange}
                  loading={loading}
                  size="small"
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search districts..."
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'white'
                        }
                      }}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ color: 'black' }} />
                          </InputAdornment>
                        )
                      }}
                    />
                  )}
                />
              </Box>
            )}
            
            {/* Mobile Search Icon */}
            {!isHomePage && !isMediumOrLarger && (
              <IconButton
                color="inherit"
                aria-label="search"
                onClick={toggleMobileSearch}
                sx={{ ml: 1, mr: -1, color: 'white' }}
              >
                <SearchIcon />
              </IconButton>
            )}
          </Toolbar>
        </Container>
      </Box>
      
      {/* Secondary Navigation */}
      {showSecondaryNav && <SecondaryNav />}
      
      {/* Mobile Search Bar */}
      {!isHomePage && !isMediumOrLarger && showMobileSearch && (
        <Box sx={{ 
          width: '100%', 
          padding: '8px 16px', 
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          position: 'fixed',
          top: '56px',
          zIndex: theme.zIndex.appBar - 1,
        }}>
          <Autocomplete
            id="mobile-district-search"
            options={districts}
            getOptionLabel={(option) => option.name}
            value={isSearchFocused ? null : selectedDistrict}
            onChange={handleMobileDistrictChange}
            loading={loading}
            PopperComponent={CustomPopper}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
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

      {/* Main Navigation Menu */}
      <MainMenu 
        open={mainMenuOpen} 
        onClose={() => setMainMenuOpen(false)} 
        anchorEl={menuButtonRef}
        hasSecondaryNav={showSecondaryNav}
      />
    </>
  );
};

export default AppBar; 