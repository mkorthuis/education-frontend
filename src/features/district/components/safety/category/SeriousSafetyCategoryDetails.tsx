import React from 'react';
import { Box, Typography } from '@mui/material';
import DefaultCategoryDetails from './DefaultCategoryDetails';

const SeriousSafetyCategoryDetails: React.FC = () => {
    return (
        <DefaultCategoryDetails title="Serious Safety Events Overview">
            <Typography variant="body1">
                This section provides detailed information about serious safety incidents in the district.
                It includes a breakdown of incidents by type and year, with contextual information for each event.
            </Typography>
        </DefaultCategoryDetails>
    );
};

export default SeriousSafetyCategoryDetails; 