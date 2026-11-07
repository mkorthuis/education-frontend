import React, { useId, useMemo, useRef, useState } from 'react';
import { Box, Button, ToggleButton, ToggleButtonGroup, Typography, useMediaQuery, useTheme } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Customized,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AxisMode, formatSchoolYear, niceAxis, YearRow } from '../utils/stateMetrics';
import { downloadCsv } from '../utils/csv';
import { useElementWidth } from '../hooks/useElementWidth';
import StateTable from './StateTable';
import { ChartHeader, ChartNote, visuallyHidden } from './chartText';

// Categorical slots in fixed order (validated for color-vision deficiency as adjacent pairs).
// Charts here use at most four series; longer breakdowns go in a table.
export const SERIES_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100'];

// One color per entity across the section, so "Elementary" or "Reading" looks the same on every chart
export const ENTITY_COLORS = {
  total: SERIES_COLORS[0],
  elementary: SERIES_COLORS[1],
  middle: SERIES_COLORS[2],
  high: SERIES_COLORS[3],
  math: SERIES_COLORS[0],
  reading: SERIES_COLORS[1],
  science: SERIES_COLORS[2],
  adjusted: SERIES_COLORS[2],
  teachers: SERIES_COLORS[0],
  otherStaff: SERIES_COLORS[1],
};

// A gray line for the comparison a chart is measured against (e.g. students, on the spending chart);
// dark enough for 4.5:1 on white, and gray has no hue to confuse with the categorical colors
export const CONTEXT_COLOR = '#767676';

// Dots on every point up to this many years; longer series get a dot on the last point only
const MAX_DOTS = 12;
const MAX_MOBILE_DOTS = 8;
// Direct labels at the end of each line need room on the right
const DIRECT_LABEL_MIN_WIDTH = 560;
const DIRECT_LABEL_GAP = 14;
const MAX_LABEL_DRIFT = 10;
const LABEL_CHAR_WIDTH = 6.6;

export interface TrendSeries {
  key: string;
  name: string;
  /** Label at the end of the line, when the name is long */
  shortName?: string;
  /** The legend's name on phones, when the name is too long for a phone's legend */
  phoneName?: string;
  color?: string;
  /** A dashed line, for a comparison drawn in the same color as the line it's compared with */
  dashed?: boolean;
  /** Overrides the chart's format, e.g. a count column next to percentages in the table */
  format?: (value: number) => string;
  /** Leave the series' column out of the table view on phones, e.g. a rate beside its count */
  hideOnPhone?: boolean;
}

interface TrendChartProps {
  title: string;
  /** A shorter title for phones */
  shortTitle?: string;
  subtitle?: string;
  /** A shorter subtitle for phones */
  shortSubtitle?: string;
  /** Leave the subtitle off on phones */
  hideSubtitleOnPhone?: boolean;
  /** The legend under the plot instead of over it, e.g. so a chart lines up with one beside it that has none */
  legendBelow?: boolean;
  /** A control shown before the chart's buttons, e.g. a picker for what the chart counts */
  control?: React.ReactNode;
  /** Offer the Chart/Table toggle (default on) */
  showViewToggle?: boolean;
  data: YearRow[];
  series: TrendSeries[];
  /** Tooltip and table values */
  format: (value: number) => string;
  /** Y-axis ticks; defaults to `format` */
  axisFormat?: (value: number) => string;
  /** 'zero' (default) starts at zero; 'fit' a little under the lowest value; 'span' at the lowest value */
  axis?: AxisMode;
  /** A fixed y range, e.g. [0, 100] for percentages */
  yDomain?: [number, number];
  /** Exact y-axis ticks, lowest first, when the automatic steps leave the line too flat; the axis runs from the first to the last */
  yTicks?: number[];
  /** Extra values the axis must cover, so it doesn't move when a toggle changes the data */
  axisIncludes?: number[];
  /** Lines: one line per series. Share: one 100% stacked column per year. */
  kind?: 'line' | 'share';
  /** Vertical markers, e.g. the years the state changed its test */
  markers?: { year: number; label: string }[];
  /** Shaded spans between two years, e.g. remote school */
  bands?: { from: number; to: number; label: string }[];
  /** Years where the lines start over (values before and after aren't comparable) */
  breaks?: number[];
  /** Columns shown only in the table view and CSV */
  tableSeries?: TrendSeries[];
  /** A comparison shown in the tooltip and table, e.g. all students when a student group is chosen */
  compare?: { data: YearRow[]; label: string };
  note?: React.ReactNode;
  /** File name for the chart's CSV download; no CSV button without one */
  csvName?: string;
  /** Unit added to the CSV column headers, e.g. "% change from 2014-15" */
  csvUnit?: string;
  yearLabel?: (year: number) => string;
  yearHeader?: string;
  /** Order the legend by each line's latest value, for lists with no natural order (plans, sources) */
  legendByValue?: boolean;
}

