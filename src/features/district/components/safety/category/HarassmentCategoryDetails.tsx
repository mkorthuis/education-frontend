import React from 'react';
import { Box, Typography } from '@mui/material';
import DefaultCategoryDetails from './DefaultCategoryDetails';

const HarassmentCategoryDetails: React.FC = () => {
    return (
        <DefaultCategoryDetails title="Harassment Overview">
            <Typography variant="body1">
                This section provides detailed information about harassment incidents in the district.
                Data includes incident counts, student impact, and comparison with state averages.
            </Typography>
        </DefaultCategoryDetails>
    );
};

export default HarassmentCategoryDetails; 