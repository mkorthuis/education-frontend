import React from 'react';
import { Box } from '@mui/material';
import { space } from '@/theme/tokens';

interface MetricGridProps {
  count: number;
  /** With an odd number of tiles, center the last one on its own row on phones and tablets */
  centerLastTile?: boolean;
  children: React.ReactNode;
}

/** Tiles two across on phones and tablets; from medium screens, up to four across in one row. */
const MetricGrid: React.FC<MetricGridProps> = ({ count, centerLastTile = false, children }) => (
  <Box
    sx={{
      display: 'grid',
      gap: space.tileGap,
      gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: `repeat(${Math.min(Math.max(count, 1), 4)}, minmax(0, 1fr))` },
      ...(centerLastTile && count % 2 === 1 && {
        // The same width as the tiles above it (half the row less half the gap), centered
        '& > :last-child': {
          gridColumn: { xs: '1 / -1', md: 'auto' },
          justifySelf: { xs: 'center', md: 'stretch' },
          width: { xs: 'calc((100% - 8px) / 2)', sm: 'calc((100% - 16px) / 2)', md: 'auto' },
        },
      }),
    }}
  >
    {children}
  </Box>
);

export default MetricGrid;