const eraKey = (key: string, era: number) => `${key}__${era}`;

const roundForCsv = (value: number | null | undefined) =>
  value === null || value === undefined ? null : Number.isInteger(value) ? value : Number(value.toFixed(2));

const ChartTooltip = ({ active, payload, label, format, series, compareByYear, compareLabel }: any) => {
  if (!active || !payload || !payload.length) return null;
  const year = payload[0]?.payload?.year;
  const comparison = compareByYear?.get(year);
  const entries = (series as TrendSeries[])
    .map(entry => ({
      entry,
      item: payload.find((item: any) => (item.dataKey === entry.key || String(item.dataKey).startsWith(`${entry.key}__`))
        && item.value !== null && item.value !== undefined),
    }))
    .filter(({ item }) => item);
  if (!entries.length) return null;
  return (
    <Box sx={{ backgroundColor: 'background.paper', p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1, boxShadow: 1 }}>
      <Typography variant="subtitle2" gutterBottom>{label}</Typography>
      {entries.map(({ entry, item }) => (
        <Box key={entry.key} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: entry.color, flexShrink: 0 }} />
          <Typography variant="body2">
            {entry.name}: {format(item.value)}
            {comparison && typeof comparison[entry.key] === 'number' && (
              <Box component="span" sx={{ color: 'text.secondary' }}> ({compareLabel}: {format(comparison[entry.key])})</Box>
            )}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

/** Series names at the right end of each line, nudged apart so they don't overlap. */
const EndLabels = (props: any) => {
  const { formattedGraphicalItems, series, color, offset } = props;
  if (!formattedGraphicalItems) return null;
  const ends = (series as TrendSeries[]).map(entry => {
    const items = formattedGraphicalItems.filter((item: any) => {
      const key = String(item.props?.dataKey ?? item.item?.props?.dataKey ?? '');
      return key === entry.key || key.startsWith(`${entry.key}__`);
    });
    const points = items
      .flatMap((item: any) => item.props?.points ?? [])
      .filter((point: any) => point.value !== null && point.value !== undefined && typeof point.y === 'number');
    const last = points.reduce((latest: any, point: any) => (!latest || point.x > latest.x ? point : latest), null);
    return last ? { name: entry.shortName ?? entry.name, x: last.x as number, y: last.y as number } : null;
  }).filter(Boolean) as { name: string; x: number; y: number }[];

  // Keep labels at least DIRECT_LABEL_GAP apart, top to bottom, within the plot
  const sorted = [...ends].sort((a, b) => a.y - b.y).map(end => ({ ...end, labelY: end.y }));
  sorted.forEach((end, index) => {
    if (index > 0) end.labelY = Math.max(end.labelY, sorted[index - 1].labelY + DIRECT_LABEL_GAP);
  });
  const bottom = (offset?.top ?? 0) + (offset?.height ?? 0);
  const overflow = sorted.length ? sorted[sorted.length - 1].labelY - bottom : 0;
  if (overflow > 0) sorted.forEach(end => { end.labelY -= overflow; });
  // Lines that end at nearly the same point can't each be labeled without a label drifting off its
  // line; the legend above the chart names them instead
  if (sorted.some(end => Math.abs(end.labelY - end.y) > MAX_LABEL_DRIFT)) return null;

  return (
    <g>
      {sorted.map(end => (
        <text key={end.name} x={end.x + 8} y={end.labelY} dy="0.35em" fontSize={12} fill={color}>{end.name}</text>
      ))}
    </g>
  );
};

/**
 * The same value for as long as its contents are the same. Recharts restarts its animation, morphing
 * from the old lines, whenever it gets a new data array, and pages build their arrays on every render.
 */
const useStableByContent = <T,>(value: T): T => {
  const ref = useRef<{ key: string; value: T }>();
  const key = JSON.stringify(value);
  if (!ref.current || ref.current.key !== key) ref.current = { key, value };
  return ref.current.value;
};

const TrendChart: React.FC<TrendChartProps> = ({
  title,
  shortTitle,
  subtitle,
  shortSubtitle,
  hideSubtitleOnPhone,
  control,
  showViewToggle = true,
  legendBelow = false,
  data,
  series,
  format,
  axisFormat,
  axis = 'zero',
  yDomain,
  yTicks,
  axisIncludes = [],
  kind = 'line',
  markers = [],
  bands = [],
  breaks = [],
  tableSeries = [],
  compare,
  note,
  csvName,
  csvUnit,
  yearLabel = formatSchoolYear,
  yearHeader = 'School year',
  legendByValue = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // Lines draw in and bars grow, like the district charts, unless the reader has asked for less motion
  const animate = !useMediaQuery('(prefers-reduced-motion: reduce)');
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const titleId = useId();
  const summaryId = useId();

  const colored = useMemo(
    () => series.map((entry, index) => ({ ...entry, color: entry.color ?? SERIES_COLORS[index % SERIES_COLORS.length] })),
    [series]
  );
  const years = useMemo(() => data.map(row => row.year), [data]);
  const breakKey = breaks.join(',');

  // Each series is split into one line per era, so nothing is drawn across a break
  const { chartData, eras } = useMemo(() => {
    const eraOf = (year: number) => breaks.filter(breakYear => year >= breakYear).length;
    const eraList = [...new Set(years.map(eraOf))];
    const rows = data.map(row => {
      const chartRow: Record<string, number | string | null> = { ...row, label: yearLabel(row.year) };
      if (breaks.length) {
        colored.forEach(entry => {
          eraList.forEach(era => { chartRow[eraKey(entry.key, era)] = eraOf(row.year) === era ? row[entry.key] ?? null : null; });
        });
      }
      return chartRow;
    });
    return { chartData: rows, eras: eraList };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, years, colored, breakKey, yearLabel]);
  const stableChartData = useStableByContent(chartData);

  const yAxis = useMemo(() => {
    if (kind === 'share') return niceAxis(0, 100, 'span');
    if (yTicks && yTicks.length > 1) {
      return { domain: [yTicks[0], yTicks[yTicks.length - 1]] as [number, number], ticks: yTicks, step: yTicks[1] - yTicks[0] };
    }
    if (yDomain) return niceAxis(yDomain[0], yDomain[1], 'span');
    const values = data
      .flatMap(row => colored.map(entry => row[entry.key]))
      .filter((value): value is number => typeof value === 'number');
    const all = [...values, ...axisIncludes];
    return all.length ? niceAxis(Math.min(...all), Math.max(...all), axis) : null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, yDomain, yTicks?.join(','), data, colored, axisIncludes, axis]);
  // Fall back to the value format when the axis format would print two ticks the same (0.5% as "1%")
  const tickFormat = useMemo(() => {
    const preferred = axisFormat ?? format;
    if (!yAxis) return preferred;
    const labels = yAxis.ticks.map(tick => preferred(tick));
    return new Set(labels).size < labels.length ? format : preferred;
  }, [axisFormat, format, yAxis]);
  const axisNote = axis === 'fit' && yAxis && yAxis.domain[0] > 0 ? `The vertical axis starts at ${tickFormat(yAxis.domain[0])}, not zero.` : null;

  const compareByYear = useMemo(() => (compare ? new Map(compare.data.map(row => [row.year, row])) : null), [compare]);

  const showLegend = colored.length > 1;
  // Labels at the ends of the lines, with room kept for them on the right, only when every line runs
  // to the last year: a line ending early would have its label in the middle of the chart
  const lastYear = years.length ? Math.max(...years) : null;
  const allEndTogether = colored.every(entry => data.some(row => row.year === lastYear && typeof row[entry.key] === 'number'));
  const directLabels = kind === 'line' && !isMobile && width >= DIRECT_LABEL_MIN_WIDTH && colored.length >= 2 && colored.length <= 4 && allEndTogether;
  const labelRoom = directLabels
    ? Math.min(150, Math.max(...colored.map(entry => (entry.shortName ?? entry.name).length)) * LABEL_CHAR_WIDTH + 16)
    : 16;
  const height = isMobile ? 280 : width >= 900 ? 400 : 340;
  const allDots = data.length <= (isMobile ? MAX_MOBILE_DOTS : MAX_DOTS);

  const lastYearOf = (key: string) => {
    for (let index = data.length - 1; index >= 0; index -= 1) {
      if (typeof data[index][key] === 'number') return data[index].year;
    }
    return null;
  };

  // Legend in series order (grades, school levels and subjects have a natural order; stacked
  // columns from the bottom up), or for unordered lists in the order the lines end, highest first,
  // so it reads like the chart
  const legendOrder = useMemo(() => {
    if (kind === 'share' || !legendByValue) return colored;
    const last = (key: string) => {
      for (let index = data.length - 1; index >= 0; index -= 1) {
        const value = data[index][key];
        if (typeof value === 'number') return value;
      }
      return -Infinity;
    };
    return [...colored].sort((a, b) => last(b.key) - last(a.key));
  }, [colored, data, kind, legendByValue]);
  const visibleMarkers = markers.filter(marker => years.includes(marker.year));
  const markerKey = [...new Set(visibleMarkers.map(marker => marker.label))].join(' / ');

  // One sentence a screen reader can use in place of the chart
  const summary = useMemo(() => {
    // With breaks, only compare within the latest era, as the chart does
    const since = breaks.filter(year => data.some(row => row.year >= year)).reduce((latest, year) => Math.max(latest, year), -Infinity);
    const parts = colored.map(entry => {
      const points = data.filter(row => typeof row[entry.key] === 'number' && row.year >= since);
      if (!points.length) return null;
      const first = points[0];
      const last = points[points.length - 1];
      return points.length === 1
        ? `${entry.name}: ${format(last[entry.key] as number)} in ${yearLabel(last.year)}`
        : `${entry.name}: ${format(first[entry.key] as number)} in ${yearLabel(first.year)} and ${format(last[entry.key] as number)} in ${yearLabel(last.year)}`;
    }).filter(Boolean);
    const sinceText = Number.isFinite(since) ? ` Since ${yearLabel(since)}, when the measure last changed:` : '';
    return `${kind === 'share' ? 'Stacked column chart' : 'Line chart'}.${sinceText} ${parts.length ? `${parts.join('. ')}.` : 'No data.'} The table view lists every year.`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colored, data, format, kind, yearLabel, breakKey]);

  const tableColumns = [...colored, ...tableSeries];
  const handleDownload = () => {
    if (!csvName) return;
    const unit = csvUnit ? ` (${csvUnit})` : '';
    const comparisonHeaders = compare ? colored.map(entry => `${entry.name}, ${compare.label}${unit}`) : [];
    downloadCsv(
      csvName,
      [yearHeader, 'End year', ...tableColumns.map(entry => `${entry.name}${unit}`), ...comparisonHeaders],
      data.map(row => [
        yearLabel(row.year),
        row.year,
        ...tableColumns.map(entry => roundForCsv(row[entry.key])),
        ...(compare ? colored.map(entry => roundForCsv(compareByYear?.get(row.year)?.[entry.key])) : []),
      ])
    );
  };

  // Every point when the series is short; otherwise only the series' last point
  const dotFor = (color: string, key: string) => {
    if (allDots) return { r: 4, strokeWidth: 2, stroke: theme.palette.background.paper, fill: color };
    const last = lastYearOf(key);
    const EndDot = (props: any) => {
      const { cx, cy, payload, index } = props;
      return payload?.year === last && typeof cy === 'number'
        ? <circle key={`${key}-${index}`} cx={cx} cy={cy} r={4} fill={color} stroke={theme.palette.background.paper} strokeWidth={2} />
        : <g key={`${key}-${index}`} />;
    };
    return EndDot;
  };

  const axisTick = { fontSize: 12, fill: theme.palette.text.secondary };

  // A single line needs no legend (the title names it), so the chart starts right under the title
  const legend = (showLegend || markerKey) ? (
    <Box component="ul" aria-hidden sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 2, rowGap: 0.5, listStyle: 'none', p: 0, m: 0, ...(legendBelow ? { mt: 1 } : { mb: 1 }), minHeight: 24 }}>
      {showLegend && legendOrder.map(entry => (
        <Box component="li" key={entry.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          {entry.dashed ? (
            <Box sx={{ width: 16, height: 0, borderTop: '3px dashed', borderColor: entry.color, flexShrink: 0 }} />
          ) : (
            <Box sx={{ width: 16, height: kind === 'share' ? 10 : 3, borderRadius: kind === 'share' ? 0.5 : 2, backgroundColor: entry.color, flexShrink: 0 }} />
          )}
          <Typography variant="body2" color="text.primary">{isMobile && entry.phoneName ? entry.phoneName : entry.name}</Typography>
        </Box>
      ))}
      {markerKey && (
        <Box component="li" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box sx={{ width: 16, height: 0, borderTop: '2px dashed', borderColor: 'grey.400', flexShrink: 0 }} />
          <Typography variant="body2" color="text.secondary">{markerKey}</Typography>
        </Box>
      )}
    </Box>
  ) : null;

  return (
    <Box component="figure" aria-labelledby={titleId} aria-describedby={summaryId} sx={{ m: 0, minWidth: 0 }}>
      <ChartHeader
        titleId={titleId}
        title={title}
        shortTitle={shortTitle}
        subtitle={subtitle}
        shortSubtitle={shortSubtitle}
        hideSubtitleOnPhone={hideSubtitleOnPhone}
        // No CSV on phones, where a download is little use
        actions={control || showViewToggle || (csvName && !isMobile) ? (
          <>
            {control}
            {showViewToggle && (
              // The size of the pages' other buttons, such as Adj. For Inflation
              <ToggleButtonGroup
                size="small"
                exclusive
                value={view}
                onChange={(_event, next) => next && setView(next)}
                aria-label={`${title}: show as`}
              >
                <ToggleButton value="chart" sx={{ textTransform: 'none' }}>Chart</ToggleButton>
                <ToggleButton value="table" sx={{ textTransform: 'none' }}>Table</ToggleButton>
              </ToggleButtonGroup>
            )}
            {csvName && !isMobile && (
              <Button
                size="small"
                startIcon={<DownloadIcon fontSize="small" />}
                onClick={handleDownload}
                disabled={!data.length}
                aria-label={`Download ${title} as CSV`}
              >
                CSV
              </Button>
            )}
          </>
        ) : undefined}
      />
      <Box component="p" id={summaryId} sx={visuallyHidden}>{summary}</Box>

      {view === 'table' ? (
        <StateTable
          caption={title}
          columns={[
            { key: 'year', label: yearHeader, format: row => yearLabel(row.year) },
            ...tableColumns.map(entry => ({
              key: entry.key,
              label: entry.name,
              align: 'right' as const,
              format: (row: YearRow) => (row[entry.key] === null || row[entry.key] === undefined ? '—' : (entry.format ?? format)(row[entry.key] as number)),
              hideOnPhone: entry.hideOnPhone,
            })),
            ...(compare ? colored.map(entry => ({
              key: `compare-${entry.key}`,
              label: `${entry.name}, ${compare.label.toLowerCase()}`,
              align: 'right' as const,
              format: (row: YearRow) => {
                const value = compareByYear?.get(row.year)?.[entry.key];
                return typeof value === 'number' ? format(value) : '—';
              },
            })) : []),
          ]}
          rows={[...data].reverse()}
        />
      ) : (
        <>
          {!legendBelow && legend}
          <Box ref={ref} aria-hidden sx={{ height, width: '100%' }}>
            {/* Drawn once the width is known: the height and label room depend on it, and a chart
                resized mid-animation morphs instead of drawing in */}
            {data.length > 0 && yAxis ? width > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                {kind === 'share' ? (
                  <BarChart data={stableChartData} margin={{ top: 8, right: 16, left: isMobile ? 0 : 4, bottom: 4 }} barCategoryGap="20%">
                    <CartesianGrid stroke={theme.palette.grey[200]} vertical={false} />
                    <XAxis dataKey="label" tick={axisTick} axisLine={{ stroke: theme.palette.grey[300] }} tickLine={false} minTickGap={16} />
                    <YAxis domain={yAxis.domain} ticks={yAxis.ticks} tickFormatter={tickFormat} tick={axisTick} axisLine={false} tickLine={false} width={isMobile ? 44 : 56} />
                    <Tooltip content={<ChartTooltip format={format} series={colored} />} cursor={{ fill: theme.palette.grey[100] }} />
                    {colored.map(entry => (
                      <Bar
                        key={entry.key}
                        dataKey={entry.key}
                        name={entry.name}
                        stackId="share"
                        fill={entry.color}
                        stroke={theme.palette.background.paper}
                        strokeWidth={1}
                        maxBarSize={24}
                        isAnimationActive={animate}
                      />
                    ))}
                  </BarChart>
                ) : (
                  <LineChart data={stableChartData} margin={{ top: 16, right: labelRoom, left: isMobile ? 0 : 4, bottom: 4 }}>
                    <CartesianGrid stroke={theme.palette.grey[200]} vertical={false} />
                    {bands.filter(band => years.includes(band.from) && years.includes(band.to)).map(band => (
                      <ReferenceArea
                        key={`${band.from}-${band.to}`}
                        x1={yearLabel(band.from)}
                        x2={yearLabel(band.to)}
                        fill={theme.palette.grey[100]}
                        fillOpacity={1}
                        label={{ value: band.label, position: 'insideTop', fontSize: 12, fill: theme.palette.text.secondary }}
                      />
                    ))}
                    <XAxis
                      dataKey="label"
                      tick={axisTick}
                      axisLine={{ stroke: theme.palette.grey[300] }}
                      tickLine={false}
                      minTickGap={16}
                      padding={{ left: 8, right: 8 }}
                    />
                    <YAxis
                      domain={yAxis.domain}
                      ticks={yAxis.ticks}
                      tickFormatter={tickFormat}
                      tick={axisTick}
                      axisLine={false}
                      tickLine={false}
                      width={isMobile ? 48 : 60}
                    />
                    <Tooltip
                      content={<ChartTooltip format={format} series={colored} compareByYear={compareByYear} compareLabel={compare?.label} />}
                      cursor={{ stroke: theme.palette.grey[400], strokeWidth: 1 }}
                    />
                    {visibleMarkers.map(marker => (
                      <ReferenceLine
                        key={marker.year}
                        x={yearLabel(marker.year)}
                        stroke={theme.palette.grey[400]}
                        strokeDasharray="4 3"
                        label={isMobile ? undefined : { value: marker.label, position: 'insideTopLeft', fontSize: 12, fill: theme.palette.text.secondary }}
                      />
                    ))}
                    {colored.flatMap(entry => (breaks.length ? eras.map(era => eraKey(entry.key, era)) : [entry.key]).map(dataKey => (
                      <Line
                        key={dataKey}
                        type="linear"
                        dataKey={dataKey}
                        name={entry.name}
                        stroke={entry.color}
                        strokeWidth={2}
                        strokeDasharray={entry.dashed ? '6 4' : undefined}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        dot={dotFor(entry.color, entry.key)}
                        activeDot={{ r: 6, strokeWidth: 2, stroke: theme.palette.background.paper }}
                        connectNulls={false}
                        isAnimationActive={animate}
                      />
                    )))}
                    {directLabels && <Customized component={<EndLabels series={colored} color={theme.palette.text.secondary} />} />}
                  </LineChart>
                )}
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body1" color="text.secondary">No data available</Typography>
              </Box>
            )}
          </Box>
          {legendBelow && legend}
        </>
      )}

      {(note || axisNote) && (
        <ChartNote>
          {note}
          {note && axisNote ? ' ' : null}
          {axisNote}
        </ChartNote>
      )}
    </Box>
  );
};

export default TrendChart;
