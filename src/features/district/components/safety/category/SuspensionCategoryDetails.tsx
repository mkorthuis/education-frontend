import React from 'react';
import { Box, Card, Divider, Typography, useMediaQuery, useTheme } from '@mui/material';
import DefaultCategoryDetails from './DefaultCategoryDetails';
import { selectCurrentDistrict } from '@/store/slices/locationSlice';
import { useAppSelector } from '@/store/hooks';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import { FISCAL_YEAR } from '@/utils/environment';
import { 
    selectStateDisciplineCountData, 
    selectDisciplineCountTypes, 
    selectDistrictEnrollmentData, 
    selectStateEnrollmentData,
    selectDistrictDisciplineCountData
} from '@/store/slices/safetySlice';
import { 
    IN_SCHOOL_SUSPENSION_TYPE, 
    OUT_OF_SCHOOL_SUSPENSION_TYPE, 
    calculatePer100Students 
} from '@/features/district/utils/safetyDataProcessing';
import SuspensionTrendChart from './subCategory/SuspensionTrendChart';
import DisciplineIncidentTable from './subCategory/DisciplineIncidentTable';

const SuspensionCategoryDetails: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isExtraLarge = useMediaQuery(theme.breakpoints.up('xl'));
    const isLarge = useMediaQuery(theme.breakpoints.up('md'));

    const district = useAppSelector(selectCurrentDistrict);
    const fiscalYear = parseInt(FISCAL_YEAR);
    const formattedFiscalYear = formatFiscalYear(FISCAL_YEAR);
    
    // Data selectors
    const districtDisciplineCountData = useAppSelector(state => 
        selectDistrictDisciplineCountData(state, {district_id: district?.id}));
    const stateDisciplineCountData = useAppSelector(state => 
        selectStateDisciplineCountData(state, {}));
    const disciplineCountTypes = useAppSelector(selectDisciplineCountTypes);
    const districtEnrollmentData = useAppSelector(state => 
        selectDistrictEnrollmentData(state, {district_id: district?.id}));
    const stateEnrollmentData = useAppSelector(state => 
        selectStateEnrollmentData(state, {}));

    // Filter current year data
    const currentDistrictDisciplineData = districtDisciplineCountData.filter(item => 
        item.year === fiscalYear);
    const currentStateDisciplineData = stateDisciplineCountData.filter(item => 
        item.year === fiscalYear);

    // Find discipline count types
    const inSchoolSuspensionType = disciplineCountTypes.find(type => 
        type.name.includes(IN_SCHOOL_SUSPENSION_TYPE));
    const outOfSchoolSuspensionType = disciplineCountTypes.find(type => 
        type.name.includes(OUT_OF_SCHOOL_SUSPENSION_TYPE));
    const expulsionType = disciplineCountTypes.find(type => 
        type.name.toLowerCase().includes('expulsion'));

    // Extract counts
    const inSchoolSuspensionsCount = currentDistrictDisciplineData.find(item => 
        item.count_type.id === inSchoolSuspensionType?.id)?.count || 0;
    const outOfSchoolSuspensionsCount = currentDistrictDisciplineData.find(item => 
        item.count_type.id === outOfSchoolSuspensionType?.id)?.count || 0;
    const expulsionsCount = currentDistrictDisciplineData.find(item => 
        item.count_type.id === expulsionType?.id)?.count || 0;

    // State data for comparison
    const stateInSchoolSuspensionsCount = currentStateDisciplineData.find(item => 
        item.count_type.id === inSchoolSuspensionType?.id)?.count || 0;
    const stateOutOfSchoolSuspensionsCount = currentStateDisciplineData.find(item => 
        item.count_type.id === outOfSchoolSuspensionType?.id)?.count || 0;
    const stateExpulsionsCount = currentStateDisciplineData.find(item => 
        item.count_type.id === expulsionType?.id)?.count || 0;

    // Enrollment data
    const districtEnrollment = districtEnrollmentData.find(item => 
        item.year === fiscalYear)?.total_enrollment || 0;
    const stateEnrollment = stateEnrollmentData.find(item => 
        item.year === fiscalYear)?.total_enrollment || 0;

    // Calculated metrics
    const totalSuspensions = inSchoolSuspensionsCount + outOfSchoolSuspensionsCount;
    const stateTotalSuspensions = stateInSchoolSuspensionsCount + stateOutOfSchoolSuspensionsCount;
    const districtSuspensionsPer100 = calculatePer100Students(totalSuspensions, districtEnrollment);
    const stateSuspensionsPer100 = calculatePer100Students(stateTotalSuspensions, stateEnrollment);

    // Suspension summary content - extracted to avoid duplication
    const SuspensionSummaryContent = ({ asList = true }) => {
        const Container = asList ? 'ul' : 'div';
        const containerStyles = asList ? { pl: 2, mt: 0 } : {};
        
        return (
            <Box component={Container} sx={containerStyles}>
                <Typography component="li" variant="body1">
                    {totalSuspensions} students were suspended in {formattedFiscalYear}
                </Typography>
                
                <Box component="ul" sx={{ fontStyle: 'italic', mb: 2, pl: 2 }}>
                    <Typography component="li" variant="body1">
                        {inSchoolSuspensionsCount} Received In-School Suspensions
                    </Typography>
                    <Typography component="li" variant="body1">
                        {outOfSchoolSuspensionsCount} Received Out-of-School Suspensions
                    </Typography>
                </Box>
                
                <Typography component="li" variant="body1">
                    {districtSuspensionsPer100.toFixed(0)} Suspensions Per 100 Students in the District
                </Typography>
                
                <Box component="ul" sx={{ mb: 2, fontStyle: 'italic', pl: 2 }}>
                    <Typography component="li" variant="body1">
                        {stateSuspensionsPer100.toFixed(0)} Suspensions Per 100 Statewide
                    </Typography>
                </Box>
                
                {expulsionsCount > 0 ? (
                    <>
                        <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                            {expulsionsCount} students were expelled in {formattedFiscalYear}
                        </Typography>
                        
                        <Box component="ul" sx={{ fontStyle: 'italic', pl: 2 }}>
                            <Typography component="li" variant="body1">
                                Expulsions are rare, only {stateExpulsionsCount} NH students were expelled in {formattedFiscalYear}
                            </Typography>
                        </Box>
                    </>
                ) : (
                    <Typography component="li" variant="body1">
                        No students were expelled in {formattedFiscalYear}
                    </Typography>
                )}
            </Box>
        );
    };

    // Simple list style summary for mobile views
    const renderSummary = () => <SuspensionSummaryContent asList={true} />;

    // Card-based summary for larger screens
    const renderCardSummary = () => (
        <Box sx={{ height: '100%', pb: isExtraLarge ? 4 : 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'left', mb: 1 }}>
                <Typography variant="body1" sx={{ ml: 0.5 }}>
                    Executive Summary:
                </Typography>
            </Box>
            <Card sx={{ 
                p: 2, 
                pl: 4, 
                mt: 0, 
                border: 1, 
                borderColor: 'grey.300', 
                borderRadius: 1, 
                backgroundColor: 'grey.100', 
                height: '100%', 
                overflow: 'auto' 
            }}>
                <SuspensionSummaryContent asList={true} />
            </Card>
        </Box>
    );

    // Responsive layout rendering
    const renderContent = () => {
        if (isExtraLarge) {
            return (
                <>
                    <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                        <Box sx={{ width: '35%', pr: 1 }}>
                            {renderCardSummary()}
                        </Box>
                        <Box sx={{ width: '65%', pl: 1 }}>
                            <DisciplineIncidentTable fiscalYear={fiscalYear} />
                        </Box>
                    </Box>
                    <Divider sx={{ mt: 3 }} />
                    <SuspensionTrendChart />
                </>
            );
        }
        
        if (isLarge) {
            return (
                <>
                    {renderCardSummary()}
                    <Divider sx={{ mb: 2 }} />
                    <DisciplineIncidentTable fiscalYear={fiscalYear} />
                    <Divider sx={{ mt: 3 }} />
                    <SuspensionTrendChart />
                </>
            );
        }
        
        return (
            <>
                {renderSummary()}
                <Divider sx={{ mb: 2 }} />
                <DisciplineIncidentTable fiscalYear={fiscalYear} />
                <Divider sx={{ mt: 3 }} />
                <SuspensionTrendChart />
                <Box sx={{ pb: 4 }} />
            </>
        );
    };

    return (
        <DefaultCategoryDetails title="Suspensions and Expulsions">
            {renderContent()}
        </DefaultCategoryDetails>
    );
};

export default SuspensionCategoryDetails; 