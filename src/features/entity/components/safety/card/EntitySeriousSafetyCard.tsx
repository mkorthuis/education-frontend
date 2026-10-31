import React from 'react';
import { Box, Typography } from '@mui/material';
import DefaultSafetyCard from '@/components/ui/safety/DefaultSafetyCard';
import { useAppSelector } from '@/store/hooks';
import { EARLIEST_YEAR } from '@/utils/safetyCalculations';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import { EntityKind, useCurrentEntity } from '@/features/entity/entity';
import { SAFETY, IdFallback, safetyParams } from '@/features/entity/bindings/safety';
import { useSafetyCard } from '@/features/entity/components/safety/card/useSafetyCard';

const ID_FALLBACK: Record<EntityKind, IdFallback> = { school: 'zero', district: 'none' };

const EntitySeriousSafetyCard: React.FC<{ kind: EntityKind }> = ({ kind }) => {
  const { isSelected, handleClick } = useSafetyCard(kind, 'serious');

  const entity = useCurrentEntity(kind);
  const entityParams = safetyParams(entity, ID_FALLBACK[kind]);

  const entitySafetyData = useAppSelector(state => SAFETY[kind].data.safety(state, entityParams));

  // Find the earliest year and calculate the total count
  const earliestYear = entitySafetyData.length > 0
    ? Math.min(...entitySafetyData.map(item => item.year))
    : null;

  const totalCount = entitySafetyData.reduce((sum, item) => sum + item.count, 0);

  return (
    <DefaultSafetyCard
      onClick={handleClick}
      isSelected={isSelected}
      title="Serious Safety Events"
      shortTitle="Serious"
    >
      <Box sx={{ my: 1 }}>
        <Typography variant="body2">
          {totalCount > 0 ? totalCount + ` Serious Safety Events Since ` + earliestYear : `No Serious Safety Events Since ` + formatFiscalYear(EARLIEST_YEAR)}
        </Typography>
      </Box>
    </DefaultSafetyCard>
  );
};

export default EntitySeriousSafetyCard;
