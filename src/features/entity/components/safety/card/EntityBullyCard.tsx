import React from 'react';
import { Box, Divider, Typography } from '@mui/material';
import DefaultSafetyCard from '@/components/ui/safety/DefaultSafetyCard';
import { FISCAL_YEAR } from '@/utils/environment';
import { useAppSelector } from '@/store/hooks';
import { selectStateBullyingData, selectStateEnrollmentData } from '@/store/slices/safetySlice';
import { calculatePer100Students, calculatePercentageDifference } from '@/utils/safetyCalculations';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import { EntityKind, useCurrentEntity } from '@/features/entity/entity';
import { SAFETY, IdFallback, safetyParams } from '@/features/entity/bindings/safety';
import { useSafetyCard } from '@/features/entity/components/safety/card/useSafetyCard';

const ID_FALLBACK: Record<EntityKind, IdFallback> = { school: 'zero', district: 'none' };

const EntityBullyCard: React.FC<{ kind: EntityKind }> = ({ kind }) => {
  const { isSelected, handleClick } = useSafetyCard(kind, 'bullying');

  const entity = useCurrentEntity(kind);
  const entityParams = safetyParams(entity, ID_FALLBACK[kind]);

  const entityBullyingData = useAppSelector(state => SAFETY[kind].data.bullying(state, entityParams));
  const stateBullyingData = useAppSelector(state => selectStateBullyingData(state, {}));
  const entityEnrollmentData = useAppSelector(state => SAFETY[kind].data.enrollment(state, entityParams));
  const stateEnrollmentData = useAppSelector(state => selectStateEnrollmentData(state, {}));

  // Filter data for current fiscal year and calculate sums
  const filteredCurrentYearData = entityBullyingData.filter(item => item.year === parseInt(FISCAL_YEAR));
  const actualSum = filteredCurrentYearData.reduce((sum, item) => sum + (item.investigated_actual || 0), 0);
  const reportedSum = filteredCurrentYearData.reduce((sum, item) => sum + (item.reported || 0), 0);

  // Filter state bullying data for current year
  const stateFilteredCurrentYearData = stateBullyingData.filter(item => item.year === parseInt(FISCAL_YEAR));
  const stateActualSum = stateFilteredCurrentYearData.reduce((sum, item) => sum + (item.investigated_actual || 0), 0);

  // Find current year enrollment data
  const entityEnrollmentCurrentYear = entityEnrollmentData.find(item => item.year === parseInt(FISCAL_YEAR))?.total_enrollment || 0;
  const stateEnrollmentCurrentYear = stateEnrollmentData.find(item => item.year === parseInt(FISCAL_YEAR))?.total_enrollment || 0;

  // Use utility functions for calculations
  const entityIncidentsPer100 = calculatePer100Students(actualSum, entityEnrollmentCurrentYear);
  const stateIncidentsPer100 = calculatePer100Students(stateActualSum, stateEnrollmentCurrentYear);
  const percentDifference = calculatePercentageDifference(entityIncidentsPer100, stateIncidentsPer100);

  return (
    <DefaultSafetyCard
      onClick={handleClick}
      isSelected={isSelected}
      title="Bullying"
      shortTitle="Bully"
    >
      <Box sx={{ my: 1 }}>
        <Typography variant="body2" fontWeight="bold">
          {actualSum === 0 ? "No" : actualSum} Bullying Incident{actualSum === 1 ? "" : "s"} In {formatFiscalYear(FISCAL_YEAR)}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          ({reportedSum === 0 ? "None" : reportedSum} Reported)
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

export default EntityBullyCard;
