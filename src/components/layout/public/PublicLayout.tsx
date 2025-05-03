import { Outlet } from "react-router-dom";
import { Box, useTheme, Card, Container, useMediaQuery } from "@mui/material";
import Top from "./Top/Top";
import Footer from "./Footer/Footer";
import usePageTracking from "@/hooks/usePageTracking";

const PrivateLayout = () => {
  // Track page views
  usePageTracking();
  
  const theme = useTheme();
  const isMediumOrLarger = useMediaQuery(theme.breakpoints.up('md'));

  const content = (
    <Container maxWidth="xl" sx={{ p : 0 }}>
        <Top />
        <Box component="main" sx={{ flexGrow: 1, px: { xs: 2, md: 3 }, minHeight: '70vh' }}>
          <Outlet />
        </Box>
        <Footer />
    </Container>
  );

  if (!isMediumOrLarger) return content;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        overflowY: 'auto',
      }}
    >
      {content}
    </Box>
  );
};

export default PrivateLayout;
