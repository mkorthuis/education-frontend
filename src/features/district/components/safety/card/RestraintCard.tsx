import React from 'react';
import { Box, Divider, Typography } from '@mui/material';
import DefaultSafetyCard from './DefaultSafetyCard';
import { FISCAL_YEAR } from '@/utils/environment';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectSelectedSafetyPage, setSelectedSafetyPage } from '@/store/slices/safetySlice';

const RestraintCard: React.FC = () => {
    const dispatch = useAppDispatch();
    const selectedSafetyPage = useAppSelector(selectSelectedSafetyPage);
    const isSelected = selectedSafetyPage === 'restraint';
    
    const handleClick = () => {
        dispatch(setSelectedSafetyPage('restraint'));
    };

    return (
        <DefaultSafetyCard
            onClick={handleClick}
            isSelected={isSelected}
            title="Restraint and Seclusions"
            shortTitle="Restraint"
        >
            <Box sx={{ my: 1 }}>
                <Typography variant="body2" fontWeight="bold">
                    X Restraints in {FISCAL_YEAR}
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

export default RestraintCard; 