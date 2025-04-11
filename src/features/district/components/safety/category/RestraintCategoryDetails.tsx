import React from 'react';
import { Box, Typography } from '@mui/material';
import DefaultCategoryDetails from './DefaultCategoryDetails';

const RestraintCategoryDetails: React.FC = () => {
    return (
        <DefaultCategoryDetails title="Restraint and Seclusion Details">
            <Typography variant="body1">
                This section provides detailed information about restraint and seclusion incidents in the district.
                Data includes incident counts, affected students, and comparison with state averages.
            </Typography>
        </DefaultCategoryDetails>
    );
};

export default RestraintCategoryDetails; 