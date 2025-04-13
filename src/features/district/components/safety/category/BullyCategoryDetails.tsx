import React, { useState } from 'react';
import { Box, useTheme, useMediaQuery, Divider } from '@mui/material';
import DefaultCategoryDetails from './DefaultCategoryDetails';
import BullyTrendChart from './subCategory/BullyTrendChart';
import BullyClassificationTable from './subCategory/BullyClassificationTable';
import BullyImpactTable from './subCategory/BullyImpactTable';
import { FISCAL_YEAR } from '@/utils/environment';

const BullyCategoryDetails: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
    
    // Get default fiscal year from environment and initialize shared state
    const defaultFiscalYear = parseInt(FISCAL_YEAR);
    const [selectedYear, setSelectedYear] = useState<string | number>(defaultFiscalYear);
    
    // Handler to update the selected year from either table
    const handleYearChange = (year: string | number) => {
        setSelectedYear(year);
    };

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
                    <BullyClassificationTable 
                        selectedYear={selectedYear} 
                        onYearChange={handleYearChange} 
                    />
                    {isMobile && <Divider sx={{ mt: 3 }} />}
                </Box>
                <Box sx={{ 
                    flex: isLargeScreen ? 1 : 'auto',
                    width: isMobile ? '100%' : 'auto'
                }}>
                    <BullyImpactTable 
                        selectedYear={selectedYear} 
                        onYearChange={handleYearChange} 
                    />
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