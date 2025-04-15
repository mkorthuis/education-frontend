import React from 'react';
import { Box, Typography } from '@mui/material';
import DefaultSafetyCard from './DefaultSafetyCard';
import { FISCAL_YEAR } from '@/utils/environment';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectSchoolSafetyData, selectSelectedSafetyPage, setSelectedSafetyPage } from '@/store/slices/safetySlice';
import { selectCurrentSchool } from '@/store/slices/locationSlice';
import { EARLIEST_YEAR } from '@/utils/safetyCalculations';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';

const SeriousSafetyCard: React.FC = () => {
    const dispatch = useAppDispatch();
    const selectedSafetyPage = useAppSelector(selectSelectedSafetyPage);
    const isSelected = selectedSafetyPage === 'serious';
    
    const school = useAppSelector(selectCurrentSchool);
    const schoolParams = { school_id: school?.id || 0 };
    
    const schoolSafetyData = useAppSelector(state => selectSchoolSafetyData(state, schoolParams));

    // Find the earliest year and calculate the total count
    const earliestYear = schoolSafetyData.length > 0 
        ? Math.min(...schoolSafetyData.map(item => item.year))
        : null;
    
    const totalCount = schoolSafetyData.reduce((sum, item) => sum + item.count, 0);

    const handleClick = () => {
        dispatch(setSelectedSafetyPage('serious'));
    };

    return (
        <DefaultSafetyCard
            onClick={handleClick}
            isSelected={isSelected}
            title="Serious Safety Events"
            shortTitle="Serious"
        >
            <Box sx={{ my: 1 }}>
                <Typography variant="body2">
                    {totalCount > 0 ? totalCount + ` Serious Safety Events Since ` + earliestYear : `No Serious Safety Events Since ` + formatFiscalYear(EARLIEST_YEAR)}
                </Typography>
            </Box>
        </DefaultSafetyCard>
    );
};

export default SeriousSafetyCard; 