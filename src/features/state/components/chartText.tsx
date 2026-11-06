import React from 'react';
import { Box, Typography } from '@mui/material';
import { READING_WIDTH, type } from '@/theme/tokens';

// Shared type for chart and table headers and notes on the State pages (sizes in @/theme/tokens):
// title 17px/600 > subtitle and notes 14px > axis ticks 12px. Prose stops at about 75 characters.
export { READING_WIDTH };
export { visuallyHidden } from '@/components/ds';

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
  /** A shorter title for phones; phones show the title when left out */
  shortTitle?: string;
  subtitle?: string;
  /** A shorter subtitle for phones */
  shortSubtitle?: string;
  /** Leave the subtitle off on phones, where it only restates the title */
  hideSubtitleOnPhone?: boolean;
  titleId?: string;
  /** Heading level; chart and table titles sit under the page's h1 */
  component?: React.ElementType;
  actions?: React.ReactNode;
}

export const ChartHeader: React.FC<ChartHeaderProps> = ({ title, shortTitle, subtitle, shortSubtitle, hideSubtitleOnPhone = false, titleId, component = 'h2', actions }) => (
  // A title on its own is centered on the picker or buttons beside it; with a subtitle, the two lines
  // start at the top
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: subtitle ? 'flex-start' : 'center', columnGap: 2, rowGap: 1, mb: 1.5, flexWrap: 'wrap' }}>
    <Box sx={{ flex: 1, minWidth: { xs: 140, sm: 200 } }}>
      <Typography id={titleId} component={component} sx={{ ...type.chartTitle, m: 0 }}>
        {shortTitle ? (
          <>
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{title}</Box>
            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>{shortTitle}</Box>
          </>
        ) : title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={hideSubtitleOnPhone ? { display: { xs: 'none', sm: 'block' } } : undefined}>
          {shortSubtitle ? (
            <>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{subtitle}</Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>{shortSubtitle}</Box>
            </>
          ) : subtitle}
        </Typography>
      )}
    </Box>
    {/* As tall as a dropdown, so buttons line up across charts side by side whether or not one has a picker */}
    {actions && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: 40 }}>{actions}</Box>}
  </Box>
);

export const ChartNote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography variant="body2" component="p" sx={{ color: 'text.secondary', mt: 1, maxWidth: READING_WIDTH }}>
    {children}
  </Typography>
);
