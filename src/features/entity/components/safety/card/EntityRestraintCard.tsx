import React from 'react';
import { Box, Divider, Typography } from '@mui/material';
import DefaultSafetyCard from '@/components/ui/safety/DefaultSafetyCard';
import { FISCAL_YEAR } from '@/utils/environment';
import { useAppSelector } from '@/store/hooks';
import { selectStateRestraintData, selectStateEnrollmentData } from '@/store/slices/safetySlice';
import { calculatePercentageDifference, calculatePer100Students } from '@/utils/safetyCalculations';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import { EntityKind, useCurrentEntity } from '@/features/entity/entity';
import { SAFETY, IdFallback, safetyParams } from '@/features/entity/bindings/safety';
import { useSafetyCard } from '@/features/entity/components/safety/card/useSafetyCard';

const ID_FALLBACK: Record<EntityKind, IdFallback> = { school: 'zero', district: 'none' };

const EntityRestraintCard: React.FC<{ kind: EntityKind }> = ({ kind }) => {
  const { isSelected, handleClick } = useSafetyCard(kind, 'restraint');

  const entity = useCurrentEntity(kind);
  const entityParams = safetyParams(entity, ID_FALLBACK[kind]);

  const entityRestraintData = useAppSelector(state => SAFETY[kind].data.restraint(state, entityParams));
  const stateRestraintData = useAppSelector(state => selectStateRestraintData(state, {}));
  const entityEnrollmentData = useAppSelector(state => SAFETY[kind].data.enrollment(state, entityParams));
  const stateEnrollmentData = useAppSelector(state => selectStateEnrollmentData(state, {}));

  const filteredCurrentYearData = entityRestraintData.filter(item => item.year === parseInt(FISCAL_YEAR)); // Should only be one item
  const entityGeneratedRestraints = filteredCurrentYearData.reduce((sum, item) => sum + (item.generated || 0), 0);
  const entityClosedRestraints = filteredCurrentYearData.reduce((sum, item) => sum + (item.closed_investigation || 0), 0);

  const entityEnrollmentCurrentYear = entityEnrollmentData.find(item => item.year === parseInt(FISCAL_YEAR))?.total_enrollment || 0;
  const stateEnrollmentCurrentYear = stateEnrollmentData.find(item => item.year === parseInt(FISCAL_YEAR))?.total_enrollment || 0;

  // Filter state restraint data for current fiscal year
  const stateFilteredCurrentYearData = stateRestraintData.filter(item => item.year === parseInt(FISCAL_YEAR)); // Should only be one item
  const stateGeneratedRestraints = stateFilteredCurrentYearData.reduce((sum, item) => sum + (item.generated || 0), 0);

  const entityRestraintsPer100 = calculatePer100Students(entityGeneratedRestraints, entityEnrollmentCurrentYear);
  const stateRestraintsPer100 = calculatePer100Students(stateGeneratedRestraints, stateEnrollmentCurrentYear);
  const percentDifference = calculatePercentageDifference(entityRestraintsPer100, stateRestraintsPer100);

  return (
    <DefaultSafetyCard
      onClick={handleClick}
      isSelected={isSelected}
      title="Restraints and Seclusions"
      shortTitle="Restraint"
    >
      <Box sx={{ my: 1 }}>
        <Typography variant="body2" fontWeight="bold">
          {entityGeneratedRestraints === 0 ? "No" : entityGeneratedRestraints} Restraint{entityGeneratedRestraints === 1 ? "" : "s"} in {formatFiscalYear(FISCAL_YEAR)}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          ({entityClosedRestraints === entityGeneratedRestraints ? "All" : entityClosedRestraints} Investigated and Closed)
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

export default EntityRestraintCard;
