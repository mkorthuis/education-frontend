import React from 'react';
import { Box, Divider, Typography, useMediaQuery, useTheme, Card } from '@mui/material';
import DefaultCategoryDetails from '@/components/ui/safety/DefaultCategoryDetails';
import EntityRestraintTrendChart from './subCategory/EntityRestraintTrendChart';
import EntitySeclusionTrendChart from './subCategory/EntitySeclusionTrendChart';
import {
  selectStateEnrollmentData,
  selectStateRestraintData,
  selectStateSeclusionData
} from '@/store/slices/safetySlice';
import { useAppSelector } from '@/store/hooks';
import { FISCAL_YEAR } from '@/utils/environment';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import { calculatePer100Students } from '@/utils/safetyCalculations';
import { EntityKind, useCurrentEntity } from '@/features/entity/entity';
import { SAFETY, IdFallback, safetyParams } from '@/features/entity/bindings/safety';

const ID_FALLBACK: Record<EntityKind, IdFallback> = { school: 'zero', district: 'none' };

// The school page shows rates with 2 fixed decimals ('0.50'); the district page shows the number as is ('0.5').
const FORMAT_RATE: Record<EntityKind, (rate: number) => string | number> = {
  school: rate => rate.toFixed(2),
  district: rate => rate
};

// Card flex below md: the school page keeps '1 1 50%', the district page uses '1'.
const MOBILE_CARD_FLEX: Record<EntityKind, string> = { school: '1 1 50%', district: '1' };

const EntityRestraintCategoryDetails: React.FC<{ kind: EntityKind }> = ({ kind }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const entity = useCurrentEntity(kind);
  const fiscalYear = parseInt(FISCAL_YEAR);
  const formattedFiscalYear = formatFiscalYear(FISCAL_YEAR);
  const formatRate = FORMAT_RATE[kind];

  // Fetch all data
  const entityParams = safetyParams(entity, ID_FALLBACK[kind]);
  const stateParams = {};
  const entityRestraintData = useAppSelector(state => SAFETY[kind].data.restraint(state, entityParams));
  const stateRestraintData = useAppSelector(state => selectStateRestraintData(state, stateParams));
  const entitySeclusionData = useAppSelector(state => SAFETY[kind].data.seclusion(state, entityParams));
  const stateSeclusionData = useAppSelector(state => selectStateSeclusionData(state, stateParams));
  const entityEnrollmentData = useAppSelector(state => SAFETY[kind].data.enrollment(state, entityParams));
  const stateEnrollmentData = useAppSelector(state => selectStateEnrollmentData(state, stateParams));

  // Get current year data
  const currentEntityRestraintData = entityRestraintData.find(item => item.year === fiscalYear);
  const currentStateRestraintData = stateRestraintData.find(item => item.year === fiscalYear);
  const currentEntitySeclusionData = entitySeclusionData.find(item => item.year === fiscalYear);
  const currentStateSeclusionData = stateSeclusionData.find(item => item.year === fiscalYear);

  // Get current enrollment for calculating rates
  const currentEntityEnrollment = entityEnrollmentData.find(item => item.year === fiscalYear)?.total_enrollment || 0;
  const currentStateEnrollment = stateEnrollmentData.find(item => item.year === fiscalYear)?.total_enrollment || 0;

  // Calculate per 100 students rates
  const entityRestraintPer100 = calculatePer100Students(currentEntityRestraintData?.generated || 0, currentEntityEnrollment);
  const stateRestraintPer100 = calculatePer100Students(currentStateRestraintData?.generated || 0, currentStateEnrollment);
  const entitySeclusionPer100 = calculatePer100Students(currentEntitySeclusionData?.generated || 0, currentEntityEnrollment);
  const stateSeclusionPer100 = calculatePer100Students(currentStateSeclusionData?.generated || 0, currentStateEnrollment);

  // Data objects for restraint and seclusion
  const restraintData = {
    count: currentEntityRestraintData?.generated || 0,
    fiscalYear: formattedFiscalYear,
    per100Students: formatRate(entityRestraintPer100),
    stateAvg: formatRate(stateRestraintPer100),
    activeInvestigations: currentEntityRestraintData?.active_investigation || 0,
    bodilyInjury: currentEntityRestraintData?.bodily_injury || 0,
    seriousInjury: currentEntityRestraintData?.serious_injury || 0,
    hasActiveInvestigations: (currentEntityRestraintData?.active_investigation || 0) > 0,
    hasInjuries: ((currentEntityRestraintData?.bodily_injury || 0) + (currentEntityRestraintData?.serious_injury || 0)) > 0
  };

  const seclusionData = {
    count: currentEntitySeclusionData?.generated || 0,
    fiscalYear: formattedFiscalYear,
    per100Students: formatRate(entitySeclusionPer100),
    stateAvg: formatRate(stateSeclusionPer100),
    activeInvestigations: currentEntitySeclusionData?.active_investigation || 0,
    closedInvestigations: currentEntitySeclusionData?.closed_investigation || 0,
    hasActiveInvestigations: (currentEntitySeclusionData?.active_investigation || 0) > 0,
    hasClosedInvestigations: (currentEntitySeclusionData?.closed_investigation || 0) > 0
  };

  // Common styles
  const cardStyles = {
    flex: isMobile ? MOBILE_CARD_FLEX[kind] : '1 1 50%',
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
    entityName
  }: {
    type: 'Restraint' | 'Seclusion',
    data: typeof restraintData | typeof seclusionData,
    entityName?: string
  }) => (
    <Box component="ul" sx={{ mb: 2, pl: 3 }}>
      <Typography component="li" variant="body1">
        {entityName} Had {data.count} {type} Reports in {data.fiscalYear}
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
          <DataSummary type="Restraint" data={restraintData} entityName={entity.name} />
          <Divider sx={dividerStyles} />
          <EntityRestraintTrendChart kind={kind} />
        </Card>

        {/* Seclusion Section */}
        <Card sx={cardStyles}>
          <Typography variant="h6" sx={titleStyles}>
            Seclusion Data
          </Typography>
          <Divider sx={dividerStyles} />
          <DataSummary type="Seclusion" data={seclusionData} entityName={entity.name} />
          <Divider sx={dividerStyles} />
          <EntitySeclusionTrendChart kind={kind} />
        </Card>
      </Box>
    </DefaultCategoryDetails>
  );
};

export default EntityRestraintCategoryDetails;
