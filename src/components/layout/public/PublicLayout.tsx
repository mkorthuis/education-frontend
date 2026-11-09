import { Box } from "@mui/material";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import usePageTracking from "@/hooks/usePageTracking";
import AppBar from "./AppBar";
import MainLayout from "./MainLayout";
import ScrollToTop from "@/components/ScrollToTop";
import { useAppDispatch } from "@/store/hooks";
import { updateCurrentPage } from "@/store/store";
import { extractIdsFromUrl } from "@/routes/pageRegistry";
import { setCurrentDistrictId, setCurrentSchoolId } from "@/store/slices/locationSlice";

/**
 * Public layout component that serves as the main container for public pages
 */
const PublicLayout = () => {
  // Track page views
  usePageTracking();
  
  const location = useLocation();
  const dispatch = useAppDispatch();

  // Update current page and extract IDs whenever location changes
  useEffect(() => {
    // Update current page in store
    dispatch(updateCurrentPage(location.pathname));
    
    // Extract district and school IDs from URL
    const { districtId, schoolId } = extractIdsFromUrl(location.pathname);
    
    // Set district ID if present
    if (districtId !== undefined) {
      dispatch(setCurrentDistrictId(districtId));
    }
    
    // Set school ID if present
    if (schoolId !== undefined) {
      dispatch(setCurrentSchoolId(schoolId));
    }
  }, [location.pathname, dispatch]);

  return (
    <Box sx={{ display: 'flex' }}>
      {/* ScrollToTop component to handle scrolling on route changes */}
      <ScrollToTop />
      
      {/* Top AppBar, with the place search */}
      <AppBar />
      
      {/* Main Content */}
      <MainLayout />
    </Box>
  );
};

export default PublicLayout;
