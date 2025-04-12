import React from 'react';
import { Box, Divider, Typography } from '@mui/material';
import DefaultSafetyCard from './DefaultSafetyCard';
import { FISCAL_YEAR } from '@/utils/environment';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectDistrictBullyingData, selectStateBullyingData, selectSelectedSafetyPage, setSelectedSafetyPage } from '@/store/slices/safetySlice';
import { selectCurrentDistrict } from '@/store/slices/locationSlice';

const BullyCard: React.FC = () => {
    const dispatch = useAppDispatch();

    const district = useAppSelector(selectCurrentDistrict);
    const districtBullyingData = useAppSelector(state => selectDistrictBullyingData(state, {district_id: district?.id}));
    const stateBullyingData = useAppSelector(state => selectStateBullyingData(state, {}));

    const selectedSafetyPage = useAppSelector(selectSelectedSafetyPage);
    const isSelected = selectedSafetyPage === 'bullying';
    
    // Filter data for 2024 and calculate sums
    const filtered2024Data = districtBullyingData.filter(item => item.year === 2024);
    const actualSum = filtered2024Data.reduce((sum, item) => sum + (item.investigated_actual || 0), 0);
    const reportedSum = filtered2024Data.reduce((sum, item) => sum + (item.reported || 0), 0);
 

    const handleClick = () => {
        dispatch(setSelectedSafetyPage('bullying'));
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
                    {actualSum} Bullying Incidents In {FISCAL_YEAR}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    ({reportedSum} Reported)
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