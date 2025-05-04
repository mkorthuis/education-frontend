import { Box } from "@mui/material";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import usePageTracking from "@/hooks/usePageTracking";
import AppBar from "./AppBar";
import MainLayout from "./MainLayout";
import { locationApi } from "@/services/api/endpoints/locations";

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
  
  // State for districts search
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);

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
