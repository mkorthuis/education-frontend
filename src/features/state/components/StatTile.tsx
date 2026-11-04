import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Card, CardActionArea, CardContent, Divider, Typography } from '@mui/material';
import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts';
import { YearValue } from '../utils/stateMetrics';
import { SERIES_COLORS } from './TrendChart';

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
  to?: string;
}

const TileBody: React.FC<StatTileProps> = ({ label, value, period, change, detail, trend }) => (
  <CardContent sx={{ py: 2, px: 2, '&:last-child': { pb: 2 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
      <Typography variant="h5" component="p" sx={{ fontWeight: 'bold' }}>{value}</Typography>
      {period && <Typography variant="body2" color="text.secondary">{period}</Typography>}
    </Box>
    {trend && trend.length > 1 && (
      <Box sx={{ height: 36, my: 0.5 }} aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
            <YAxis hide domain={['dataMin', 'dataMax']} />
            <Line type="linear" dataKey="value" stroke={SERIES_COLORS[0]} strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    )}
    {(change || detail) && (
      <>
        <Divider sx={{ my: 1 }} />
        {change && <Typography variant="body2">{change}</Typography>}
        {detail && <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>{detail}</Typography>}
      </>
    )}
  </CardContent>
);

/** One statewide figure with its year and recent change; links to the page with the full trend. */
const StatTile: React.FC<StatTileProps> = (props) => (
  <Card sx={{ border: '1px solid', borderColor: 'divider', backgroundColor: 'grey.100', height: '100%' }} elevation={0}>
    {props.to ? (
      <CardActionArea component={Link} to={props.to} sx={{ height: '100%', alignItems: 'stretch' }}>
        <TileBody {...props} />
      </CardActionArea>
    ) : (
      <TileBody {...props} />
    )}
  </Card>
);

export default StatTile;
