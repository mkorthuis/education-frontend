import React from 'react';
import { Box, Divider, Typography } from '@mui/material';
import DefaultSafetyCard from './DefaultSafetyCard';
import { FISCAL_YEAR } from '@/utils/environment';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectDistrictTruancyData,selectStateEnrollmentData,  selectDistrictEnrollmentData, selectStateTruancyData, selectSelectedSafetyPage, setSelectedSafetyPage } from '@/store/slices/safetySlice';
import { selectCurrentDistrict } from '@/store/slices/locationSlice';
import { calculatePer100Students, calculatePercentageDifference } from '@/features/district/utils/safetyDataProcessing';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';

const TruancyCard: React.FC = () => {
    const dispatch = useAppDispatch();
    const selectedSafetyPage = useAppSelector(selectSelectedSafetyPage);
    const isSelected = selectedSafetyPage === 'truancy';
    
    const district = useAppSelector(selectCurrentDistrict);
    const districtTruancyData = useAppSelector(state => selectDistrictTruancyData(state, {district_id: district?.id}));
    const stateTruancyData = useAppSelector(state => selectStateTruancyData(state, {}));
    const districtEnrollmentData = useAppSelector(state => selectDistrictEnrollmentData(state, {district_id: district?.id}));
    const stateEnrollmentData = useAppSelector(state => selectStateEnrollmentData(state, {}));
    
    const filtered2024Data = districtTruancyData.filter(item => item.year === parseInt(FISCAL_YEAR)); // should only be one item
    const districtTruantStudents = filtered2024Data.reduce((sum, item) => sum + (item.count || 0), 0);

    const stateFiltered2024Data = stateTruancyData.filter(item => item.year === parseInt(FISCAL_YEAR)); // Should only be one item
    const stateTruantStudents = stateFiltered2024Data.reduce((sum, item) => sum + (item.count || 0), 0);

    const districtEnrollment2024 = districtEnrollmentData.find(item => item.year === parseInt(FISCAL_YEAR))?.total_enrollment || 0;
    const stateEnrollment2024 = stateEnrollmentData.find(item => item.year === parseInt(FISCAL_YEAR))?.total_enrollment || 0;

    const districtTruantStudentsPer100 = calculatePer100Students(districtTruantStudents, districtEnrollment2024);
    const stateTruantStudentsPer100 = calculatePer100Students(stateTruantStudents, stateEnrollment2024);
    const percentDifference = calculatePercentageDifference(districtTruantStudentsPer100, stateTruantStudentsPer100);

    const percentageTruantStudents = Math.round((districtTruantStudents / districtEnrollment2024) * 100);
    
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
                    {districtTruantStudents} Truant Student{districtTruantStudents === 1 ? "" : "s"} in {formatFiscalYear(FISCAL_YEAR)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    ({percentageTruantStudents}% of Students)
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

export default TruancyCard; 