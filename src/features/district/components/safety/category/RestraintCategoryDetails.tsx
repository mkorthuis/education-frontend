import React from 'react';
import { Box, Divider, Typography, useMediaQuery, useTheme, Card } from '@mui/material';
import DefaultCategoryDetails from './DefaultCategoryDetails';
import RestraintTrendChart from './subCategory/RestraintTrendChart';
import SeclusionTrendChart from './subCategory/SeclusionTrendChart';
import { 
  selectStateEnrollmentData, 
  selectDistrictEnrollmentData,
  selectDistrictRestraintData,
  selectStateRestraintData,
  selectDistrictSeclusionData,
  selectStateSeclusionData
} from '@/store/slices/safetySlice';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentDistrict } from '@/store/slices/locationSlice';
import { FISCAL_YEAR } from '@/utils/environment';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import { calculatePer100Students } from '@/features/district/utils/safetyDataProcessing';

const RestraintCategoryDetails: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const district = useAppSelector(selectCurrentDistrict);
    const fiscalYear = parseInt(FISCAL_YEAR);
    const formattedFiscalYear = formatFiscalYear(FISCAL_YEAR);

    // Fetch all data
    const districtRestraintData = useAppSelector(state => selectDistrictRestraintData(state, {district_id: district?.id}));
    const stateRestraintData = useAppSelector(state => selectStateRestraintData(state, {}));
    const districtSeclusionData = useAppSelector(state => selectDistrictSeclusionData(state, {district_id: district?.id}));
    const stateSeclusionData = useAppSelector(state => selectStateSeclusionData(state, {}));
    const districtEnrollmentData = useAppSelector(state => selectDistrictEnrollmentData(state, {district_id: district?.id}));
    const stateEnrollmentData = useAppSelector(state => selectStateEnrollmentData(state, {}));

    // Get current year data
    const currentDistrictRestraintData = districtRestraintData.find(item => item.year === fiscalYear);
    const currentStateRestraintData = stateRestraintData.find(item => item.year === fiscalYear);
    const currentDistrictSeclusionData = districtSeclusionData.find(item => item.year === fiscalYear);
    const currentStateSeclusionData = stateSeclusionData.find(item => item.year === fiscalYear);

    // Get current enrollment for calculating rates
    const currentDistrictEnrollment = districtEnrollmentData.find(item => item.year === fiscalYear)?.total_enrollment || 0;
    const currentStateEnrollment = stateEnrollmentData.find(item => item.year === fiscalYear)?.total_enrollment || 0;

    // Calculate per 100 students rates
    const districtRestraintPer100 = calculatePer100Students(currentDistrictRestraintData?.generated || 0, currentDistrictEnrollment);
    const stateRestraintPer100 = calculatePer100Students(currentStateRestraintData?.generated || 0, currentStateEnrollment);
    const districtSeclusionPer100 = calculatePer100Students(currentDistrictSeclusionData?.generated || 0, currentDistrictEnrollment);
    const stateSeclusionPer100 = calculatePer100Students(currentStateSeclusionData?.generated || 0, currentStateEnrollment);

    // Data objects for restraint and seclusion
    const restraintData = {
        count: currentDistrictRestraintData?.generated || 0,
        fiscalYear: formattedFiscalYear,
        per100Students: districtRestraintPer100,
        stateAvg: stateRestraintPer100,
        activeInvestigations: currentDistrictRestraintData?.active_investigation || 0,
        bodilyInjury: currentDistrictRestraintData?.bodily_injury || 0,
        seriousInjury: currentDistrictRestraintData?.serious_injury || 0,
        hasActiveInvestigations: (currentDistrictRestraintData?.active_investigation || 0) > 0,
        hasInjuries: ((currentDistrictRestraintData?.bodily_injury || 0) + (currentDistrictRestraintData?.serious_injury || 0)) > 0
    };

    const seclusionData = {
        count: currentDistrictSeclusionData?.generated || 0,
        fiscalYear: formattedFiscalYear,
        per100Students: districtSeclusionPer100,
        stateAvg: stateSeclusionPer100,
        activeInvestigations: currentDistrictSeclusionData?.active_investigation || 0,
        closedInvestigations: currentDistrictSeclusionData?.closed_investigation || 0,
        hasActiveInvestigations: (currentDistrictSeclusionData?.active_investigation || 0) > 0,
        hasClosedInvestigations: (currentDistrictSeclusionData?.closed_investigation || 0) > 0
    };

    // Common styles
    const cardStyles = {
        flex: isMobile ? '1' : '1 1 50%', 
        border: '1px solid', 
        borderColor: 'divider', 
        p: 1
    };

    const titleStyles = {
        mb: 2, 
        mt: 1, 
        textAlign: 'center'
    };

    const dividerStyles = {
        width: '100%', 
        mb: 2
    };

    const DataSummary = ({ 
        type, 
        data, 
        districtName 
    }: { 
        type: 'Restraint' | 'Seclusion', 
        data: typeof restraintData | typeof seclusionData, 
        districtName?: string
    }) => (
        <Box component="ul" sx={{ mb: 2, pl: 3 }}>
            <Typography component="li" variant="body1">
                {districtName} Had {data.count} {type} Reports in {data.fiscalYear}
            </Typography>
            <Typography component="li" variant="body1">
                {isMobile ? 
                    `${data.per100Students} ${type} Reports Per 100 Students` :
                    `This is ${data.per100Students} ${type} Reports Per 100 Students`
                }
            </Typography>
            <Box component="ul" sx={{ fontStyle: 'italic', pl: 4, mb: 2 }}>
            <Typography component="li" sx={{fontStyle: 'italic', color: 'text.secondary'}} variant="body1">
                {isMobile ? 
                    `State Average is ${data.stateAvg} Reports` :
                    `State Average is ${data.stateAvg} Reports Per 100 Students`
                }
            </Typography>
            </Box>
            {data.hasActiveInvestigations && (
                <Typography component="li" variant="body1">
                    There Are {data.activeInvestigations} Active/Ongoing Investigations
                </Typography>
            )}
            {type === 'Restraint' && (data as typeof restraintData).hasInjuries && (
                <>
                    <Typography component="li" variant="body1">
                        {(data as typeof restraintData).bodilyInjury} Restraints Resulted in Bodily Injury
                    </Typography>
                    <Typography component="li" variant="body1">
                        {(data as typeof restraintData).seriousInjury} Restraints Resulted in Serious Injury or Death
                    </Typography>
                </>
            )}
            {type === 'Seclusion' && (data as typeof seclusionData).hasClosedInvestigations && (
                <Typography component="li" variant="body1">
                    There Are {(data as typeof seclusionData).closedInvestigations} Closed Investigations
                </Typography>
            )}
        </Box>
    );

    return (
        <DefaultCategoryDetails title="Restraint and Seclusion Overview">
            <Typography variant="body1" sx={{mb:2}}>
                Restraint is defined as physically holding or limiting a student's movement to prevent them from hurting themselves or others in an emergency situation. 
            </Typography>
            <Typography variant="body1" sx={{mb:2}}>
                Seclusion is when a student is placed alone in a room or area they can't or believe they can't leave, which should only be used for safety reasons, never as punishment.
            </Typography>
            <Divider sx={dividerStyles} />
            
            <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 3 }}>
                {/* Restraint Section */}
                <Card sx={cardStyles}>
                    <Typography variant="h6" sx={titleStyles}>
                        Restraint Data
                    </Typography>
                    <Divider sx={dividerStyles} />
                    <DataSummary type="Restraint" data={restraintData} districtName={district?.name} />
                    <Divider sx={dividerStyles} />
                    <RestraintTrendChart />
                </Card>
                
                {/* Seclusion Section */}
                <Card sx={cardStyles}>
                    <Typography variant="h6" sx={titleStyles}>
                        Seclusion Data
                    </Typography>
                    <Divider sx={dividerStyles} />
                    <DataSummary type="Seclusion" data={seclusionData} districtName={district?.name} />
                    <Divider sx={dividerStyles} />
                    <SeclusionTrendChart />
                </Card>
            </Box>
        </DefaultCategoryDetails>
    );
};

export default RestraintCategoryDetails; 