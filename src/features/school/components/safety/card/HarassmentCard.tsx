import React from 'react';
import { Box, Divider, Typography } from '@mui/material';
import DefaultSafetyCard from './DefaultSafetyCard';
import { FISCAL_YEAR } from '@/utils/environment';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectSelectedSafetyPage, setSelectedSafetyPage, selectSchoolHarassmentData, selectStateHarassmentData, selectSchoolEnrollmentData, selectStateEnrollmentData } from '@/store/slices/safetySlice';
import { selectCurrentSchool } from '@/store/slices/locationSlice';
import { calculatePer100Students, calculatePercentageDifference } from '@/utils/safetyCalculations';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import { useNavigate, useParams } from 'react-router-dom';
import { PATHS } from '@/routes/paths';

const HarassmentCard: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    
    const selectedSafetyPage = useAppSelector(selectSelectedSafetyPage);
    const isSelected = selectedSafetyPage === 'harassment';

    const school = useAppSelector(selectCurrentSchool);
    const schoolParams = { school_id: school?.id || 0 };
    const stateParams = {};
    
    const schoolHarassmentData = useAppSelector(state => selectSchoolHarassmentData(state, schoolParams));
    const stateHarassmentData = useAppSelector(state => selectStateHarassmentData(state, stateParams));
    const schoolEnrollmentData = useAppSelector(state => selectSchoolEnrollmentData(state, schoolParams));
    const stateEnrollmentData = useAppSelector(state => selectStateEnrollmentData(state, stateParams));

    const filteredCurrentYearData = schoolHarassmentData.filter(item => item.year === parseInt(FISCAL_YEAR));
    const schoolIncidentSum = filteredCurrentYearData.reduce((sum, item) => sum + (item.incident_count || 0), 0);
    const schoolImpactedSum = filteredCurrentYearData.reduce((sum, item) => sum + (item.student_impact_count || 0), 0);

    // Filter state harassment data for current fiscal year
    const stateFilteredCurrentYearData = stateHarassmentData.filter(item => item.year === parseInt(FISCAL_YEAR));
    const stateIncidentSum = stateFilteredCurrentYearData.reduce((sum, item) => sum + (item.incident_count || 0), 0);
    
    // Find current year enrollment data
    const schoolEnrollmentCurrentYear = schoolEnrollmentData.find(item => item.year === parseInt(FISCAL_YEAR))?.total_enrollment || 0;
    const stateEnrollmentCurrentYear = stateEnrollmentData.find(item => item.year === parseInt(FISCAL_YEAR))?.total_enrollment || 0;

    const schoolIncidentsPer100 = calculatePer100Students(schoolIncidentSum, schoolEnrollmentCurrentYear);
    const stateIncidentsPer100 = calculatePer100Students(stateIncidentSum, stateEnrollmentCurrentYear);
    const percentDifference = calculatePercentageDifference(schoolIncidentsPer100, stateIncidentsPer100);

    const handleClick = () => {
        const path = PATHS.PUBLIC.SCHOOL_SAFETY.path.replace(':id', id || '').replace(':category?', 'harassment');
        navigate(path);
        dispatch(setSelectedSafetyPage('harassment'));
    };

    return (
        <DefaultSafetyCard
            onClick={handleClick}
            isSelected={isSelected}
            title="Harassments"
            shortTitle="Harass"
        >
            <Box sx={{ my: 1 }}>
                <Typography variant="body2" fontWeight="bold">
                    {schoolIncidentSum === 0 ? "No" : schoolIncidentSum} Harassment Incident{schoolIncidentSum === 1 ? "" : "s"} In {formatFiscalYear(FISCAL_YEAR)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    ({schoolImpactedSum === 0 ? "No" : schoolImpactedSum} Impacted Student{schoolImpactedSum === 1 ? "" : "s"})
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