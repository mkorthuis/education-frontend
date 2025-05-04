import { 
  Box,
  TextField, 
  InputAdornment, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemButton, 
  Divider, 
  ListSubheader, 
  Slide, 
  Paper,
  useMediaQuery,
  Tooltip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { 
  selectSchool, 
  selectDistrict,
  selectCurrentPageId,
  getPageType,
  PageType
} from '@/store/store';
import { useNavigate } from 'react-router-dom';

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
  
  // Calculate the top position based on whether secondary nav is present
  const secondaryNavHeight = 48; // Height of the secondary nav in pixels
  const appBarHeight = { xs: 56, sm: 64 };
  const topPosition = {
    xs: hasSecondaryNav ? appBarHeight.xs + secondaryNavHeight : appBarHeight.xs,
    sm: hasSecondaryNav ? appBarHeight.sm + secondaryNavHeight : appBarHeight.sm
  };
  
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
              height: `calc(100vh - ${topPosition.sm}px)`,
              maxHeight: 'none',
              overflow: 'auto',
              borderRadius: isXlOrLess ? '0 4px 4px 0' : '0 0 4px 4px', // Only round right corners when flush left
              pointerEvents: 'auto', // Enable clicks on the Paper
              [theme.breakpoints.down('sm')]: {
                height: `calc(100vh - ${topPosition.xs}px)`,
              },
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu Search Box */}
            <Box sx={{ 
              padding: 2,
              position: 'sticky',
              top: 0,
              backgroundColor: 'background.paper',
              zIndex: 1,
            }}>
              <TextField
                fullWidth
                placeholder="Search..."
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <Divider />

            {/* Menu Content */}
            <List sx={{ p: 0 }}>
              {/* School Pages (show only on school pages) */}
              {school.id && school.availablePages.length > 0 && pageType === PageType.SCHOOL && (
                <>
                  <ListSubheader>{school.name}</ListSubheader>
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
                            }}
                          >
                            <ListItemText primary={page.name} />
                          </ListItemButton>
                        </Tooltip>
                      ) : (
                        <ListItemButton 
                          onClick={() => handleNavigate(page.path, page.enabled)}
                          disabled={!page.enabled}
                          sx={{
                            opacity: page.enabled ? 1 : 0.6,
                            cursor: page.enabled ? 'pointer' : 'not-allowed',
                          }}
                        >
                          <ListItemText primary={page.name} />
                        </ListItemButton>
                      )}
                    </ListItem>
                  ))}
                  <Divider sx={{ my: 2 }} />
                </>
              )}
              
              {/* District Pages (show on district pages or when on school pages) */}
              {district.id && district.availablePages.length > 0 && (pageType === PageType.DISTRICT || pageType === PageType.SCHOOL) && (
                <>
                  <ListSubheader>{district.name}</ListSubheader>
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
                            }}
                          >
                            <ListItemText primary={page.name} />
                          </ListItemButton>
                        </Tooltip>
                      ) : (
                        <ListItemButton 
                          onClick={() => handleNavigate(page.path, page.enabled)}
                          disabled={!page.enabled}
                          sx={{
                            opacity: page.enabled ? 1 : 0.6,
                            cursor: page.enabled ? 'pointer' : 'not-allowed',
                          }}
                        >
                          <ListItemText primary={page.name} />
                        </ListItemButton>
                      )}
                    </ListItem>
                  ))}
                  <Divider sx={{ my: 2 }} />
                </>
              )}
              
              {/* State Overview Section */}
              <ListItem disablePadding>
                <ListItemButton>
                  <ListItemText primary="State Overview" />
                </ListItemButton>
              </ListItem>
              
              <Divider sx={{ my: 2 }} />
              
              {/* Footer Links */}
              <ListItem disablePadding>
                <ListItemButton>
                  <ListItemText primary="About Us" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton>
                  <ListItemText primary="Data Sources" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton>
                  <ListItemText primary="API Documentation" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton>
                  <ListItemText primary="Privacy Policy" />
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