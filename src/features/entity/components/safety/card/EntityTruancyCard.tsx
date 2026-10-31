import React from 'react';
import { Box, Divider, Typography } from '@mui/material';
import DefaultSafetyCard from '@/components/ui/safety/DefaultSafetyCard';
import { FISCAL_YEAR } from '@/utils/environment';
import { useAppSelector } from '@/store/hooks';
import { selectStateTruancyData, selectStateEnrollmentData } from '@/store/slices/safetySlice';
import { calculatePer100Students, calculatePercentageDifference } from '@/utils/safetyCalculations';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import { EntityKind, useCurrentEntity } from '@/features/entity/entity';
import { SAFETY, IdFallback, safetyParams } from '@/features/entity/bindings/safety';
import { useSafetyCard } from '@/features/entity/components/safety/card/useSafetyCard';

const ID_FALLBACK: Record<EntityKind, IdFallback> = { school: 'zero', district: 'none' };

const EntityTruancyCard: React.FC<{ kind: EntityKind }> = ({ kind }) => {
  const { isSelected, handleClick } = useSafetyCard(kind, 'truancy');

  const entity = useCurrentEntity(kind);
  const entityParams = safetyParams(entity, ID_FALLBACK[kind]);

  const entityTruancyData = useAppSelector(state => SAFETY[kind].data.truancy(state, entityParams));
  const stateTruancyData = useAppSelector(state => selectStateTruancyData(state, {}));
  const entityEnrollmentData = useAppSelector(state => SAFETY[kind].data.enrollment(state, entityParams));
  const stateEnrollmentData = useAppSelector(state => selectStateEnrollmentData(state, {}));

  // Filter data for the current fiscal year
  const filteredCurrentYearData = entityTruancyData.filter(item => item.year === parseInt(FISCAL_YEAR));
  const entityTruantStudents = filteredCurrentYearData.reduce((sum, item) => sum + (item.count || 0), 0);

  const stateFilteredCurrentYearData = stateTruancyData.filter(item => item.year === parseInt(FISCAL_YEAR));
  const stateTruantStudents = stateFilteredCurrentYearData.reduce((sum, item) => sum + (item.count || 0), 0);

  // Get enrollment for the current fiscal year
  const entityEnrollmentCurrentYear = entityEnrollmentData.find(item => item.year === parseInt(FISCAL_YEAR))?.total_enrollment || 0;
  const stateEnrollmentCurrentYear = stateEnrollmentData.find(item => item.year === parseInt(FISCAL_YEAR))?.total_enrollment || 0;

  // Calculate per 100 students for comparison
  const entityTruantStudentsPer100 = calculatePer100Students(entityTruantStudents, entityEnrollmentCurrentYear);
  const stateTruantStudentsPer100 = calculatePer100Students(stateTruantStudents, stateEnrollmentCurrentYear);
  const percentDifference = calculatePercentageDifference(entityTruantStudentsPer100, stateTruantStudentsPer100);

  // Calculate percentage of students who are truant
  const percentageTruantStudents = Math.round((entityTruantStudents / entityEnrollmentCurrentYear) * 100);

  return (
    <DefaultSafetyCard
      onClick={handleClick}
      isSelected={isSelected}
      title="Truancies"
      shortTitle="Truancy"
    >
      <Box sx={{ my: 1 }}>
        <Typography variant="body2" fontWeight="bold">
          {entityTruantStudents} Truant Student{entityTruantStudents === 1 ? "" : "s"} in {formatFiscalYear(FISCAL_YEAR)}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          ({percentageTruantStudents}% of Students)
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

export default EntityTruancyCard;
