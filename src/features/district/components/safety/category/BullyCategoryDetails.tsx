import React from 'react';
import { Box, useTheme, useMediaQuery, Divider } from '@mui/material';
import DefaultCategoryDetails from './DefaultCategoryDetails';
import BullyTrendChart from './subCategory/BullyTrendChart';
import BullyClassificationTable from './subCategory/BullyClassificationTable';
import BullyImpactTable from './subCategory/BullyImpactTable';

const BullyCategoryDetails: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));

    return (
        <DefaultCategoryDetails title="Bullying Overview">            
            <Box 
                sx={{ 
                    display: 'flex', 
                    flexDirection: isLargeScreen ? 'row' : 'column',
                    gap: 2,
                    width: '100%'
                }}
            >
                <Box sx={{ 
                    flex: isLargeScreen ? 1 : 'auto',
                    width: isMobile ? '100%' : 'auto'
                }}>
                    <BullyClassificationTable />
                    {isMobile && <Divider sx={{ mt: 3 }} />}
                </Box>
                <Box sx={{ 
                    flex: isLargeScreen ? 1 : 'auto',
                    width: isMobile ? '100%' : 'auto'
                }}>
                    <BullyImpactTable />
                </Box>
            </Box>
            
            {isMobile && <Divider sx={{ mt: 3 }} />}
            
            <Box sx={{ width: '100%' }}>
                <BullyTrendChart />
            </Box>
        </DefaultCategoryDetails>
    )
}

export default BullyCategoryDetails;