import { Box } from "@mui/material";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import usePageTracking from "@/hooks/usePageTracking";
import AppBar from "./AppBar";
import MainLayout from "./MainLayout";
import { locationApi } from "@/services/api/endpoints/locations";
import { useAppDispatch } from "@/store/hooks";
import { updateCurrentPage } from "@/store/store";
import { extractIdsFromUrl } from "@/routes/pageRegistry";
import { setCurrentDistrictId, setCurrentSchoolId } from "@/store/slices/locationSlice";

// Define District interface
interface District {
  id: number;
  name: string;
  grades?: { id: number; name: string }[];
}

/**
 * Public layout component that serves as the main container for public pages
 */
const PublicLayout = () => {
  // Track page views
  usePageTracking();
  
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  
  // State for districts search
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);

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

  // Load districts when component mounts
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        setLoading(true);
        const districtsData = await locationApi.getDistricts();
        setDistricts(districtsData);
      } catch (error) {
        console.error('Failed to fetch districts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDistricts();
  }, []);

  const handleDistrictChange = (_event: React.SyntheticEvent, district: District | null) => {
    setSelectedDistrict(district);
    if (district?.id) {
      navigate(`/district/${district.id}`);
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Top AppBar */}
      <AppBar 
        districts={districts}
        loading={loading}
        selectedDistrict={selectedDistrict}
        onDistrictChange={handleDistrictChange}
      />
      
      {/* Main Content */}
      <MainLayout />
    </Box>
  );
};

export default PublicLayout;
