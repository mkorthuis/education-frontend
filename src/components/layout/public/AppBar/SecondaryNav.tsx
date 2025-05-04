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
import { 
  selectSchool, 
  selectDistrict, 
  selectCurrentPage,
  selectCurrentPageId,
  getPageType,
  PageType
} from '@/store/store';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';

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
  const currentPageId = useSelector(selectCurrentPageId);
  const pageType = getPageType(currentPageId);

  // Determine which navigation items to use based on page type
  const navItems = useMemo(() => {
    // If we're on a school page, show school navigation
    if (pageType === PageType.SCHOOL && school.id) {
      return school.availablePages.map(page => ({ 
        label: page.shortName || page.name, 
        path: page.path,
        enabled: page.enabled !== undefined ? page.enabled : true,
        tooltip: page.tooltip || '' 
      }));
    } 
    
    // If we're on a district page, show district navigation
    if (pageType === PageType.DISTRICT && district.id) {
      return district.availablePages.map(page => ({ 
        label: page.shortName || page.name, 
        path: page.path,
        enabled: page.enabled !== undefined ? page.enabled : true,
        tooltip: page.tooltip || '' 
      }));
    }
    
    // If no appropriate navigation, return empty array
    return [] as NavItem[];
  }, [school, district, pageType]);

  // Calculate the active tab index based on current location
  const activeTabIndex = useMemo(() => {
    // First try to match based on current page urlPatterns
    if (currentPage && currentPage.urlPatterns && navItems.length > 0) {
      // Extract the base path from the first URL pattern
      const basePath = currentPage.urlPatterns[0].split('/').slice(0, 3).join('/');
      
      const indexFromStore = navItems.findIndex(item => 
        item.path.startsWith(basePath)
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