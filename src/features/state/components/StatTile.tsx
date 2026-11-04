import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Card, CardActionArea, CardContent, Divider, Typography } from '@mui/material';
import { Line, LineChart, ReferenceDot, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { formatSchoolYear, YearValue } from '../utils/stateMetrics';
import { SERIES_COLORS } from './TrendChart';
import { keepYearsTogether } from './chartText';

// A sparkline's vertical range is at least this wide around the latest value, so a one-point
// change in a rate doesn't look like a cliff: 10 points for rates, 15% of the value for amounts
const MIN_RATE_RANGE = 10;
const MIN_AMOUNT_RANGE = 0.15;
const HISTORY_COLOR = '#9e9e9e';

interface StatTileProps {
  label: string;
  value: string;
  /** When the value is from, e.g. "2024-25" or "Class of 2025" */
  period?: string;
  /** Plain-language change, e.g. "Down 12% since 2014-15" */
  change?: string;
  detail?: string;
  /** Small trend line under the value; the full chart is on the linked page */
  trend?: YearValue[];
  /** 'rate' for percentages (range at least 10 points), 'amount' for counts and dollars */
  trendScale?: 'rate' | 'amount';
  trendYearLabel?: (year: number) => string;
  to?: string;
  /** What the link opens, e.g. "enrollment" gives "See enrollment →" */
  linkLabel?: string;
}

const sparklineDomain = (trend: YearValue[], scale: 'rate' | 'amount'): [number, number] => {
  const values = trend.map(point => point.value);
  const latest = trend[trend.length - 1].value;
  const range = scale === 'rate' ? MIN_RATE_RANGE : Math.abs(latest) * MIN_AMOUNT_RANGE;
  return [Math.min(Math.min(...values), latest - range), Math.max(Math.max(...values), latest + range)];
};

const TileBody: React.FC<StatTileProps> = ({
  label, value, period, change, detail, trend, trendScale = 'amount', trendYearLabel = formatSchoolYear, to, linkLabel,
}) => {
  const last = trend && trend.length > 1 ? trend[trend.length - 1] : null;
  return (
    <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } }, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Two lines kept for the label and one for the period, so tiles in a row line up */}
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' }, minHeight: '2.86em', lineHeight: 1.43 }}
      >
        {label}
      </Typography>
      <Typography component="p" sx={{ fontWeight: 600, fontSize: { xs: '1.25rem', sm: '1.5rem' }, lineHeight: 1.3 }}>{value}</Typography>
      {period && <Typography variant="body2" color="text.secondary">{keepYearsTogether(period)}</Typography>}
      {trend && last && (
        <Box aria-hidden sx={{ mt: 0.5 }}>
          <Box sx={{ height: { xs: 28, sm: 36 } }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 5, right: 6, left: 2, bottom: 5 }}>
                <XAxis hide dataKey="year" />
                <YAxis hide domain={sparklineDomain(trend, trendScale)} />
                <Line type="linear" dataKey="value" stroke={HISTORY_COLOR} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                <ReferenceDot x={last.year} y={last.value} r={3} fill={SERIES_COLORS[0]} stroke="#fff" strokeWidth={2} ifOverflow="visible" />
              </LineChart>
            </ResponsiveContainer>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{trendYearLabel(trend[0].year)}</Typography>
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{trendYearLabel(last.year)}</Typography>
          </Box>
        </Box>
      )}
      {(change || detail) && (
        <>
          <Divider sx={{ my: 1, display: { xs: 'none', sm: 'block' } }} />
          {change && <Typography variant="body2" sx={{ mt: { xs: 0.5, sm: 0 } }}>{keepYearsTogether(change)}</Typography>}
          {detail && <Typography variant="body2" color="text.secondary">{keepYearsTogether(detail)}</Typography>}
        </>
      )}
      {to && (
        <Typography variant="body2" color="primary" sx={{ fontWeight: 500, mt: 'auto', pt: 1 }}>
          See {linkLabel ?? 'details'}{'\u00a0'}<span aria-hidden>→</span>
        </Typography>
      )}
    </CardContent>
  );
};

/** One statewide figure with its year and recent change; links to the page with the full trend. */
const StatTile: React.FC<StatTileProps> = (props) => (
  <Card
    elevation={0}
    sx={{
      border: '1px solid',
      borderColor: 'grey.300',
      backgroundColor: 'background.paper',
      height: '100%',
      transition: 'border-color 120ms',
      '&:hover, &:focus-within': props.to ? { borderColor: 'primary.main' } : undefined,
    }}
  >
    {props.to ? (
      <CardActionArea component={Link} to={props.to} sx={{ height: '100%', alignItems: 'stretch', '& .MuiCardActionArea-focusHighlight': { opacity: 0 } }}>
        <TileBody {...props} />
      </CardActionArea>
    ) : (
      <TileBody {...props} />
    )}
  </Card>
);

export default StatTile;
