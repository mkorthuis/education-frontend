import { Box, Container, IconButton, Toolbar, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useLocation, Link } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/Menu';
import { useRef, useState } from 'react';
import MainMenu from '../Navigation/MainMenu';
import SecondaryNav from './SecondaryNav';
import { isGeneralPath, isHomePath } from '@/routes/pageRegistry';
import PlaceSearch from '@/features/search/PlaceSearch';

/**
 * Main application bar with navigation and search functionality. The search is the home page's,
 * finding districts and schools and opening their pages; the home page has its own, so the bar
 * leaves it out there.
 */
const AppBar: React.FC = () => {
  const theme = useTheme();
  const isMediumOrLarger = useMediaQuery(theme.breakpoints.up('md'));
  const location = useLocation();
  
  const [mainMenuOpen, setMainMenuOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const isHomePage = isHomePath(location.pathname);
  
  // Check if the current page is a general page like privacy or terms
  const isGeneralPage = isGeneralPath(location.pathname);

  const toggleMobileSearch = () => {
    setShowMobileSearch(!showMobileSearch);
  };

  const toggleMainMenu = () => {
    setMainMenuOpen(!mainMenuOpen);
  };
  
  // Check if SecondaryNav should be displayed (only on medium screens and up, and not on general pages)
  const showSecondaryNav = isMediumOrLarger && !isHomePage && !isGeneralPage;

  return (
    <>
      {/* Outer AppBar container with full width but transparent background. mui-fixed: while a
          menu or dialog locks the page's scrolling, MUI pads it by the scrollbar's width, so the
          bar doesn't shift sideways when the scrollbar disappears */}
      <Box className="mui-fixed" sx={{ 
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
            <Link to="/" style={{ textDecoration: 'none' }}>
              <Typography
                variant="h5"
                noWrap
                sx={{ flexGrow: isMediumOrLarger ? 0 : 1, color: 'white', fontWeight: 'bold' }}
              >
                NH Education Facts
              </Typography>
            </Link>
            <Box sx={{ flexGrow: 1 }} />
            
            {/* Desktop Search (medium+ screens) */}
            {!isHomePage && isMediumOrLarger && (
              <Box sx={{ width: 320 }}>
                <PlaceSearch id="header-place-search" compact />
              </Box>
            )}
            
            {/* Mobile Search Icon: opens the search bar under the app bar */}
            {!isHomePage && !isMediumOrLarger && (
              <IconButton
                color="inherit"
                aria-label={showMobileSearch ? 'Close search' : 'Search for a district or school'}
                aria-expanded={showMobileSearch}
                aria-controls="mobile-search-bar"
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
      
      {/* Mobile Search Bar: ready to type when it opens, and closed once a place is picked */}
      {!isHomePage && !isMediumOrLarger && showMobileSearch && (
        <Box id="mobile-search-bar" className="mui-fixed" sx={{ 
          width: '100%', 
          padding: '8px 16px', 
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          position: 'fixed',
          top: '56px',
          zIndex: theme.zIndex.appBar - 1,
        }}>
          <PlaceSearch id="mobile-place-search" compact autoFocus onSelect={() => setShowMobileSearch(false)} />
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