import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentSchool } from '@/store/slices/locationSlice';
import { selectSchoolSafetyData } from '@/store/slices/safetySlice';
import { EARLIEST_YEAR } from '@/utils/safetyCalculations';
import DefaultCategoryDetails from './DefaultCategoryDetails';
import SchoolSafetyIncidentsTableWrapper from './subCategory/SchoolSafetyIncidentsTable';

// Types
interface SafetyType {
    name: string;
}

interface SafetyIncident {
    id: number;
    year: number;
    school_id: number;
    count: number;
    safety_type: SafetyType;
}

const SeriousSafetyCategoryDetails: React.FC = () => {
    const school = useAppSelector(selectCurrentSchool);
    const schoolSeriousSafetyData = useAppSelector(state =>
        selectSchoolSafetyData(state, { school_id: school?.id })
    ) as SafetyIncident[] | undefined;

    const hasIncidents = schoolSeriousSafetyData && schoolSeriousSafetyData.length > 0;

    return (
        <DefaultCategoryDetails title="Serious Safety Events Overview">
            <Box sx={{ pb: 4 }}>
                {hasIncidents ? (
                    <>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            Below are the serious safety incidents reported for {school?.name} since {EARLIEST_YEAR}.
                        </Typography>
                        <Typography variant="body1">
                            These are <strong>rare</strong> events with an average of only 63 incidents per year across <strong>all</strong> NH schools.
                        </Typography>
                    </>
                ) : (
                    <Typography variant="body1">
                        There have been no serious safety incidents reported for {school?.name} since {EARLIEST_YEAR}.
                    </Typography>
                )}

                {hasIncidents && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', mt: 3 }}>
                        <SchoolSafetyIncidentsTableWrapper
                            schoolName={school?.name || 'This school'}
                            incidents={schoolSeriousSafetyData}
                        />
                    </Box>
                )}
            </Box>
        </DefaultCategoryDetails>
    );
};

export default SeriousSafetyCategoryDetails; 