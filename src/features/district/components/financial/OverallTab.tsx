import React from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';

// Import card components
import ExpendituresCard from './card/ExpendituresCard';
import RevenueCard from './card/RevenueCard';
import CostPerPupilCard from './card/CostPerPupilCard';

interface OverallTabProps {
  districtId?: string;
}

// Create a styled wrapper to apply consistent styling to all cards
const CardWrapper = styled(Box)({
  flex: 1,
  display: 'flex',
  '& > *': {
    width: '100%',
    height: '100%'
  }
});

const OverallTab: React.FC<OverallTabProps> = ({ 
  districtId
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isMedium = useMediaQuery(theme.breakpoints.down('md'));
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: isMobile || isMedium ? 'column' : 'row', 
      gap: 3, 
      mb: 4,
      height: isMobile || isMedium ? 'auto' : '100%'
    }}>
      <CardWrapper>
        <ExpendituresCard />
      </CardWrapper>
      <CardWrapper>
        <RevenueCard />
      </CardWrapper>
      <CardWrapper>
        <CostPerPupilCard />
      </CardWrapper>
    </Box>
  );
};

export default OverallTab; 