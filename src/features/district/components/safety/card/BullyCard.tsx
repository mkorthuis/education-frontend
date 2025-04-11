import React from 'react';
import { Box, Divider, Typography } from '@mui/material';
import DefaultSafetyCard from './DefaultSafetyCard';
import { FISCAL_YEAR } from '@/utils/environment';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSelectedSafetyCategory, selectSelectedSafetyCategory } from '@/store/slices/safetySlice';

const BullyCard: React.FC = () => {
    const dispatch = useAppDispatch();
    const selectedSafetyCategory = useAppSelector(selectSelectedSafetyCategory);
    const isSelected = selectedSafetyCategory === 'bullying';
    
    const handleClick = () => {
        dispatch(setSelectedSafetyCategory('bullying'));
    };

    return (
        <DefaultSafetyCard
            onClick={handleClick}
            isSelected={isSelected}
            title="Bullying"
            shortTitle="Bully"
        >
            <Box sx={{ my: 1 }}>
                <Typography variant="body2" fontWeight="bold">
                    X Bullying Incidents In {FISCAL_YEAR}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    (Y Reported)
                </Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box>
                <Typography variant="body2">
                    Z% Higher than State Average
                </Typography>
            </Box>
        </DefaultSafetyCard>
    );
};

export default BullyCard; 