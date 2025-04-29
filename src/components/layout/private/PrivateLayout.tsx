import { Outlet } from "react-router-dom";
import { Box, useTheme, Card, Container, useMediaQuery } from "@mui/material";
import usePageTracking from "@/hooks/usePageTracking";

const PrivateLayout = () => {
  // Track page views
  usePageTracking();
  
  const theme = useTheme();
  const isMediumOrLarger = useMediaQuery(theme.breakpoints.up('md'));

  const content = (
    <Container maxWidth="xl" sx={{ py: isMediumOrLarger ? 2 : 0, px: isMediumOrLarger ? 2 : 0 }}>
      <Outlet />
    </Container>
  );

  return isMediumOrLarger ? content : content;
};

export default PrivateLayout;
