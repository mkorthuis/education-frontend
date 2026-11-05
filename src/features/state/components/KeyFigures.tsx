import React from 'react';
import { Box, Typography } from '@mui/material';
import { MetricGrid, MetricTile, MetricTileProps } from '@/components/ds';
import { keepYearsTogether, READING_WIDTH } from './chartText';

/** A key figure on a State subpage: a tile without a link (the page itself has the full trend). */
export type KeyFigure = Omit<MetricTileProps, 'to' | 'linkLabel' | 'trend'>;

interface KeyFiguresProps {
  /** The page's answer in a sentence or two, built from the same figures */
  takeaway?: string[];
  figures: KeyFigure[];
  /** With an odd number of tiles, center the last one on its own row on phones and tablets */
  centerLastTile?: boolean;
}

/** The headline numbers at the top of a State subpage, so the answer isn't only inside a chart. */
const KeyFigures: React.FC<KeyFiguresProps> = ({ takeaway = [], figures, centerLastTile }) => (
  <Box component="section" aria-label="Key figures" sx={{ mb: 4 }}>
    {takeaway.length > 0 && (
      <Box sx={{ mb: 2, maxWidth: READING_WIDTH }}>
        {takeaway.map(sentence => (
          <Typography key={sentence} variant="body1" sx={{ mb: 0.5 }}>{keepYearsTogether(sentence)}</Typography>
        ))}
      </Box>
    )}
    {figures.length > 0 && (
      <MetricGrid count={figures.length} centerLastTile={centerLastTile}>
        {figures.map(figure => <MetricTile key={figure.label} {...figure} />)}
      </MetricGrid>
    )}
  </Box>
);

export default KeyFigures;
