import { Outlet, useLocation } from "react-router-dom";
import { Box, useTheme, Card, Container, useMediaQuery } from "@mui/material";
import usePageTracking from "@/hooks/usePageTracking";
import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { updateCurrentPage } from "@/store/store";
import ScrollToTop from "@/components/ScrollToTop";

const PrivateLayout = () => {
  // Track page views
  usePageTracking();
  
  const theme = useTheme();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const isMediumOrLarger = useMediaQuery(theme.breakpoints.up('md'));

  // Update current page whenever location changes
  useEffect(() => {
    dispatch(updateCurrentPage(location.pathname));
  }, [location.pathname, dispatch]);

  const content = (
    <Container maxWidth="xl" sx={{ py: isMediumOrLarger ? 2 : 0, px: isMediumOrLarger ? 2 : 0 }}>
      <Outlet />
    </Container>
  );

  return (
    <>
      <ScrollToTop />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {isMediumOrLarger ? content : content}
      </Box>
    </>
  );
};

export default PrivateLayout;
