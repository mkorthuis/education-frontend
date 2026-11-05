import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Card, CardActionArea, CardContent, Typography } from '@mui/material';
import { color, radius, series, space, type } from '@/theme/tokens';
import { visuallyHidden } from './visuallyHidden';

// One figure, the site's key-figure tile:
//   Label                                  ›  (linked tiles, on hover and keyboard focus)
//   44%     ↓ 4%           [trend line]
//   25/26   Since 17/18
//   optional grey note (tiles in a row stretch to the same height, so a row with no notes
//   keeps no space for one)
// Only the arrow and change carry color: green where the change is good, red where it's bad,
// grey where it's neither. Phone tiles drop the trend line and let the change wrap under the value.

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

export interface MetricTileProps {
  label: string;
  /** A shorter title for phones, e.g. "Total Spending"; phones show the label when left out */
  shortLabel?: string;
  value: string;
  /** A shorter value for phones, e.g. "149K"; phones show the value when left out */
  shortValue?: string;
  /** The value's year, e.g. "25/26" or "2025" */
  period: string;
  delta?: TileDelta;
  /** Grey note under the figures */
  detail?: string;
  /** A shorter note for phones; phones show the note when left out */
  shortDetail?: string;
  trend?: { year: number; value: number }[];
  /** The page with the full trend; the whole tile becomes the link */
  to?: string;
  /** What the link opens, for screen readers: "test scores" ends the link with "See test scores" */
  linkLabel?: string;
}

const deltaColor = (tone: TileDelta['tone']) => (tone === 'good' ? color.good : tone === 'bad' ? color.bad : color.neutral);

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
const TrendLine: React.FC<{ trend: { year: number; value: number }[] }> = ({ trend }) => {
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
        <path d={path} fill="none" stroke={color.trend} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      </svg>
      <Box sx={{ position: 'absolute', right: -3, top: lastY - 3, width: 6, height: 6, borderRadius: '50%', backgroundColor: series[0], boxShadow: `0 0 0 2px ${color.surface}` }} />
    </Box>
  );
};

/** Two versions of a piece of text: the full one from tablets up, the short one on phones. */
const Responsive: React.FC<{ full?: string; short?: string }> = ({ full, short }) =>
  short ? (
    <>
      <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{full}</Box>
      <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>{short}</Box>
    </>
  ) : <>{full}</>;

const captionText = { ...type.caption, color: 'text.secondary', m: 0 } as const;

const TileBody: React.FC<MetricTileProps> = ({ label, shortLabel, value, shortValue, period, delta, detail, shortDetail, trend, to, linkLabel }) => (
  <CardContent sx={{ p: space.tilePadding, '&:last-child': { pb: space.tilePadding }, fontVariantNumeric: 'tabular-nums' }}>
    {/* Two lines kept for the label from tablets up, so tiles in a row line up; phones use the
        short labels, which fit on one line */}
    <Typography component="p" sx={{ ...type.tileLabel, m: 0, pr: to ? { sm: 3 } : 0, minHeight: { xs: 0, sm: 44 }, color: 'text.secondary' }}>
      <Responsive full={label} short={shortLabel} />
    </Typography>

    <Box sx={{ display: 'flex', flexWrap: { xs: 'wrap', md: 'nowrap' }, alignItems: 'flex-start', columnGap: 1.5, rowGap: 0.5, mt: 0.5 }}>
      <Box>
        <Typography component="p" sx={{ ...type.figure, m: 0, color: 'text.primary' }}>
          <Responsive full={value} short={shortValue} />
        </Typography>
        <Typography component="p" sx={captionText}>{period}</Typography>
      </Box>
      {delta && (
        <Box>
          <Typography component="p" sx={{ ...type.figure, m: 0, display: 'flex', alignItems: 'center', gap: '2px', color: deltaColor(delta.tone), whiteSpace: 'nowrap' }}>
            <Arrow direction={delta.direction} />
            <span aria-hidden>{delta.amount}</span>
            <Box component="span" sx={visuallyHidden}>{delta.spoken}</Box>
          </Typography>
          <Typography component="p" aria-hidden sx={{ ...captionText, whiteSpace: 'nowrap' }}>Since {delta.since}</Typography>
        </Box>
      )}
      {trend && trend.length > 1 && <TrendLine trend={trend} />}
    </Box>

    {detail && (
      <Typography component="p" sx={{ ...captionText, mt: 1 }}>
        <Responsive full={detail} short={shortDetail} />
      </Typography>
    )}

    {to && <Box component="span" sx={visuallyHidden}>See {linkLabel ?? 'details'}</Box>}
  </CardContent>
);

/** One figure with its year, its change and an optional trend line; links to its page when given `to`. */
const MetricTile: React.FC<MetricTileProps> = (props) => (
  <Card
    elevation={0}
    sx={{
      height: '100%',
      border: '1px solid',
      borderColor: color.border,
      borderRadius: radius.card,
      backgroundColor: color.surface,
      transition: 'border-color 120ms',
      ...(props.to && {
        '&:hover, &:focus-within': { borderColor: 'primary.main' },
        '&:hover .tile-chevron, &:focus-within .tile-chevron': { opacity: 1 },
      }),
    }}
  >
    {props.to ? (
      <CardActionArea component={Link} to={props.to} sx={{ height: '100%', alignItems: 'stretch', position: 'relative', '& .MuiCardActionArea-focusHighlight': { opacity: 0 } }}>
        <TileBody {...props} />
        {/* The whole tile is the link; a chevron shows it on hover and keyboard focus */}
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
    ) : (
      <TileBody {...props} />
    )}
  </Card>
);

export default MetricTile;
