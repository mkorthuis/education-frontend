import React, { useState } from 'react';
import { Box, Button, ToggleButton, ToggleButtonGroup, Typography, useMediaQuery, useTheme } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import { YearRow } from '../utils/stateMetrics';
import { downloadCsv } from '../utils/csv';
import StateTable from './StateTable';

// Categorical slots in fixed order (validated for color-vision deficiency as adjacent pairs).
// Charts here use at most four series; longer breakdowns go in a table.
export const SERIES_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100'];

const MAX_MOBILE_DOTS = 8;

export interface TrendSeries {
  key: string;
  name: string;
}

interface TrendChartProps {
  title: string;
  subtitle?: string;
  data: YearRow[];
  series: TrendSeries[];
  /** Tooltip and table values */
  format: (value: number) => string;
  /** Y-axis ticks; defaults to `format` */
  axisFormat?: (value: number) => string;
  yDomain?: [number | 'auto' | 'dataMin', number | 'auto' | 'dataMax'];
  /** Vertical markers, e.g. the years the state changed its test */
  markers?: { year: number; label: string }[];
  note?: string;
  csvName: string;
  yearLabel?: (year: number) => string;
  yearHeader?: string;
}

const defaultYearLabel = (year: number) => formatFiscalYear(year) ?? String(year);

const ChartTooltip = ({ active, payload, label, format }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <Box sx={{ backgroundColor: 'background.paper', p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1, boxShadow: 1 }}>
      <Typography variant="subtitle2" gutterBottom>{label}</Typography>
      {payload.filter((entry: any) => entry.value !== null && entry.value !== undefined).map((entry: any) => (
        <Box key={entry.dataKey} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: entry.color, flexShrink: 0 }} />
          <Typography variant="body2">{entry.name}: {format(entry.value)}</Typography>
        </Box>
      ))}
    </Box>
  );
};

const TrendChart: React.FC<TrendChartProps> = ({
  title,
  subtitle,
  data,
  series,
  format,
  axisFormat,
  yDomain = [0, 'auto'],
  markers = [],
  note,
  csvName,
  yearLabel = defaultYearLabel,
  yearHeader = 'Year',
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const chartData = data.map(row => ({ ...row, label: yearLabel(row.year) }));
  const tableRows = [...data].reverse();
  // On a phone, markers on a long series crowd together and make the line look dashed
  const showDots = !isMobile || data.length <= MAX_MOBILE_DOTS;

  const handleDownload = () => {
    downloadCsv(csvName, [yearHeader, ...series.map(entry => entry.name)], data.map(row => [yearLabel(row.year), ...series.map(entry => row[entry.key])]));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>{title}</Typography>
          {subtitle && (
            <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>{subtitle}</Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={view}
            onChange={(_event, next) => next && setView(next)}
            aria-label={`${title} view`}
          >
            <ToggleButton value="chart" sx={{ py: 0.25, px: 1, textTransform: 'none' }}>Chart</ToggleButton>
            <ToggleButton value="table" sx={{ py: 0.25, px: 1, textTransform: 'none' }}>Table</ToggleButton>
          </ToggleButtonGroup>
          <Button size="small" startIcon={<DownloadIcon fontSize="small" />} onClick={handleDownload} disabled={!data.length}>
            CSV
          </Button>
        </Box>
      </Box>

      {view === 'table' ? (
        <StateTable
          columns={[
            { key: 'year', label: yearHeader, format: row => yearLabel(row.year) },
            ...series.map(entry => ({
              key: entry.key,
              label: entry.name,
              align: 'right' as const,
              format: (row: YearRow) => (row[entry.key] === null || row[entry.key] === undefined ? '—' : format(row[entry.key] as number)),
            })),
          ]}
          rows={tableRows}
        />
      ) : (
        <Box sx={{ height: isMobile ? 280 : 340, width: '100%' }}>
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 16, right: 16, left: isMobile ? 0 : 8, bottom: 4 }}>
                <CartesianGrid stroke={theme.palette.grey[200]} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: theme.typography.body2.fontSize, fill: theme.palette.text.secondary }}
                  axisLine={{ stroke: theme.palette.grey[300] }}
                  tickLine={false}
                  minTickGap={12}
                />
                <YAxis
                  domain={yDomain}
                  tickFormatter={axisFormat ?? format}
                  tick={{ fontSize: theme.typography.body2.fontSize, fill: theme.palette.text.secondary }}
                  axisLine={false}
                  tickLine={false}
                  width={isMobile ? 56 : 72}
                />
                <Tooltip content={<ChartTooltip format={format} />} cursor={{ stroke: theme.palette.grey[400], strokeWidth: 1 }} />
                {series.length > 1 && <Legend wrapperStyle={{ fontSize: theme.typography.body2.fontSize, color: theme.palette.text.primary }} />}
                {markers.filter(marker => data.some(row => row.year === marker.year)).map(marker => (
                  <ReferenceLine
                    key={marker.year}
                    x={yearLabel(marker.year)}
                    stroke={theme.palette.grey[400]}
                    label={{ value: marker.label, position: 'insideTopLeft', fontSize: 12, fill: theme.palette.text.secondary }}
                  />
                ))}
                {series.map((entry, index) => (
                  <Line
                    key={entry.key}
                    type="linear"
                    dataKey={entry.key}
                    name={entry.name}
                    stroke={SERIES_COLORS[index % SERIES_COLORS.length]}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    dot={showDots ? { r: 4, strokeWidth: 2, stroke: theme.palette.background.paper, fill: SERIES_COLORS[index % SERIES_COLORS.length] } : false}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: theme.palette.background.paper }}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body1" color="text.secondary">No data available</Typography>
            </Box>
          )}
        </Box>
      )}

      {note && (
        <Typography variant="caption" component="p" sx={{ color: 'text.secondary', mt: 1 }}>{note}</Typography>
      )}
    </Box>
  );
};

export default TrendChart;
