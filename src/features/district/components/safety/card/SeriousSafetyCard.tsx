import React from 'react';
import { Box, Typography } from '@mui/material';
import DefaultSafetyCard from './DefaultSafetyCard';
import { FISCAL_YEAR } from '@/utils/environment';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSelectedSafetyCategory, selectSelectedSafetyCategory } from '@/store/slices/safetySlice';

const SeriousSafetyCard: React.FC = () => {
    const dispatch = useAppDispatch();
    const selectedSafetyCategory = useAppSelector(selectSelectedSafetyCategory);
    const isSelected = selectedSafetyCategory === 'serious';
    
    const handleClick = () => {
        dispatch(setSelectedSafetyCategory('serious'));
    };

    return (
        <DefaultSafetyCard
            onClick={handleClick}
            isSelected={isSelected}
            title="Serious Safety Events"
            shortTitle="Serious"
        >
            <Box sx={{ my: 1 }}>
                <Typography variant="body2">
                    X Serious Safety Events since YYYY
                </Typography>
                
            </Box>
        </DefaultSafetyCard>
    );
};

export default SeriousSafetyCard; 