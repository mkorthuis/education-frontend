import React from 'react';
import { Box, Divider, Typography } from '@mui/material';
import DefaultSafetyCard from '@/components/ui/safety/DefaultSafetyCard';
import { FISCAL_YEAR } from '@/utils/environment';
import { useAppSelector } from '@/store/hooks';
import { selectStateHarassmentData, selectStateEnrollmentData } from '@/store/slices/safetySlice';
import { calculatePer100Students, calculatePercentageDifference } from '@/utils/safetyCalculations';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import { EntityKind, useCurrentEntity } from '@/features/entity/entity';
import { SAFETY, IdFallback, safetyParams } from '@/features/entity/bindings/safety';
import { useSafetyCard } from '@/features/entity/components/safety/card/useSafetyCard';

const ID_FALLBACK: Record<EntityKind, IdFallback> = { school: 'zero', district: 'none' };

const EntityHarassmentCard: React.FC<{ kind: EntityKind }> = ({ kind }) => {
  const { isSelected, handleClick } = useSafetyCard(kind, 'harassment');

  const entity = useCurrentEntity(kind);
  const entityParams = safetyParams(entity, ID_FALLBACK[kind]);

  const entityHarassmentData = useAppSelector(state => SAFETY[kind].data.harassment(state, entityParams));
  const stateHarassmentData = useAppSelector(state => selectStateHarassmentData(state, {}));
  const entityEnrollmentData = useAppSelector(state => SAFETY[kind].data.enrollment(state, entityParams));
  const stateEnrollmentData = useAppSelector(state => selectStateEnrollmentData(state, {}));

  const filteredCurrentYearData = entityHarassmentData.filter(item => item.year === parseInt(FISCAL_YEAR));
  const entityIncidentSum = filteredCurrentYearData.reduce((sum, item) => sum + (item.incident_count || 0), 0);
  const entityImpactedSum = filteredCurrentYearData.reduce((sum, item) => sum + (item.student_impact_count || 0), 0);

  // Filter state harassment data for current fiscal year
  const stateFilteredCurrentYearData = stateHarassmentData.filter(item => item.year === parseInt(FISCAL_YEAR));
  const stateIncidentSum = stateFilteredCurrentYearData.reduce((sum, item) => sum + (item.incident_count || 0), 0);

  // Find current year enrollment data
  const entityEnrollmentCurrentYear = entityEnrollmentData.find(item => item.year === parseInt(FISCAL_YEAR))?.total_enrollment || 0;
  const stateEnrollmentCurrentYear = stateEnrollmentData.find(item => item.year === parseInt(FISCAL_YEAR))?.total_enrollment || 0;

  const entityIncidentsPer100 = calculatePer100Students(entityIncidentSum, entityEnrollmentCurrentYear);
  const stateIncidentsPer100 = calculatePer100Students(stateIncidentSum, stateEnrollmentCurrentYear);
  const percentDifference = calculatePercentageDifference(entityIncidentsPer100, stateIncidentsPer100);

  return (
    <DefaultSafetyCard
      onClick={handleClick}
      isSelected={isSelected}
      title="Harassments"
      shortTitle="Harass"
    >
      <Box sx={{ my: 1 }}>
        <Typography variant="body2" fontWeight="bold">
          {entityIncidentSum === 0 ? "No" : entityIncidentSum} Harassment Incident{entityIncidentSum === 1 ? "" : "s"} In {formatFiscalYear(FISCAL_YEAR)}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          ({entityImpactedSum === 0 ? "No" : entityImpactedSum} Impacted Student{entityImpactedSum === 1 ? "" : "s"})
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

export default EntityHarassmentCard;
