import React from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';


// Import card components
import ExpendituresCard from './card/ExpendituresCard';
import RevenueCard from './card/RevenueCard';
import CostPerPupilCard from './card/CostPerPupilCard';

interface OverallTabProps {
  districtId?: string;
}

const OverallTab: React.FC<OverallTabProps> = ({ 
  districtId
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  
  
  return (
    <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 3, mb: 4 }}>
      <ExpendituresCard />
      <RevenueCard />
      <CostPerPupilCard />
    </Box>
  );
};

export default OverallTab; 