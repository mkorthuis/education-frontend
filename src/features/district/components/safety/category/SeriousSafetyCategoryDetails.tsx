import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentDistrict, selectCurrentSchools } from '@/store/slices/locationSlice';
import { selectSchoolSafetyData } from '@/store/slices/safetySlice';
import { EARLIEST_YEAR } from '@/features/district/utils/safetyDataProcessing';
import DefaultCategoryDetails from './DefaultCategoryDetails';
import SchoolSafetyIncidentsTable from './subCategory/SchoolSafetyIncidentsTable';

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

interface School {
    id: number;
    name: string;
    [key: string]: any;
}

interface GroupedSafetyData {
    [schoolId: string]: SafetyIncident[];
}

const SeriousSafetyCategoryDetails: React.FC = () => {
    const district = useAppSelector(selectCurrentDistrict);
    const schools = useAppSelector(selectCurrentSchools);
    const schoolSeriousSafetyData = useAppSelector(state =>
        selectSchoolSafetyData(state, { district_id: district?.id })
    ) as SafetyIncident[] | undefined;

    // Create a map of school IDs to school objects for easy lookup
    const schoolMap = useMemo<Record<string, School>>(() => {
        return schools.reduce((map, school) => {
            map[school.id.toString()] = school;
            return map;
        }, {} as Record<string, School>);
    }, [schools]);

    // Group the safety data by school_id
    const groupedBySchool = useMemo<GroupedSafetyData>(() => {
        if (!schoolSeriousSafetyData?.length) return {};

        return schoolSeriousSafetyData.reduce<GroupedSafetyData>((acc, incident) => {
            const schoolId = String(incident.school_id);
            if (!acc[schoolId]) {
                acc[schoolId] = [];
            }
            acc[schoolId].push(incident);
            return acc;
        }, {});
    }, [schoolSeriousSafetyData]);

    const hasIncidents = schoolSeriousSafetyData && schoolSeriousSafetyData.length > 0;

    return (
        <DefaultCategoryDetails title="Serious Safety Events Overview">
            <Box sx={{ pb: 4 }}>
                {hasIncidents ? (
                    <>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            Below are the serious safety incidents reported for each school in the district since {EARLIEST_YEAR}.
                        </Typography>
                        <Typography variant="body1">
                            These are <strong>rare</strong> events with an average of only 63 incidents per year across <strong>all</strong> NH schools.
                        </Typography>
                    </>
                ) : (
                    <Typography variant="body1">
                        There have been no serious safety incidents reported in the district since {EARLIEST_YEAR}.
                    </Typography>
                )}

                {hasIncidents && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3}}>
                        {Object.entries(groupedBySchool).map(([schoolId, incidents]) => {
                            const school = schoolMap[schoolId];
                            const schoolName = school ? school.name : `School (ID: ${schoolId})`;

                            return (
                                <Box key={schoolId}>
                                    <SchoolSafetyIncidentsTable
                                        schoolName={schoolName}
                                        incidents={incidents}
                                    />
                                </Box>
                            );
                        })}
                    </Box>
                )}
            </Box>
        </DefaultCategoryDetails>
    );
};

export default SeriousSafetyCategoryDetails; 