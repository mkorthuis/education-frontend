import React from 'react';
import { Box, Divider, Typography } from '@mui/material';
import DefaultSafetyCard from './DefaultSafetyCard';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSelectedSafetyCategory, selectSelectedSafetyCategory } from '@/store/slices/safetySlice';

const SuspensionCard: React.FC = () => {
    const dispatch = useAppDispatch();
    const selectedSafetyCategory = useAppSelector(selectSelectedSafetyCategory);
    const isSelected = selectedSafetyCategory === 'suspension';
    
    const handleClick = () => {
        dispatch(setSelectedSafetyCategory('suspension'));
    };

    return (
        <DefaultSafetyCard
            onClick={handleClick}
            isSelected={isSelected}
            title="Suspension and Expulsions"
            shortTitle="Suspend"
        >
            <Box sx={{ my: 1 }}>
                <Typography variant="body2" fontWeight="bold">
                    X Suspensions Last Year
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    (Y Out-of-School Suspensions )
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

export default SuspensionCard; 