import { 
  Box, 
  Container, 
  Tabs, 
  Tab, 
  useTheme, 
  useMediaQuery,
  styled,
  Tooltip
} from '@mui/material';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, matchPath } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectSchool, selectDistrict } from '@/store/store';
import { 
  selectCurrentPage, 
  setCurrentPage, 
  determineCurrentPage 
} from '@/store/slices/pageSlice';

// Custom styled Tab for better appearance
const NavTab = styled(Tab)(({ theme }) => ({
  minWidth: 100,
  fontWeight: 500,
  color: theme.palette.custom.secondaryNav.text,
  '&.Mui-selected': {
    fontWeight: 700,
    color: theme.palette.custom.secondaryNav.text,
  },
}));

// Define the type for navigation items
type NavItem = {
  label: string;
  path: string;
  enabled: boolean;
  tooltip: string;
};

/**
 * Secondary navigation bar that appears below the main AppBar on desktop
 */
const SecondaryNav = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const isMediumOrLarger = useMediaQuery(theme.breakpoints.up('md'));
  const [value, setValue] = useState(0);
  
  // Get school and district data from pageReducer
  const school = useSelector(selectSchool);
  const district = useSelector(selectDistrict);
  const currentPage = useSelector(selectCurrentPage);

  // Determine which navigation items to use
  const navItems = useMemo(() => {
    if (school.id) {
      return school.availablePages.map(page => ({ 
        label: page.shortName || page.name, 
        path: page.path,
        enabled: page.enabled !== undefined ? page.enabled : true,
        tooltip: page.tooltip || '' 
      }));
    } 
    
    if (district.id) {
      return district.availablePages.map(page => ({ 
        label: page.shortName || page.name, 
        path: page.path,
        enabled: page.enabled !== undefined ? page.enabled : true,
        tooltip: page.tooltip || '' 
      }));
    }
    
    // If no school or district, return empty array
    return [] as NavItem[];
  }, [school, district]);

  // Update current page when location changes
  useEffect(() => {
    let matchedPage = null;
    
    // Try to match school pages first
    if (school.id && school.availablePages.length > 0) {
      matchedPage = determineCurrentPage(location.pathname, school.availablePages);
    }
    
    // Then try district pages if no match found
    if (!matchedPage && district.id && district.availablePages.length > 0) {
      matchedPage = determineCurrentPage(location.pathname, district.availablePages);
    }
    
    // Update the current page in Redux store if a match is found
    if (matchedPage) {
      dispatch(setCurrentPage(matchedPage));
    } else if (location.pathname !== '/') {
      // Default to home page if no match and not already on home
      dispatch(setCurrentPage({
        name: 'Home',
        path: '/',
        enabled: true,
        tooltip: ''
      }));
    }
  }, [location.pathname, dispatch, school, district]);

  // Calculate the active tab index based on current location
  const activeTabIndex = useMemo(() => {
    // First try exact match with current page path from store
    if (currentPage && currentPage.path && navItems.length > 0) {
      const indexFromStore = navItems.findIndex(item => 
        // Compare with paths after stripping any query params
        item.path.split('?')[0] === currentPage.path.split('?')[0]
      );
      if (indexFromStore !== -1) return indexFromStore;
    }
    
    // Then try pattern matching against the current URL pathname
    for (let i = 0; i < navItems.length; i++) {
      const item = navItems[i];
      // Convert the path pattern to handle route params
      const pattern = item.path.replace(/\/:[^/]+(\?)?/g, '/:param');
      if (matchPath({ path: pattern }, location.pathname)) {
        return i;
      }
    }
    
    // Default to first tab if no match found
    return 0;
  }, [navItems, currentPage, location.pathname]);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    if (navItems.length > 0) {
      const navItem = navItems[newValue];
      
      // Only navigate if the tab is enabled
      if (navItem.enabled) {
        navigate(navItem.path);
      }
    }
  };

  // Only render on desktop
  if (!isMediumOrLarger) return null;

  return (
    <Box 
      sx={{ 
        width: '100%',
        position: 'fixed',
        top: 64, // Position below the main AppBar
        height: 48,
        zIndex: theme.zIndex.appBar,
        bgcolor: 'transparent',
      }}
    >
      <Container 
        maxWidth="xl" 
        disableGutters
        sx={{ 
          height: '100%',
          margin: '0 auto',
          bgcolor: theme.palette.custom.secondaryNav.background,
          boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.2)',
        }}
      >
        {navItems.length > 0 && (
          <Tabs
            value={activeTabIndex}
            onChange={handleChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            TabIndicatorProps={{
              style: {
                backgroundColor: theme.palette.primary.main,
                height: 3
              }
            }}
            sx={{
              '& .MuiTabs-flexContainer': {
                justifyContent: 'flex-start',
              },
              '& .MuiTabs-indicator': {
                backgroundColor: theme.palette.secondary.main,
              },
              px: { xs: 2, md: 3 },
              height: '100%',
            }}
          >
            {navItems.map((item, index) => (
              item.tooltip ? (
                <Tooltip key={item.path} title={item.tooltip} arrow>
                  <span>
                    <NavTab 
                      label={item.label}
                      disabled={!item.enabled}
                      sx={{
                        opacity: item.enabled ? 1 : 0.6,
                        cursor: item.enabled ? 'pointer' : 'not-allowed',
                      }}
                    />
                  </span>
                </Tooltip>
              ) : (
                <NavTab 
                  key={item.path}
                  label={item.label}
                  disabled={!item.enabled}
                  sx={{
                    opacity: item.enabled ? 1 : 0.6,
                    cursor: item.enabled ? 'pointer' : 'not-allowed',
                  }}
                />
              )
            ))}
          </Tabs>
        )}
      </Container>
    </Box>
  );
};

export default SecondaryNav; 