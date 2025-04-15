import React from 'react';
import { Box, Divider, Typography, useMediaQuery, useTheme, Card } from '@mui/material';
import DefaultCategoryDetails from './DefaultCategoryDetails';
import RestraintTrendChart from './subCategory/RestraintTrendChart';
import SeclusionTrendChart from './subCategory/SeclusionTrendChart';
import { 
  selectStateEnrollmentData, 
  selectSchoolEnrollmentData,
  selectSchoolRestraintData,
  selectStateRestraintData,
  selectSchoolSeclusionData,
  selectStateSeclusionData
} from '@/store/slices/safetySlice';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentSchool } from '@/store/slices/locationSlice';
import { FISCAL_YEAR } from '@/utils/environment';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import { calculatePer100Students } from '@/utils/safetyCalculations';

const RestraintCategoryDetails: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isExtraLarge = useMediaQuery(theme.breakpoints.up('xl'));
  const school = useAppSelector(selectCurrentSchool);
  const fiscalYear = parseInt(FISCAL_YEAR);
  const formattedFiscalYear = formatFiscalYear(FISCAL_YEAR);

  // Fetch all data
  const schoolParams = { school_id: school?.id || 0 };
  const stateParams = {};
  const schoolRestraintData = useAppSelector(state => selectSchoolRestraintData(state, schoolParams));
  const stateRestraintData = useAppSelector(state => selectStateRestraintData(state, stateParams));
  const schoolSeclusionData = useAppSelector(state => selectSchoolSeclusionData(state, schoolParams));
  const stateSeclusionData = useAppSelector(state => selectStateSeclusionData(state, stateParams));
  const schoolEnrollmentData = useAppSelector(state => selectSchoolEnrollmentData(state, schoolParams));
  const stateEnrollmentData = useAppSelector(state => selectStateEnrollmentData(state, stateParams));

  // Get current year data
  const currentSchoolRestraintData = schoolRestraintData.find(item => item.year === fiscalYear);
  const currentStateRestraintData = stateRestraintData.find(item => item.year === fiscalYear);
  const currentSchoolSeclusionData = schoolSeclusionData.find(item => item.year === fiscalYear);
  const currentStateSeclusionData = stateSeclusionData.find(item => item.year === fiscalYear);

  // Get current enrollment for calculating rates
  const currentSchoolEnrollment = schoolEnrollmentData.find(item => item.year === fiscalYear)?.total_enrollment || 0;
  const currentStateEnrollment = stateEnrollmentData.find(item => item.year === fiscalYear)?.total_enrollment || 0;

  // Calculate per 100 students rates
  const schoolRestraintPer100 = calculatePer100Students(currentSchoolRestraintData?.generated || 0, currentSchoolEnrollment);
  const stateRestraintPer100 = calculatePer100Students(currentStateRestraintData?.generated || 0, currentStateEnrollment);
  const schoolSeclusionPer100 = calculatePer100Students(currentSchoolSeclusionData?.generated || 0, currentSchoolEnrollment);
  const stateSeclusionPer100 = calculatePer100Students(currentStateSeclusionData?.generated || 0, currentStateEnrollment);

  // Data objects for restraint and seclusion
  const restraintData = {
    count: currentSchoolRestraintData?.generated || 0,
    fiscalYear: formattedFiscalYear,
    per100Students: schoolRestraintPer100.toFixed(2),
    stateAvg: stateRestraintPer100.toFixed(2),
    activeInvestigations: currentSchoolRestraintData?.active_investigation || 0,
    bodilyInjury: currentSchoolRestraintData?.bodily_injury || 0,
    seriousInjury: currentSchoolRestraintData?.serious_injury || 0,
    hasActiveInvestigations: (currentSchoolRestraintData?.active_investigation || 0) > 0,
    hasInjuries: ((currentSchoolRestraintData?.bodily_injury || 0) + (currentSchoolRestraintData?.serious_injury || 0)) > 0
  };

  const seclusionData = {
    count: currentSchoolSeclusionData?.generated || 0,
    fiscalYear: formattedFiscalYear,
    per100Students: schoolSeclusionPer100.toFixed(2),
    stateAvg: stateSeclusionPer100.toFixed(2),
    activeInvestigations: currentSchoolSeclusionData?.active_investigation || 0,
    closedInvestigations: currentSchoolSeclusionData?.closed_investigation || 0,
    hasActiveInvestigations: (currentSchoolSeclusionData?.active_investigation || 0) > 0,
    hasClosedInvestigations: (currentSchoolSeclusionData?.closed_investigation || 0) > 0
  };

  // Common styles
  const cardStyles = {
    flex: '1 1 50%', 
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
    schoolName 
  }: { 
    type: 'Restraint' | 'Seclusion', 
    data: typeof restraintData | typeof seclusionData, 
    schoolName?: string
  }) => (
    <Box component="ul" sx={{ mb: 2, pl: 3 }}>
      <Typography component="li" variant="body1">
        {schoolName} Had {data.count} {type} Reports in {data.fiscalYear}
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
          <DataSummary type="Restraint" data={restraintData} schoolName={school?.name} />
          <Divider sx={dividerStyles} />
          <RestraintTrendChart />
        </Card>
        
        {/* Seclusion Section */}
        <Card sx={cardStyles}>
          <Typography variant="h6" sx={titleStyles}>
            Seclusion Data
          </Typography>
          <Divider sx={dividerStyles} />
          <DataSummary type="Seclusion" data={seclusionData} schoolName={school?.name} />
          <Divider sx={dividerStyles} />
          <SeclusionTrendChart />
        </Card>
      </Box>
    </DefaultCategoryDetails>
  );
};

export default RestraintCategoryDetails; 