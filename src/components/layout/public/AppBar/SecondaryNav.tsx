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
    color: theme.palette.custom.secondaryNav.text,
  },
}));

// Define the type for navigation items
type NavItem = {
  label: string;
  path: string;
  enabled: boolean;
  tooltip: string;
  section: string; // Store the section name for matching
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

  // Get the current section from URL (e.g., "academic" from "/district/142/academic/")
  const currentSection = useMemo(() => {
    const pathParts = location.pathname.split('/');
    // For district or school pages, the section is the 4th part of the path
    if (pathParts.length >= 4 && (pathParts[1] === 'district' || pathParts[1] === 'school')) {
      return pathParts[3] || 'overview'; // Default to 'overview' if no section
    }
    return '';
  }, [location.pathname]);

  // Determine which navigation items to use based on page type
  const navItems = useMemo(() => {
    // If we're on a school page, show school navigation
    if (pageType === PageType.SCHOOL && school.id) {
      return school.availablePages.map(page => {
        // Extract section from path (e.g., "academic" from "/school/123/academic")
        const pathParts = page.path.split('/');
        const section = pathParts.length >= 4 ? pathParts[3] : 'overview';
        
        return { 
          label: page.shortName || page.name, 
          path: page.path,
          enabled: page.enabled !== undefined ? page.enabled : true,
          tooltip: page.tooltip || '',
          section: section || 'overview'
        };
      });
    } 
    
    // If we're on a district page, show district navigation
    if (pageType === PageType.DISTRICT && district.id) {
      return district.availablePages.map(page => {
        // Extract section from path (e.g., "academic" from "/district/123/academic")
        const pathParts = page.path.split('/');
        const section = pathParts.length >= 4 ? pathParts[3] : 'overview';
        
        return { 
          label: page.shortName || page.name, 
          path: page.path,
          enabled: page.enabled !== undefined ? page.enabled : true,
          tooltip: page.tooltip || '',
          section: section || 'overview'
        };
      });
    }
    
    // If no appropriate navigation, return empty array
    return [] as NavItem[];
  }, [school, district, pageType]);

  // Calculate the active tab index based on the current section
  const activeTabIndex = useMemo(() => {
    if (navItems.length === 0) return 0;
    
    // Find the nav item with matching section
    const indexFromSection = navItems.findIndex(item => 
      item.section === currentSection
    );
    
    if (indexFromSection !== -1) return indexFromSection;
    
    // If no match found, fall back to the first tab
    return 0;
  }, [navItems, currentSection]);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    if (navItems.length > 0) {
      const navItem = navItems[newValue];
      
      // Only navigate if the tab is enabled
      if (navItem.enabled) {
        // Remove any optional path parameters and ensure a trailing slash
        const baseUrl = navItem.path.replace(/\/:[^/]+(\?)?$/, '/');
        navigate(baseUrl);
      }
    }
  };

  // Don't render if not on desktop OR if there are no navigation items to show
  if (!isMediumOrLarger || navItems.length === 0) return null;

  return (
    <Box 
      sx={{ 
        width: '100%',
        position: 'fixed',
        top: 56, // Position below the main AppBar (fixed at 56px height)
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
              <Tooltip key={`nav-${index}-${item.label}`} title={item.tooltip} arrow>
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
                key={`nav-${index}-${item.label}`}
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
      </Container>
    </Box>
  );
};

export default SecondaryNav; 