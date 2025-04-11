import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import DefaultCategoryDetails from './DefaultCategoryDetails';

const BullyCategoryDetails: React.FC = () => {
    return (
        <DefaultCategoryDetails title="Bullying Overview">            
            <Typography variant="body1">
                This section provides detailed information about bullying incidents in the district.
                Data includes incident counts, student impact, and comparison with state averages.
            </Typography>
        </DefaultCategoryDetails>
    )
}

export default BullyCategoryDetails;