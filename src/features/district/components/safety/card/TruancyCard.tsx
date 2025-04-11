import React from 'react';
import { Box, Divider, Typography } from '@mui/material';
import DefaultSafetyCard from './DefaultSafetyCard';
import { FISCAL_YEAR } from '@/utils/environment';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSelectedSafetyCategory, selectSelectedSafetyCategory } from '@/store/slices/safetySlice';

const TruancyCard: React.FC = () => {
    const dispatch = useAppDispatch();
    const selectedSafetyCategory = useAppSelector(selectSelectedSafetyCategory);
    const isSelected = selectedSafetyCategory === 'truancy';
    
    const handleClick = () => {
        dispatch(setSelectedSafetyCategory('truancy'));
    };

    return (
        <DefaultSafetyCard
            onClick={handleClick}
            isSelected={isSelected}
            title="Truancies"   
            shortTitle="Truancy"
        >
            <Box sx={{ my: 1 }}>
                <Typography variant="body2" fontWeight="bold">
                    X Truant Students in {FISCAL_YEAR}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    (X% of School)
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

export default TruancyCard; 