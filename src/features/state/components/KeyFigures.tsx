import React from 'react';
import { Box, Typography } from '@mui/material';
import StatTile from './StatTile';
import { keepYearsTogether, READING_WIDTH } from './chartText';

export interface KeyFigure {
  label: string;
  value: string;
  period?: string;
  change?: string;
  detail?: string;
}

interface KeyFiguresProps {
  /** The page's answer in a sentence or two, built from the same figures */
  takeaway?: string[];
  figures: KeyFigure[];
}

/** The headline numbers at the top of a State subpage, so the answer isn't only inside a chart. */
const KeyFigures: React.FC<KeyFiguresProps> = ({ takeaway = [], figures }) => (
  <Box component="section" aria-label="Key figures" sx={{ mb: 4 }}>
    {takeaway.length > 0 && (
      <Box sx={{ mb: 2, maxWidth: READING_WIDTH }}>
        {takeaway.map(sentence => (
          <Typography key={sentence} variant="body1" sx={{ mb: 0.5 }}>{keepYearsTogether(sentence)}</Typography>
        ))}
      </Box>
    )}
    {figures.length > 0 && (
      <Box
        sx={{
          display: 'grid',
          gap: { xs: 1, sm: 2 },
          gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: `repeat(${Math.min(figures.length, 4)}, minmax(0, 1fr))` },
        }}
      >
        {figures.map(figure => <StatTile key={figure.label} {...figure} />)}
      </Box>
    )}
  </Box>
);

export default KeyFigures;
