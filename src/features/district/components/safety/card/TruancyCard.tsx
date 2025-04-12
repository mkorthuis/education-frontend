import React from 'react';
import { Box, Divider, Typography } from '@mui/material';
import DefaultSafetyCard from './DefaultSafetyCard';
import { FISCAL_YEAR } from '@/utils/environment';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectSelectedSafetyPage, setSelectedSafetyPage } from '@/store/slices/safetySlice';

const TruancyCard: React.FC = () => {
    const dispatch = useAppDispatch();
    const selectedSafetyPage = useAppSelector(selectSelectedSafetyPage);
    const isSelected = selectedSafetyPage === 'truancy';
    
    const handleClick = () => {
        dispatch(setSelectedSafetyPage('truancy'));
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