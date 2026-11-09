import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Card, CardActionArea, CardContent, SxProps, Theme, Tooltip, Typography } from '@mui/material';
import { color, radius } from '@/theme/tokens';
import { visuallyHidden } from './visuallyHidden';

interface NavCardProps {
  title: string;
  description?: string;
  to: string;
  /** Heading level of the title; an h3 under the page's sections */
  component?: React.ElementType;
  /** Greyed out and not a link, like a disabled tab, for a page with nothing to show here */
  disabled?: boolean;
  /** Why it's greyed out: a tooltip, and read with the card by screen readers */
  disabledReason?: string;
  /**
   * The title at the left, wrapping if it must, and the description at the right (a school and its
   * grades); as tall as a standard card, so the two kinds line up side by side
   */
  inline?: boolean;
}

// A standard card's content height, padding included: the title line (20px on phones, 24px wider)
// and the description line (18px, 20px), so an inline card matches it
const STANDARD_HEIGHT = { xs: 8 + 20 + 18 + 8, sm: 16 + 24 + 20 + 16 };

/**
 * A grey card that opens another page: a dark title and a one-line description, no arrow. A
 * disabled card stays in its place, faded as the section tabs fade a disabled tab.
 */
export const NavCard: React.FC<NavCardProps> = ({ title, description, to, component = 'h3', disabled = false, disabledReason, inline = false }) => {
  // Tighter on phones, so a column of them doesn't push the page's figures down
  const content = (
    <CardContent
      sx={{
        px: { xs: 1.5, sm: 2 },
        py: { xs: 1, sm: 2 },
        '&:last-child': { pb: { xs: 1, sm: 2 } },
        // Inline: centered in a standard card's height; a two-line title still fits it
        ...(inline && { display: 'flex', alignItems: 'center', justifyContent: 'space-between', columnGap: 1.5, boxSizing: 'border-box', minHeight: STANDARD_HEIGHT }),
      }}
    >
      <Typography
        component={component}
        sx={{ fontWeight: 600, fontSize: { xs: '0.9375rem', sm: '1rem' }, lineHeight: inline ? '20px' : { xs: '20px', sm: 1.5 }, color: 'text.primary', m: 0, ...(inline && { minWidth: 0 }) }}
      >
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' }, lineHeight: { xs: '18px', sm: 1.43 }, ...(inline && { flexShrink: 0, whiteSpace: 'nowrap' }) }}>
          {description}
        </Typography>
      )}
      {disabled && disabledReason && <Box component="span" sx={visuallyHidden}>{disabledReason}</Box>}
    </CardContent>
  );
  const card = (
    <Card
      elevation={0}
      aria-disabled={disabled || undefined}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: radius.card,
        backgroundColor: color.surfaceSubtle,
        color: 'text.primary',
        ...(disabled
          ? { opacity: 0.6, cursor: 'not-allowed' }
          : { transition: 'background-color 120ms', '&:hover, &:focus-within': { backgroundColor: color.surfaceSubtleHover } }),
      }}
    >
      {disabled ? content : (
        <CardActionArea component={Link} to={to} sx={{ height: '100%', '& .MuiCardActionArea-focusHighlight': { opacity: 0 } }}>
          {content}
        </CardActionArea>
      )}
    </Card>
  );
  if (!disabled || !disabledReason) return card;
  // The wrapper fills the grid cell, so the card keeps its row's height
  return (
    <Tooltip title={disabledReason} arrow describeChild>
      <Box sx={{ display: 'grid' }}>{card}</Box>
    </Tooltip>
  );
};

/** One column on phones, two on tablets, four on wide screens (two in a half-width column). */
export const NavCardGrid: React.FC<{ children: React.ReactNode; label?: string; wideColumns?: 2 | 4; sx?: SxProps<Theme> }> = ({ children, label, wideColumns = 4, sx }) => (
  <Box
    component={label ? 'nav' : 'div'}
    aria-label={label}
    sx={[
      { display: 'grid', gap: { xs: 0.75, sm: 2 }, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: `repeat(${wideColumns}, minmax(0, 1fr))` }, mb: 4 },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    {children}
  </Box>
);

export default NavCard;
