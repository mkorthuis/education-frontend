import React from 'react';
import { Box } from '@mui/material';
import { space } from '@/theme/tokens';

/** Tiles two across on phones and tablets; from medium screens, up to four across in one row. */
const MetricGrid: React.FC<{ count: number; children: React.ReactNode }> = ({ count, children }) => (
  <Box
    sx={{
      display: 'grid',
      gap: space.tileGap,
      gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: `repeat(${Math.min(Math.max(count, 1), 4)}, minmax(0, 1fr))` },
    }}
  >
    {children}
  </Box>
);

export default MetricGrid;
