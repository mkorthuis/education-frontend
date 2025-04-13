import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import React from 'react';

interface DefaultCategoryDetailsProps {
    title?: string;
    children?: React.ReactNode;
}

const DefaultCategoryDetails: React.FC<DefaultCategoryDetailsProps> = ({
    children,
    title = "",
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
    return (
        <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            width: '100%',
            '& > *': {
                width: isMobile ? '100%' : 'auto',
                maxWidth: '100%'
            }
        }}>
            <Typography variant="h5" sx={{mb: 3}}>
                {title}
            </Typography>
            {children}
        </Box>
    )
};

export default DefaultCategoryDetails;