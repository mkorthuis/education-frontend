import React from 'react';
import { Box, Typography } from '@mui/material';
import DefaultCategoryDetails from './DefaultCategoryDetails';

const SuspensionCategoryDetails: React.FC = () => {
    return (
        <DefaultCategoryDetails title="Suspension and Expulsion Overview">
            <Typography variant="body1">
                This section provides detailed information about suspensions and expulsions in the district.
                Data includes in-school vs. out-of-school suspensions, demographic breakdowns, and trends over time.
            </Typography>
        </DefaultCategoryDetails>
    );
};

export default SuspensionCategoryDetails; 