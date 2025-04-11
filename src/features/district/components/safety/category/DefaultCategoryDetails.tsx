import { Box, Typography } from '@mui/material';
import React from 'react';

interface DefaultCategoryDetailsProps {
    title?: string;
    children?: React.ReactNode;
}

const DefaultCategoryDetails: React.FC<DefaultCategoryDetailsProps> = ({
    children,
    title = "",
}) => {
  
    return (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h5" sx={{mb: 3}}>
                {title}
            </Typography>
            {children}
        </Box>
    )
};

export default DefaultCategoryDetails;