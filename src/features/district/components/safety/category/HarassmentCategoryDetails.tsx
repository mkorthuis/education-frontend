import React from 'react';
import {useTheme, useMediaQuery, Divider, Box } from '@mui/material';
import DefaultCategoryDetails from './DefaultCategoryDetails';
import HarassmentDetailsTable from './subCategory/HarassmentDetailsTable';
import HarassmentTrendChart from './subCategory/HarassmentTrendChart';

const HarassmentCategoryDetails: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isExtraLarge = useMediaQuery(theme.breakpoints.up('xl'));
    const isLarge = useMediaQuery(theme.breakpoints.up('lg'));

    // Determine width based on screen size
    const getWidth = () => {
      if (isExtraLarge) return '70%';
      if (isLarge) return '90%';
      return '100%';
    };

    return (
            <DefaultCategoryDetails title="Harassment Overview">
            <Box sx={{ 
                width: getWidth(),
                ml: 0
            }}>
                <HarassmentDetailsTable />
                <Divider sx={{ mt: 3, mb: 2 }} />
                <HarassmentTrendChart />
                </Box>
            </DefaultCategoryDetails>
    );
};

export default HarassmentCategoryDetails; 