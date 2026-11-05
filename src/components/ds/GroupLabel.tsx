import React from 'react';
import { Typography } from '@mui/material';
import { type } from '@/theme/tokens';

/** The small uppercase label over a group of tiles ("SCHOOLS"); an h3 under a section heading. */
const GroupLabel: React.FC<{ children: React.ReactNode; component?: React.ElementType }> = ({ children, component = 'h3' }) => (
  <Typography component={component} sx={{ ...type.groupLabel, color: 'text.secondary', m: 0, mb: 1.25 }}>
    {children}
  </Typography>
);

export default GroupLabel;
