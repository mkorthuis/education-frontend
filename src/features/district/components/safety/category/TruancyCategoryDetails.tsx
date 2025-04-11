import React from 'react';
import { Box, Typography } from '@mui/material';
import DefaultCategoryDetails from './DefaultCategoryDetails';

const TruancyCategoryDetails: React.FC = () => {
    return (
        <DefaultCategoryDetails title="Truancy Overview">
            <Typography variant="body1">
                This section provides detailed information about truancy rates in the district.
                Data includes chronically absent students, attendance trends, and comparison with state averages.
            </Typography>
        </DefaultCategoryDetails>
    );
};

export default TruancyCategoryDetails; 