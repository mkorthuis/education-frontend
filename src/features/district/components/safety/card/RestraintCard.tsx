import React from 'react';
import { Box, Divider, Typography } from '@mui/material';
import DefaultSafetyCard from './DefaultSafetyCard';
import { FISCAL_YEAR } from '@/utils/environment';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectDistrictRestraintData, selectStateRestraintData, selectSelectedSafetyPage, setSelectedSafetyPage, selectStateEnrollmentData, selectDistrictEnrollmentData } from '@/store/slices/safetySlice';
import { selectCurrentDistrict } from '@/store/slices/locationSlice';
import { calculatePercentageDifference } from '@/features/district/utils/safetyDataProcessing';
import { calculatePer100Students } from '@/features/district/utils/safetyDataProcessing';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';

const RestraintCard: React.FC = () => {
    const dispatch = useAppDispatch();
    const selectedSafetyPage = useAppSelector(selectSelectedSafetyPage);
    const isSelected = selectedSafetyPage === 'restraint';
    
    const district = useAppSelector(selectCurrentDistrict);
    const districtRestraintData = useAppSelector(state => selectDistrictRestraintData(state, {district_id: district?.id}));
    const stateRestraintData = useAppSelector(state => selectStateRestraintData(state, {}));
    const districtEnrollmentData = useAppSelector(state => selectDistrictEnrollmentData(state, {district_id: district?.id}));
    const stateEnrollmentData = useAppSelector(state => selectStateEnrollmentData(state, {}));

    const filtered2024Data = districtRestraintData.filter(item => item.year === parseInt(FISCAL_YEAR)); // Should only be one item
    const districtGeneratedRestraints = filtered2024Data.reduce((sum, item) => sum + (item.generated || 0), 0);
    const districtClosedRestraints = filtered2024Data.reduce((sum, item) => sum + (item.closed_investigation || 0), 0);

    const districtEnrollment2024 = districtEnrollmentData.find(item => item.year === parseInt(FISCAL_YEAR))?.total_enrollment || 0;
    const stateEnrollment2024 = stateEnrollmentData.find(item => item.year === parseInt(FISCAL_YEAR))?.total_enrollment || 0;

    // Filter state bullying data for 2024
    const stateFiltered2024Data = stateRestraintData.filter(item => item.year === parseInt(FISCAL_YEAR)); // Should only be one item
    const stateGeneratedRestraints = stateFiltered2024Data.reduce((sum, item) => sum + (item.generated || 0), 0);

    const districtRestraintsPer100 = calculatePer100Students(districtGeneratedRestraints, districtEnrollment2024);
    const stateRestraintsPer100 = calculatePer100Students(stateGeneratedRestraints, stateEnrollment2024);
    const percentDifference = calculatePercentageDifference(districtRestraintsPer100, stateRestraintsPer100);



    const handleClick = () => {
        dispatch(setSelectedSafetyPage('restraint'));
    };

    return (
        <DefaultSafetyCard
            onClick={handleClick}
            isSelected={isSelected}
            title="Restraints and Seclusions"
            shortTitle="Restraint"
        >
            <Box sx={{ my: 1 }}>
                <Typography variant="body2" fontWeight="bold">
                    {districtGeneratedRestraints === 0 ? "No" : districtGeneratedRestraints} Restraint{districtGeneratedRestraints === 1 ? "" : "s"} in {formatFiscalYear(FISCAL_YEAR)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    ({districtClosedRestraints === districtGeneratedRestraints ? "All" : districtClosedRestraints} Investigated and Closed)
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

export default RestraintCard; 