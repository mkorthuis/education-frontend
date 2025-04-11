import React from 'react';
import { Box, Divider, Typography } from '@mui/material';
import DefaultSafetyCard from './DefaultSafetyCard';
import { FISCAL_YEAR } from '@/utils/environment';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSelectedSafetyCategory, selectSelectedSafetyCategory } from '@/store/slices/safetySlice';

const HarassmentCard: React.FC = () => {
    const dispatch = useAppDispatch();
    const selectedSafetyCategory = useAppSelector(selectSelectedSafetyCategory);
    const isSelected = selectedSafetyCategory === 'harassment';

    const handleClick = () => {
        dispatch(setSelectedSafetyCategory('harassment'));
    };

    return (
        <DefaultSafetyCard
            onClick={handleClick}
            isSelected={isSelected}
            title="Harassment"
            shortTitle="Harass"
        >
            <Box sx={{ my: 1  }}>
                <Typography variant="body2" fontWeight="bold">
                    X Harassment Incidents In {FISCAL_YEAR}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    (Impacting Y Students)
                </Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box>
                <Typography variant="body2">
                    Z% Higher Than State Average
                </Typography>
            </Box>
        </DefaultSafetyCard>
    );
};

export default HarassmentCard; 