import React from 'react';
import { Box, Typography } from '@mui/material';

// Shared type for chart and table headers and notes on the State pages:
// title 17px/600 > subtitle and notes 14px > axis ticks 12px. Prose stops at about 75 characters.
export const READING_WIDTH = 720;

// Strings, not numbers: in sx, width: 1 would mean 100% and m: -1 would mean -8px
export const visuallyHidden = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const;

/** Text with each school year ("2014-15") kept on one line, so it doesn't break at the hyphen. */
export const keepYearsTogether = (text: string | undefined): React.ReactNode => {
  if (!text) return text;
  const parts = text.split(/(\d{4}-\d{2})/);
  if (parts.length === 1) return text;
  return parts.map((part, index) => (index % 2 === 1
    ? <Box component="span" key={index} sx={{ whiteSpace: 'nowrap' }}>{part}</Box>
    : part));
};

interface ChartHeaderProps {
  title: string;
  subtitle?: string;
  titleId?: string;
  /** Heading level; chart and table titles sit under the page's h1 */
  component?: React.ElementType;
  actions?: React.ReactNode;
}

export const ChartHeader: React.FC<ChartHeaderProps> = ({ title, subtitle, titleId, component = 'h2', actions }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', columnGap: 2, rowGap: 1, mb: 1.5, flexWrap: 'wrap' }}>
    <Box sx={{ flex: 1, minWidth: 200 }}>
      <Typography id={titleId} component={component} sx={{ fontSize: '1.0625rem', fontWeight: 600, lineHeight: 1.4, m: 0 }}>
        {title}
      </Typography>
      {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
    </Box>
    {actions && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{actions}</Box>}
  </Box>
);

export const ChartNote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography variant="body2" component="p" sx={{ color: 'text.secondary', mt: 1, maxWidth: READING_WIDTH }}>
    {children}
  </Typography>
);
