import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Card, CardActionArea, CardContent, Typography } from '@mui/material';
import { YearValue } from '../utils/stateMetrics';
import { SERIES_COLORS } from './TrendChart';
import { visuallyHidden } from './chartText';

// The statewide overview's tiles, as designed on the "NH Statewide Dashboard" canvas:
//   label
//   44%     ↓ 4%           [trend line]
//   25/26   Since 17/18
//   optional grey note (one line kept for it on every tile)
// The whole tile is the link; a chevron shows top right on hover and keyboard focus.
// Phone tiles drop the trend line and let the change wrap under the value.

// Green and red only where a change is generally good or bad (test scores, graduation);
// counts, spending and pay change in neutral grey
const GOOD_COLOR = '#2e7d32';
const BAD_COLOR = '#c62828';
const NEUTRAL_COLOR = 'rgba(0, 0, 0, 0.6)';
const TREND_COLOR = '#9e9e9e';
// The trend line is as tall as the value and year lines together (34 + 18 px)
const TREND_HEIGHT = 52;
// Kept clear at the top and bottom of the trend line so its stroke and end dot aren't clipped
const TREND_INSET = 3;

export interface TileDelta {
  direction: 'up' | 'down' | 'flat';
  /** Whether the change is generally good, bad, or neither; sets its color */
  tone: 'good' | 'bad' | 'neutral';
  /** Shown beside the arrow, e.g. "4%" */
  amount: string;
  /** Shown under it, e.g. "17/18" */
  since: string;
  /** The whole change in words for screen readers, e.g. "Down 4 percentage points since 2017-18" */
  spoken: string;
}

interface OverviewTileProps {
  label: string;
  /** A shorter title for phones, e.g. "Total Spending"; phones show the label when left out */
  shortLabel?: string;
  value: string;
  /** The value's year, e.g. "25/26" or "2025" */
  period: string;
  delta?: TileDelta;
  /** Grey note under the figures */
  detail?: string;
  /** A shorter note for phones; phones show the note when left out */
  shortDetail?: string;
  trend?: YearValue[];
  to: string;
  /** What the link opens, for screen readers: "test scores" ends the link with "See test scores" */
  linkLabel: string;
}

const deltaColor = (tone: TileDelta['tone']) =>
  tone === 'good' ? GOOD_COLOR : tone === 'bad' ? BAD_COLOR : NEUTRAL_COLOR;

const Arrow: React.FC<{ direction: TileDelta['direction'] }> = ({ direction }) => (
  <Box component="svg" viewBox="0 0 24 24" aria-hidden="true" sx={{ width: { xs: 20, sm: 26 }, height: { xs: 20, sm: 26 }, flexShrink: 0 }}>
    <path
      d={direction === 'up' ? 'M12 20V5M5.5 11.5L12 5l6.5 6.5' : direction === 'down' ? 'M12 4v15M5.5 12.5L12 19l6.5-6.5' : 'M5 12h14'}
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Box>
);

/** The trend line, fitted to its own data: the lowest value at the bottom, the highest at the top. */
const TrendLine: React.FC<{ trend: YearValue[] }> = ({ trend }) => {
  const values = trend.map(point => point.value);
  const low = Math.min(...values);
  const high = Math.max(...values);
  const y = (value: number) =>
    high === low ? TREND_HEIGHT / 2 : TREND_INSET + ((high - value) / (high - low)) * (TREND_HEIGHT - 2 * TREND_INSET);
  const x = (index: number) => (trend.length === 1 ? 100 : (index / (trend.length - 1)) * 100);
  const path = trend.map((point, index) => `${index ? 'L' : 'M'}${x(index).toFixed(2)},${y(point.value).toFixed(2)}`).join('');
  const lastY = y(values[values.length - 1]);
  return (
    <Box aria-hidden sx={{ display: { xs: 'none', md: 'block' }, flex: '1 1 0', minWidth: 24, height: TREND_HEIGHT, position: 'relative' }}>
      <svg viewBox={`0 0 100 ${TREND_HEIGHT}`} preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '100%', overflow: 'visible' }}>
        <path d={path} fill="none" stroke={TREND_COLOR} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      </svg>
      <Box sx={{ position: 'absolute', right: -3, top: lastY - 3, width: 6, height: 6, borderRadius: '50%', backgroundColor: SERIES_COLORS[0], boxShadow: '0 0 0 2px #fff' }} />
    </Box>
  );
};

