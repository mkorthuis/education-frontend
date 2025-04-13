import React from 'react';
import { Box, Divider, Typography } from '@mui/material';
import DefaultSafetyCard from './DefaultSafetyCard';
import { FISCAL_YEAR } from '@/utils/environment';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectDistrictBullyingData, selectStateBullyingData, selectSelectedSafetyPage, setSelectedSafetyPage, selectDistrictEnrollmentData, selectStateEnrollmentData } from '@/store/slices/safetySlice';
import { selectCurrentDistrict } from '@/store/slices/locationSlice';
import { calculatePer100Students, calculatePercentageDifference } from '@/features/district/utils/safetyDataProcessing';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';

const BullyCard: React.FC = () => {
    const dispatch = useAppDispatch();

    const selectedSafetyPage = useAppSelector(selectSelectedSafetyPage);
    const isSelected = selectedSafetyPage === 'bullying';

    const district = useAppSelector(selectCurrentDistrict);
    const districtBullyingData = useAppSelector(state => selectDistrictBullyingData(state, {district_id: district?.id}));
    const stateBullyingData = useAppSelector(state => selectStateBullyingData(state, {}));
    const districtEnrollmentData = useAppSelector(state => selectDistrictEnrollmentData(state, {district_id: district?.id}));
    const stateEnrollmentData = useAppSelector(state => selectStateEnrollmentData(state, {}));

    // Filter data for 2024 and calculate sums
    const filtered2024Data = districtBullyingData.filter(item => item.year === parseInt(FISCAL_YEAR));
    const actualSum = filtered2024Data.reduce((sum, item) => sum + (item.investigated_actual || 0), 0);
    const reportedSum = filtered2024Data.reduce((sum, item) => sum + (item.reported || 0), 0);

    // Filter state bullying data for 2024
    const stateFiltered2024Data = stateBullyingData.filter(item => item.year === parseInt(FISCAL_YEAR));
    const stateActualSum = stateFiltered2024Data.reduce((sum, item) => sum + (item.investigated_actual || 0), 0);
    
    // Find 2024 enrollment data
    const districtEnrollment2024 = districtEnrollmentData.find(item => item.year === parseInt(FISCAL_YEAR))?.total_enrollment || 0;
    const stateEnrollment2024 = stateEnrollmentData.find(item => item.year === parseInt(FISCAL_YEAR))?.total_enrollment || 0;
    
    
    // Use utility functions for calculations
    const districtIncidentsPer100 = calculatePer100Students(actualSum, districtEnrollment2024);
    const stateIncidentsPer100 = calculatePer100Students(stateActualSum, stateEnrollment2024);
    const percentDifference = calculatePercentageDifference(districtIncidentsPer100, stateIncidentsPer100);

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
                    {actualSum === 0 ? "No" : actualSum} Bullying Incident{actualSum === 1 ? "" : "s"} In {formatFiscalYear(FISCAL_YEAR)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    ({reportedSum === 0 ? "None" : reportedSum} Reported)
                </Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box>
                <Typography variant="body2">
                    {percentDifference === 0 ? "Same as" : percentDifference > 0 ? `${percentDifference}% Higher Than` : `${-percentDifference}% Lower Than`} State Average
                </Typography>
            </Box>
        </DefaultSafetyCard>
    );
};

export default BullyCard; 