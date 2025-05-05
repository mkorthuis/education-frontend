import { Box, Container, Toolbar, useTheme, useMediaQuery } from "@mui/material";
import { Outlet, useLocation } from "react-router-dom";
import Footer from "./Footer/index";

interface MainLayoutProps {
  children?: React.ReactNode;
}

/**
 * Main content layout that includes page content and footer
 */
const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const location = useLocation();
  const isMediumOrLarger = useMediaQuery(theme.breakpoints.up('md'));
  
  // Determine if we're on a page that needs secondary nav
  const isHomePage = location.pathname === '/' || location.pathname === '/home';
  const isGeneralPage = ['/privacy', '/terms', '/districts'].includes(location.pathname);
  const needsSecondaryNav = isMediumOrLarger && !isHomePage && !isGeneralPage;
  
  // Calculate padding based on whether secondary nav is needed
  const topPadding = needsSecondaryNav ? 104 : 56; // 56px AppBar + 48px SecondaryNav if needed
  
  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        width: '100%',
      }}
    >
      {/* Spacing for fixed AppBar */}
      <Box sx={{ height: 56 }} />
      
      {/* Extra spacing for SecondaryNav on desktop (only if needed) */}
      {needsSecondaryNav && <Box sx={{ height: 48 }} />}
      
      {/* Page Content */}
      <Container 
        maxWidth="xl"
        sx={{ 
          minHeight: `calc(100vh - ${topPadding}px - 100px)`,
          px: { xs: 2, md: 3 },
          py: 3,
        }}
      >
        {children || <Outlet />}
      </Container>
      
      {/* Footer */}
      <Container maxWidth="xl" disableGutters>
        <Footer />
      </Container>
    </Box>
  );
};

export default MainLayout; 