const secondaryText = { fontSize: '0.8125rem', lineHeight: '18px', color: 'text.secondary', m: 0 } as const;
const figureText = {
  fontSize: { xs: '1.375rem', sm: '1.75rem' },
  lineHeight: { xs: '28px', sm: '34px' },
  fontWeight: 600,
  letterSpacing: '-0.3px',
  m: 0,
} as const;

/** One statewide figure with its year, its change and a trend line; links to the page with the full trend. */
const OverviewTile: React.FC<OverviewTileProps> = ({ label, shortLabel, value, period, delta, detail, shortDetail, trend, to, linkLabel }) => (
  <Card
    elevation={0}
    sx={{
      height: '100%',
      border: '1px solid',
      borderColor: 'grey.300',
      borderRadius: 2,
      backgroundColor: 'background.paper',
      transition: 'border-color 120ms',
      '&:hover, &:focus-within': { borderColor: 'primary.main' },
      '&:hover .tile-chevron, &:focus-within .tile-chevron': { opacity: 1 },
    }}
  >
    <CardActionArea component={Link} to={to} sx={{ height: '100%', alignItems: 'stretch', position: 'relative', '& .MuiCardActionArea-focusHighlight': { opacity: 0 } }}>
      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } }, fontVariantNumeric: 'tabular-nums' }}>
        {/* Two lines kept for the label, so tiles in a row line up */}
        <Typography
          component="p"
          sx={{ m: 0, pr: { sm: 3 }, fontWeight: 500, fontSize: { xs: '0.9375rem', sm: '1rem' }, lineHeight: { xs: '20px', sm: '22px' }, minHeight: { xs: 40, sm: 44 }, color: 'text.secondary' }}
        >
          {shortLabel ? (
            <>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{label}</Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>{shortLabel}</Box>
            </>
          ) : label}
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: { xs: 'wrap', md: 'nowrap' }, alignItems: 'flex-start', columnGap: 1.5, rowGap: 0.5, mt: 0.5 }}>
          <Box>
            <Typography component="p" sx={{ ...figureText, color: 'text.primary' }}>{value}</Typography>
            <Typography component="p" sx={secondaryText}>{period}</Typography>
          </Box>
          {delta && (
            <Box>
              <Typography component="p" sx={{ ...figureText, display: 'flex', alignItems: 'center', gap: '2px', color: deltaColor(delta.tone), whiteSpace: 'nowrap' }}>
                <Arrow direction={delta.direction} />
                <span aria-hidden>{delta.amount}</span>
                <Box component="span" sx={visuallyHidden}>{delta.spoken}</Box>
              </Typography>
              <Typography component="p" aria-hidden sx={{ ...secondaryText, whiteSpace: 'nowrap' }}>Since {delta.since}</Typography>
            </Box>
          )}
          {trend && trend.length > 1 && <TrendLine trend={trend} />}
        </Box>

        {/* One line kept for the note on every tile, so tiles line up whether or not they have one */}
        <Typography component="p" sx={{ ...secondaryText, mt: 1, minHeight: 18 }}>
          {shortDetail ? (
            <>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{detail}</Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>{shortDetail}</Box>
            </>
          ) : detail}
        </Typography>

        <Box component="span" sx={visuallyHidden}>See {linkLabel}</Box>
      </CardContent>

      <Box
        component="svg"
        className="tile-chevron"
        viewBox="0 0 24 24"
        aria-hidden="true"
        sx={{ display: { xs: 'none', sm: 'block' }, position: 'absolute', top: 14, right: 12, width: 20, height: 20, color: 'primary.main', opacity: 0, transition: 'opacity 120ms' }}
      >
        <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      </Box>
    </CardActionArea>
  </Card>
);

export default OverviewTile;
