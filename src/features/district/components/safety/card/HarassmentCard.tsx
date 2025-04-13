import React from 'react';
import { Box, Divider, Typography } from '@mui/material';
import DefaultSafetyCard from './DefaultSafetyCard';
import { FISCAL_YEAR } from '@/utils/environment';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectSelectedSafetyPage, setSelectedSafetyPage, selectDistrictHarassmentData, selectStateHarassmentData, selectDistrictEnrollmentData, selectStateEnrollmentData } from '@/store/slices/safetySlice';
import { selectCurrentDistrict } from '@/store/slices/locationSlice';
import { calculatePer100Students, calculatePercentageDifference } from '@/features/district/utils/safetyDataProcessing';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';

const HarassmentCard: React.FC = () => {
    const dispatch = useAppDispatch();
    const selectedSafetyPage = useAppSelector(selectSelectedSafetyPage);
    const isSelected = selectedSafetyPage === 'harassment';

    const district = useAppSelector(selectCurrentDistrict);
    const districtHarassmentData = useAppSelector(state => selectDistrictHarassmentData(state, {district_id: district?.id}));
    const stateHarassmentData = useAppSelector(state => selectStateHarassmentData(state, {}));
    const districtEnrollmentData = useAppSelector(state => selectDistrictEnrollmentData(state, {district_id: district?.id}));
    const stateEnrollmentData = useAppSelector(state => selectStateEnrollmentData(state, {}));

    const filtered2024Data = districtHarassmentData.filter(item => item.year === parseInt(FISCAL_YEAR));
    const districtIncidentSum = filtered2024Data.reduce((sum, item) => sum + (item.incident_count || 0), 0);
    const districtImpactedSum = filtered2024Data.reduce((sum, item) => sum + (item.student_impact_count || 0), 0);

    // Filter state bullying data for 2024
    const stateFiltered2024Data = stateHarassmentData.filter(item => item.year === parseInt(FISCAL_YEAR));
    const stateActualSum = stateFiltered2024Data.reduce((sum, item) => sum + (item.incident_count || 0), 0);
    
    // Find 2024 enrollment data
    const districtEnrollment2024 = districtEnrollmentData.find(item => item.year === parseInt(FISCAL_YEAR))?.total_enrollment || 0;
    const stateEnrollment2024 = stateEnrollmentData.find(item => item.year === parseInt(FISCAL_YEAR))?.total_enrollment || 0;

    const districtIncidentsPer100 = calculatePer100Students(districtIncidentSum, districtEnrollment2024);
    const stateIncidentsPer100 = calculatePer100Students(stateActualSum, stateEnrollment2024);
    const percentDifference = calculatePercentageDifference(districtIncidentsPer100, stateIncidentsPer100);


    const handleClick = () => {
        dispatch(setSelectedSafetyPage('harassment'));
    };

    return (
        <DefaultSafetyCard
            onClick={handleClick}
            isSelected={isSelected}
            title="Harassments"
            shortTitle="Harass"
        >
            <Box sx={{ my: 1  }}>
                <Typography variant="body2" fontWeight="bold">
                    {districtIncidentSum === 0 ? "No" : districtIncidentSum} Harassment Incident{districtIncidentSum === 1 ? "" : "s"} In {formatFiscalYear(FISCAL_YEAR)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    ({districtImpactedSum === 0 ? "No" : districtImpactedSum} Impacted Student{districtImpactedSum === 1 ? "" : "s"})
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

export default HarassmentCard; 