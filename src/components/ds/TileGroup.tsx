import React from 'react';
import { Box, SxProps, Theme } from '@mui/material';
import GroupLabel from './GroupLabel';

// Two tiles across on phones and tablets. Where four fit across (lg and up), a full-width group
// is four across and a half-width group (two side by side, in a TileGroupPair) is 2 x 2. The two
// half-width groups share their rows with each other (CSS subgrid), so the four tiles across a row
// are one height.
const tileGrid = (half: boolean) => ({
  display: 'grid',
  gap: { xs: 1, sm: 2 },
  gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', lg: half ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))' },
  ...(half && { gridRow: { lg: 'span 2' }, gridTemplateRows: { lg: 'subgrid' } }),
});

/**
 * A group of key-figure tiles under a section heading such as "Key Statewide Figures", labeled
 * ("SCHOOLS") unless it's the section's only group.
 */
const TileGroup: React.FC<{ title?: string; half?: boolean; sx?: SxProps<Theme>; children: React.ReactNode }> = ({ title, half = false, sx, children }) => (
  <Box
    component="section"
    // Groups are set apart by space and their label, not outlines: the tiles are the only boxes
    sx={[
      {
        mb: 4,
        minWidth: 0,
        // Label in the shared grid's first row, tiles in the next two
        ...(half && { display: { lg: 'grid' }, gridRow: { lg: 'span 3' }, gridTemplateRows: { lg: 'subgrid' }, rowGap: { lg: 0 } }),
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    {title && <GroupLabel>{title}</GroupLabel>}
    <Box sx={tileGrid(half)}>{children}</Box>
  </Box>
);

/** Two half-width tile groups side by side where four tiles fit across, stacked below that. */
export const TileGroupPair: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, columnGap: 3, rowGap: 0 }}>
    {children}
  </Box>
);

export default TileGroup;
