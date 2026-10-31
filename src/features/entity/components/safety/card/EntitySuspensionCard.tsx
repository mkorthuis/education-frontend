import React from 'react';
import { Box, Divider, Typography } from '@mui/material';
import DefaultSafetyCard from '@/components/ui/safety/DefaultSafetyCard';
import { useAppSelector } from '@/store/hooks';
import {
  selectStateDisciplineCountData,
  selectStateEnrollmentData,
  selectDisciplineCountTypes
} from '@/store/slices/safetySlice';
import {
  calculatePer100Students,
  calculatePercentageDifference,
  IN_SCHOOL_SUSPENSION_TYPE,
  OUT_OF_SCHOOL_SUSPENSION_TYPE
} from '@/utils/safetyCalculations';
import { FISCAL_YEAR } from '@/utils/environment';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import { EntityKind, useCurrentEntity } from '@/features/entity/entity';
import { SAFETY, IdFallback, safetyParams } from '@/features/entity/bindings/safety';
import { useSafetyCard } from '@/features/entity/components/safety/card/useSafetyCard';

const ID_FALLBACK: Record<EntityKind, IdFallback> = { school: 'zero', district: 'none' };

const EntitySuspensionCard: React.FC<{ kind: EntityKind }> = ({ kind }) => {
  const { isSelected, handleClick } = useSafetyCard(kind, 'suspension');

  const entity = useCurrentEntity(kind);
  const entityParams = safetyParams(entity, ID_FALLBACK[kind]);

  const entityDisciplineData = useAppSelector(state => SAFETY[kind].data.disciplineCount(state, entityParams));
  const stateDisciplineData = useAppSelector(state => selectStateDisciplineCountData(state, {}));
  const entityEnrollmentData = useAppSelector(state => SAFETY[kind].data.enrollment(state, entityParams));
  const stateEnrollmentData = useAppSelector(state => selectStateEnrollmentData(state, {}));
  const disciplineCountTypes = useAppSelector(selectDisciplineCountTypes);

  const filteredCurrentYearData = entityDisciplineData.filter(item => item.year === parseInt(FISCAL_YEAR));

  // Find in-school and out-of-school suspension count types
  const inSchoolSuspensionType = disciplineCountTypes.find(type =>
    type.name.includes(IN_SCHOOL_SUSPENSION_TYPE));
  const outOfSchoolSuspensionType = disciplineCountTypes.find(type =>
    type.name.includes(OUT_OF_SCHOOL_SUSPENSION_TYPE));

  // Get the counts for each suspension type
  const inSchoolSuspensionsCount = filteredCurrentYearData.find(item =>
    item.count_type.id === inSchoolSuspensionType?.id)?.count || 0;
  const outOfSchoolSuspensionsCount = filteredCurrentYearData.find(item =>
    item.count_type.id === outOfSchoolSuspensionType?.id)?.count || 0;

  // Calculate total suspensions
  const totalSuspensions = inSchoolSuspensionsCount + outOfSchoolSuspensionsCount;

  // Get state suspension data for comparison
  const stateFilteredCurrentYearData = stateDisciplineData.filter(item => item.year === parseInt(FISCAL_YEAR));
  const stateInSchoolSuspensionsCount = stateFilteredCurrentYearData.find(item =>
    item.count_type.id === inSchoolSuspensionType?.id)?.count || 0;
  const stateOutOfSchoolSuspensionsCount = stateFilteredCurrentYearData.find(item =>
    item.count_type.id === outOfSchoolSuspensionType?.id)?.count || 0;
  const stateTotalSuspensions = stateInSchoolSuspensionsCount + stateOutOfSchoolSuspensionsCount;

  // Calculate entity and state enrollment for the comparison
  const entityEnrollment = entityEnrollmentData.find(item => item.year === parseInt(FISCAL_YEAR))?.total_enrollment || 0;
  const stateEnrollment = stateEnrollmentData.find(item => item.year === parseInt(FISCAL_YEAR))?.total_enrollment || 0;

  // Calculate per 100 students for comparison
  const entitySuspensionsPer100 = calculatePer100Students(totalSuspensions, entityEnrollment);
  const stateSuspensionsPer100 = calculatePer100Students(stateTotalSuspensions, stateEnrollment);

  // Calculate percentage difference from state average
  const percentageDiff = calculatePercentageDifference(entitySuspensionsPer100, stateSuspensionsPer100);

  return (
    <DefaultSafetyCard
      onClick={handleClick}
      isSelected={isSelected}
      title="Suspensions and Expulsions"
      shortTitle="Suspend"
    >
      <Box sx={{ my: 1 }}>
        <Typography variant="body2" fontWeight="bold">
          {totalSuspensions === 0 ? "No" : totalSuspensions} Suspension{totalSuspensions === 1 ? "" : "s"} in {formatFiscalYear(FISCAL_YEAR)}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          ({outOfSchoolSuspensionsCount} Out-of-School Suspension{outOfSchoolSuspensionsCount === 1 ? "" : "s"})
        </Typography>
      </Box>
      <Divider sx={{ my: 1 }} />
      <Box>
        <Typography variant="body2">
          {percentageDiff === 0 ? "Same as" : percentageDiff > 0 ? `${percentageDiff}% Higher Than` : `${-percentageDiff}% Lower Than`} State Average
        </Typography>
      </Box>
    </DefaultSafetyCard>
  );
};

export default EntitySuspensionCard;
