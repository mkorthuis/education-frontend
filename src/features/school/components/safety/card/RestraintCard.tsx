import React from 'react';
import { Box, Divider, Typography } from '@mui/material';
import DefaultSafetyCard from './DefaultSafetyCard';
import { FISCAL_YEAR } from '@/utils/environment';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectSchoolRestraintData, selectStateRestraintData, selectSelectedSafetyPage, setSelectedSafetyPage, selectSchoolEnrollmentData, selectStateEnrollmentData } from '@/store/slices/safetySlice';
import { selectCurrentSchool } from '@/store/slices/locationSlice';
import { calculatePercentageDifference, calculatePer100Students } from '@/utils/safetyCalculations';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import { useNavigate, useParams } from 'react-router-dom';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';

const RestraintCard: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    
    const selectedSafetyPage = useAppSelector(selectSelectedSafetyPage);
    const isSelected = selectedSafetyPage === 'restraint';
    
    const school = useAppSelector(selectCurrentSchool);
    const schoolParams = { school_id: school?.id || 0 };
    const stateParams = {};
    
    const schoolRestraintData = useAppSelector(state => selectSchoolRestraintData(state, schoolParams));
    const stateRestraintData = useAppSelector(state => selectStateRestraintData(state, stateParams));
    const schoolEnrollmentData = useAppSelector(state => selectSchoolEnrollmentData(state, schoolParams));
    const stateEnrollmentData = useAppSelector(state => selectStateEnrollmentData(state, stateParams));

    const filteredCurrentYearData = schoolRestraintData.filter(item => item.year === parseInt(FISCAL_YEAR)); // Should only be one item
    const schoolGeneratedRestraints = filteredCurrentYearData.reduce((sum, item) => sum + (item.generated || 0), 0);
    const schoolClosedRestraints = filteredCurrentYearData.reduce((sum, item) => sum + (item.closed_investigation || 0), 0);

    const schoolEnrollmentCurrentYear = schoolEnrollmentData.find(item => item.year === parseInt(FISCAL_YEAR))?.total_enrollment || 0;
    const stateEnrollmentCurrentYear = stateEnrollmentData.find(item => item.year === parseInt(FISCAL_YEAR))?.total_enrollment || 0;

    // Filter state restraint data for current fiscal year
    const stateFilteredCurrentYearData = stateRestraintData.filter(item => item.year === parseInt(FISCAL_YEAR)); // Should only be one item
    const stateGeneratedRestraints = stateFilteredCurrentYearData.reduce((sum, item) => sum + (item.generated || 0), 0);

    const schoolRestraintsPer100 = calculatePer100Students(schoolGeneratedRestraints, schoolEnrollmentCurrentYear);
    const stateRestraintsPer100 = calculatePer100Students(stateGeneratedRestraints, stateEnrollmentCurrentYear);
    const percentDifference = calculatePercentageDifference(schoolRestraintsPer100, stateRestraintsPer100);

    const handleClick = () => {
        const path = PAGE_REGISTRY.school.safety.urlPatterns[0].replace(':id', id || '').replace(':category?', 'restraint');
        navigate(path);
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
                    {schoolGeneratedRestraints === 0 ? "No" : schoolGeneratedRestraints} Restraint{schoolGeneratedRestraints === 1 ? "" : "s"} in {formatFiscalYear(FISCAL_YEAR)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    ({schoolClosedRestraints === schoolGeneratedRestraints ? "All" : schoolClosedRestraints} Investigated and Closed)
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