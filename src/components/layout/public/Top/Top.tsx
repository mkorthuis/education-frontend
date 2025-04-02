import { AppBar, Toolbar, Typography, Container, useMediaQuery, IconButton, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MobileMenu from './MobileMenu';
import { useLocation, matchPath, useNavigate } from 'react-router-dom';
import { PATHS } from '@/routes/paths';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useEffect, useRef } from 'react';

export default function Top() {
  const theme = useTheme();
  const isMediumOrLarger = useMediaQuery(theme.breakpoints.up('md'));
  const isLargeOrLarger = useMediaQuery(theme.breakpoints.up('lg'));
  const location = useLocation();
  const navigate = useNavigate();
  const prevPathsRef = useRef<string[]>([]);

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

  // Find the current path title
  let currentTitle = 'NH Education Facts'; // Default title
  let showBackButton = location.pathname !== '/'; // Show back button if not on home page
  
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

  return (
    <AppBar position="static">
        <Container maxWidth={false} sx={{ px: { xs: '2', md: '50px' } }}>
        <Toolbar disableGutters>
          {showBackButton && (
            <IconButton
              color="inherit"
              aria-label="back"
              onClick={handleBackClick}
              edge="start"
              sx={{ m: '0px', paddingLeft: '0px' }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography
            variant={isMediumOrLarger ? "h4" : "h5"}
            noWrap
          >
            {currentTitle}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <MobileMenu />
        </Toolbar>
      </Container>
    </AppBar>
  );
}
