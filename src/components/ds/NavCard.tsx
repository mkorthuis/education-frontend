import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Card, CardActionArea, CardContent, Typography } from '@mui/material';
import { color, radius } from '@/theme/tokens';

interface NavCardProps {
  title: string;
  description?: string;
  to: string;
  /** Heading level of the title; an h3 under the page's sections */
  component?: React.ElementType;
}

/** A grey card that opens another page: a dark title and a one-line description, no arrow. */
export const NavCard: React.FC<NavCardProps> = ({ title, description, to, component = 'h3' }) => (
  <Card
    elevation={0}
    sx={{
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: radius.card,
      backgroundColor: color.surfaceSubtle,
      color: 'text.primary',
      transition: 'background-color 120ms',
      '&:hover, &:focus-within': { backgroundColor: color.surfaceSubtleHover },
    }}
  >
    <CardActionArea component={Link} to={to} sx={{ height: '100%', '& .MuiCardActionArea-focusHighlight': { opacity: 0 } }}>
      {/* Tighter on phones, so a column of them doesn't push the page's figures down */}
      <CardContent sx={{ px: { xs: 1.5, sm: 2 }, py: { xs: 1, sm: 2 }, '&:last-child': { pb: { xs: 1, sm: 2 } } }}>
        <Typography component={component} sx={{ fontWeight: 600, fontSize: { xs: '0.9375rem', sm: '1rem' }, lineHeight: { xs: '20px', sm: 1.5 }, color: 'text.primary', m: 0 }}>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' }, lineHeight: { xs: '18px', sm: 1.43 } }}>
            {description}
          </Typography>
        )}
      </CardContent>
    </CardActionArea>
  </Card>
);

/** One column on phones, two on tablets, four on wide screens. */
export const NavCardGrid: React.FC<{ children: React.ReactNode; label?: string }> = ({ children, label }) => (
  <Box
    component={label ? 'nav' : 'div'}
    aria-label={label}
    sx={{ display: 'grid', gap: { xs: 0.75, sm: 2 }, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }, mb: 4 }}
  >
    {children}
  </Box>
);

export default NavCard;
