import React from 'react';
import { Box, Typography } from '@mui/material';
import { color, radius, READING_WIDTH } from '@/theme/tokens';

/** An aside set off from the page ("Not on this page"): a light grey panel, a bold title, short text. */
const Note: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Box component="aside" sx={{ p: 2, maxWidth: READING_WIDTH, borderRadius: radius.card, backgroundColor: color.surfaceSubtle }}>
    <Typography variant="body2" component="h2" sx={{ fontWeight: 600, mb: 0.5 }}>{title}</Typography>
    <Typography variant="body2" component="div">{children}</Typography>
  </Box>
);

export default Note;
