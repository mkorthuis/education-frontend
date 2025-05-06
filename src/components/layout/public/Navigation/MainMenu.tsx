import { 
  Box,
  List, 
  ListItem, 
  ListItemText, 
  ListItemButton, 
  Divider, 
  ListSubheader, 
  Slide, 
  Paper,
  useMediaQuery,
  Tooltip,
  Typography
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { 
  selectSchool, 
  selectDistrict,
  selectCurrentPageId,
  getPageType,
  PageType
} from '@/store/store';
import { useNavigate, useLocation } from 'react-router-dom';

interface MainMenuProps {
  open: boolean;
  onClose: () => void;
  anchorEl: React.RefObject<HTMLButtonElement>;
  hasSecondaryNav?: boolean;
}

/**
 * Main navigation menu that slides down from the hamburger button
 */
const MainMenu: React.FC<MainMenuProps> = ({ open, onClose, anchorEl, hasSecondaryNav = false }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const isXlOrLess = useMediaQuery(theme.breakpoints.down('xl'));
  const [menuPosition, setMenuPosition] = useState({ left: 0 });
  const drawerWidth = 300;
  
  // Get school and district data from Redux store
  const school = useSelector(selectSchool);
  const district = useSelector(selectDistrict);
  
  // Get current page type
  const currentPageId = useSelector(selectCurrentPageId);
  const pageType = getPageType(currentPageId);
  
  // Determine if we're on a page that needs secondary nav
  const isHomePage = location.pathname === '/' || location.pathname === '/home';
  const isGeneralPage = ['/privacy', '/terms', '/districts', '/contact', '/faq', '/about', '/datasources'].includes(location.pathname);
  const needsSecondaryNav = !isSmallScreen && !isHomePage && !isGeneralPage;
  
  // Calculate the top position based on whether secondary nav is present
  const secondaryNavHeight = 48; // Height of the secondary nav in pixels
  const appBarHeight = 56; // Fixed app bar height
  const topPosition = needsSecondaryNav ? appBarHeight + secondaryNavHeight : appBarHeight;
  
  // Update menu position when anchor element changes or window resizes
  useEffect(() => {
    const updateMenuPosition = () => {
      if (anchorEl.current) {
        const rect = anchorEl.current.getBoundingClientRect();
        
        // If XL or less, position flush with left edge
        // On small screens, always position at left: 0
        // For larger screens, subtract 16px from rect.left to align better with the hamburger icon
        const leftPosition = isXlOrLess ? 0 : Math.max(0, rect.left - 12);
                             
        setMenuPosition({ left: leftPosition });
      }
    };

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    
    return () => {
      window.removeEventListener('resize', updateMenuPosition);
    };
  }, [anchorEl, isXlOrLess, open]);

  const handleNavigate = (path: string, enabled: boolean = true) => {
    if (enabled) {
      navigate(path);
      onClose();
    }
  };

  return (
    <>
      {/* Slide-down Menu */}
      <Box 
        sx={{ 
          position: 'fixed',
          top: topPosition,
          left: 0,
          right: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none', // Let clicks pass through the Box but not its children
          zIndex: theme.zIndex.appBar - 1
        }}
      >
        <Slide
          direction="down"
          in={open}
          mountOnEnter
          unmountOnExit
          container={document.body}
        >
          <Paper
            elevation={4}
            sx={{
              position: 'absolute',
              top: 0,
              left: `${menuPosition.left}px`, // Use position from state
              width: isSmallScreen ? '80vw' : drawerWidth,
              maxWidth: '90vw',
              height: `calc(100vh - ${topPosition}px)`,
              maxHeight: 'none',
              overflow: 'auto',
              borderRadius: isXlOrLess ? '0 4px 4px 0' : '0 0 4px 4px', // Only round right corners when flush left
              pointerEvents: 'auto', // Enable clicks on the Paper
              [theme.breakpoints.down('sm')]: {
                height: `calc(100vh - ${topPosition}px)`,
              },
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu Content */}
            <List sx={{ p: 0 }}>
              {/* School Pages (show only on school pages) */}
              {school.id && school.availablePages.length > 0 && pageType === PageType.SCHOOL && (
                <>
                  <ListItem disablePadding sx={{ pt: 1.5 }}>
                    <ListItemButton 
                      onClick={() => handleNavigate(`/school/${school.id}`)}
                      sx={{ py: 0.5 }}
                    >
                      <Typography variant="subtitle1">
                        {school.name}
                      </Typography>
                    </ListItemButton>
                  </ListItem>
                  {school.availablePages.map((page) => (
                    <ListItem key={page.path} disablePadding>
                      {page.tooltip && !page.enabled ? (
                        <Tooltip title={page.tooltip} arrow>
                          <ListItemButton 
                            onClick={() => handleNavigate(page.path, page.enabled)}
                            disabled={!page.enabled}
                            sx={{
                              opacity: page.enabled ? 1 : 0.6,
                              cursor: page.enabled ? 'pointer' : 'not-allowed',
                              pl: 4, // Add indentation
                              py: 0.5, // Reduce vertical spacing
                            }}
                          >
                            <ListItemText 
                              primary={page.name} 
                              primaryTypographyProps={{ 
                                variant: 'body2',
                                color: 'text.secondary'
                              }}
                            />
                          </ListItemButton>
                        </Tooltip>
                      ) : (
                        <ListItemButton 
                          onClick={() => handleNavigate(page.path, page.enabled)}
                          disabled={!page.enabled}
                          sx={{
                            opacity: page.enabled ? 1 : 0.6,
                            cursor: page.enabled ? 'pointer' : 'not-allowed',
                            pl: 4, // Add indentation
                            py: 0.5, // Reduce vertical spacing
                          }}
                        >
                          <ListItemText 
                            primary={page.name} 
                            primaryTypographyProps={{ 
                              variant: 'body2',
                              color: 'text.secondary'
                            }}
                          />
                        </ListItemButton>
                      )}
                    </ListItem>
                  ))}
                  <Divider sx={{ my: 1 }} />
                </>
              )}
              
              {/* District Pages (show on district pages or when on school pages) */}
              {district.id && district.availablePages.length > 0 && (pageType === PageType.DISTRICT || pageType === PageType.SCHOOL) && (
                <>
                  <ListItem disablePadding sx={{ pt: school.id ? 0 : 1.5 }}>
                    <ListItemButton 
                      onClick={() => handleNavigate(`/district/${district.id}`)}
                      sx={{ py: 0.5 }}
                    >
                      <Typography variant="subtitle1">
                        {district.name}
                      </Typography>
                    </ListItemButton>
                  </ListItem>
                  {district.availablePages.map((page) => (
                    <ListItem key={page.path} disablePadding>
                      {page.tooltip && !page.enabled ? (
                        <Tooltip title={page.tooltip} arrow>
                          <ListItemButton 
                            onClick={() => handleNavigate(page.path, page.enabled)}
                            disabled={!page.enabled}
                            sx={{
                              opacity: page.enabled ? 1 : 0.6,
                              cursor: page.enabled ? 'pointer' : 'not-allowed',
                              pl: 4, // Add indentation
                              py: 0.5, // Reduce vertical spacing
                            }}
                          >
                            <ListItemText 
                              primary={page.name} 
                              primaryTypographyProps={{ 
                                variant: 'body2',
                                color: 'text.secondary'
                              }}
                            />
                          </ListItemButton>
                        </Tooltip>
                      ) : (
                        <ListItemButton 
                          onClick={() => handleNavigate(page.path, page.enabled)}
                          disabled={!page.enabled}
                          sx={{
                            opacity: page.enabled ? 1 : 0.6,
                            cursor: page.enabled ? 'pointer' : 'not-allowed',
                            pl: 4, // Add indentation
                            py: 0.5, // Reduce vertical spacing
                          }}
                        >
                          <ListItemText 
                            primary={page.name} 
                            primaryTypographyProps={{ 
                              variant: 'body2',
                              color: 'text.secondary'
                            }}
                          />
                        </ListItemButton>
                      )}
                    </ListItem>
                  ))}
                  <Divider sx={{ my: 1 }} />
                </>
              )}
              
              {/* State Overview Section */}
              <ListItem disablePadding sx={{ pt: (!school.id && !district.id) ? 1.5 : 0 }}>
                <ListItemButton 
                  onClick={() => handleNavigate('/')}
                  sx={{ py: 0.5 }}
                >
                  <ListItemText primary="Home" />
                </ListItemButton>
              </ListItem>
              
              <ListItem disablePadding>
                <ListItemButton 
                  disabled={true}
                  sx={{ 
                    py: 0.5,
                    opacity: 0.6,
                    cursor: 'not-allowed'
                  }}
                >
                  <ListItemText primary="State Overview" />
                </ListItemButton>
              </ListItem>
              
              <Divider sx={{ my: 1 }} />
              
              {/* Footer Links */}
              <ListItem disablePadding>
                <ListItemButton 
                  onClick={() => handleNavigate('/about')}
                  sx={{ py: 0.5 }}
                >
                  <ListItemText primary="About Us" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton 
                  onClick={() => handleNavigate('/districts')}
                  sx={{ py: 0.5 }}
                >
                  <ListItemText primary="Available Districts and Schools" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton 
                  onClick={() => handleNavigate('/datasources')}
                  sx={{ py: 0.5 }}
                >
                  <ListItemText primary="Data Sources" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton 
                  onClick={() => {
                    window.open('https://api.nhfacts.com/docs#/', '_blank', 'noopener,noreferrer');
                    onClose();
                  }}
                  sx={{ py: 0.5 }}
                >
                  <ListItemText primary="API Documentation" />
                </ListItemButton>
              </ListItem>
            </List>
          </Paper>
        </Slide>
      </Box>
      
      {/* Backdrop for menu */}
      {open && (
        <Box
          onClick={onClose}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100vh',
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            zIndex: theme.zIndex.appBar - 2,
          }}
        />
      )}
    </>
  );
};

export default MainMenu; 