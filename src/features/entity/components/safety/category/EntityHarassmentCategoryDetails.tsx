import React from 'react';
import { useTheme, useMediaQuery, Divider, Box } from '@mui/material';
import DefaultCategoryDetails from '@/components/ui/safety/DefaultCategoryDetails';
import EntityHarassmentDetailsTable from './subCategory/EntityHarassmentDetailsTable';
import EntityHarassmentTrendChart from './subCategory/EntityHarassmentTrendChart';
import { EntityKind } from '@/features/entity/entity';

const EntityHarassmentCategoryDetails: React.FC<{ kind: EntityKind }> = ({ kind }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isExtraLarge = useMediaQuery(theme.breakpoints.up('xl'));
  const isLarge = useMediaQuery(theme.breakpoints.up('lg'));

  // Determine width based on screen size
  const getWidth = () => {
    if (isExtraLarge) return '70%';
    if (isLarge) return '90%';
    return '100%';
  };

  return (
    <DefaultCategoryDetails title="Harassment Overview">
      <Box sx={{
        width: getWidth(),
        ml: 0
      }}>
        <EntityHarassmentDetailsTable kind={kind} />
        <Divider sx={{ mt: 3, mb: 2 }} />
        <EntityHarassmentTrendChart kind={kind} />
      </Box>
    </DefaultCategoryDetails>
  );
};

export default EntityHarassmentCategoryDetails;
