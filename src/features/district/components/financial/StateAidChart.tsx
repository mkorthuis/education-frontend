import React, { useMemo, useState } from 'react';
import { Box, ToggleButton, ToggleButtonGroup, Typography, useMediaQuery, useTheme } from '@mui/material';
import { Bar, BarChart, CartesianGrid, Cell, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { visuallyHidden } from '@/components/ds';
import { ChartHeader, ChartNote } from '@/features/state/components/chartText';
import { formatCompactDollars, formatDollars, formatSchoolYear, niceAxis } from '@/features/state/utils/stateMetrics';
import { shortYear } from '@/features/state/utils/phrases';
import { AID_PARTS, AidPartKey, hasEstimate, StateAidRow } from '../../utils/stateAid';

// The district's state aid by year as stacked columns, in the order the tab explains them: the adequacy
// grant, the SWEPT, special education aid and other state aid. A column's height is the total, the state
// revenue in its financial report. With Adjust For Inflation, the figures come restated in the site's fiscal
// year's dollars, and the title says so, as the other tabs' page title does. For a district of one whole town,
// the parts can be per resident student instead, which sets the aid apart from the change in students. Special
// education and other aid that isn't in yet is estimated, and faded. The year the tab shows is highlighted: a
// band behind its column and its label in bold. The years are short ("24/25"), as the tab's picker has them,
// so every one is labeled.


/** A year's figures as charted: per student or not, after inflation or not */
interface ChartRow {
  label: string;
  row: StateAidRow;
  students?: number;
  grant: number;
  swept: number;
  sped?: number;
  other?: number;
  total: number;
}

const AidTooltip = ({ active, payload, perStudent }: any) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload as ChartRow;
  const { row, students } = entry;
  const partText = (key: AidPartKey) => {
    const value = entry[key];
    if (value !== undefined) return `${formatDollars(value)}${row.estimates[key] ? ' (est.)' : ''}`;
    return key === 'sped' ? 'Not published yet' : 'Not reported yet';
  };
  const known = row.sped !== null && row.other !== null;
  const line = (color: string, name: string, text: string, bold = false) => (
    <Box key={name} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
      <Box sx={{ width: 10, height: 10, borderRadius: 0.5, backgroundColor: color, flexShrink: 0 }} />
      <Typography variant="body2" sx={{ fontWeight: bold ? 600 : 400 }}>{name}: {text}</Typography>
    </Box>
  );
  return (
    <Box sx={{ backgroundColor: 'background.paper', p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1, boxShadow: 1 }}>
      <Typography variant="subtitle2" gutterBottom>{formatSchoolYear(row.year)}</Typography>
      {[...AID_PARTS].reverse().map(part => line(part.color, part.name, partText(part.key)))}
      {line('transparent', row.complete ? 'Total' : known ? 'Total (Est.)' : 'Total So Far', formatDollars(entry.total), true)}
      {perStudent && students && <Typography variant="caption" color="text.secondary">Per student: {Math.round(students).toLocaleString('en-US')} resident students</Typography>}
    </Box>
  );
};

interface StateAidChartProps {
  /** As shown: restated in the site's fiscal year's dollars with Adjust For Inflation */
  rows: StateAidRow[];
  /** Whether they're restated */
  inCurrentDollars?: boolean;
  /** Resident students by year, for a district of one whole town; no per-student view without them */
  students?: Map<number, number> | null;
  /** The year the tab shows, highlighted */
  selectedYear?: number;
}

const StateAidChart: React.FC<StateAidChartProps> = ({ rows, inCurrentDollars = false, students, selectedYear }) => {
  const [view, setView] = useState<'total' | 'perStudent'>('total');
  const perStudent = view === 'perStudent' && Boolean(students);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const animate = !useMediaQuery('(prefers-reduced-motion: reduce)');

  const data: ChartRow[] = useMemo(() => rows.map(row => {
    const count = students?.get(row.year);
    const each = (value: number) => (perStudent && count ? value / count : value);
    return {
      label: shortYear(row.year),
      row,
      students: count,
      grant: each(row.grant),
      swept: each(row.swept),
      sped: row.sped === null ? undefined : each(row.sped),
      other: row.other === null ? undefined : each(row.other),
      total: each(row.total),
    };
  }), [rows, students, perStudent]);

  const axis = useMemo(() => {
    const highs = data.map(entry => entry.grant + entry.swept + (entry.sped ?? 0) + Math.max(0, entry.other ?? 0));
    const lows = data.map(entry => Math.min(0, entry.other ?? 0));
    return niceAxis(Math.min(0, ...lows), Math.max(0, ...highs), 'zero');
  }, [data]);

  const first = data[0];
  const last = data[data.length - 1];
  const summary = first && last
    ? `Stacked column chart of state aid by year${inCurrentDollars ? ', in current dollars' : ''}, ${formatSchoolYear(first.row.year)} to ${formatSchoolYear(last.row.year)}: the adequacy grant, SWEPT, special education aid and other state aid. ${formatSchoolYear(first.row.year)}: ${formatDollars(first.total)} in all. ${formatSchoolYear(last.row.year)}: ${formatDollars(last.total)}${last.row.complete ? ' in all' : last.row.sped !== null && last.row.other !== null ? ' in all, estimated' : ' so far'}.`
    : 'No data.';

  const axisTick = { fontSize: 12, fill: theme.palette.text.secondary };
  const selected = selectedYear ? shortYear(selectedYear) : undefined;
  const YearTick = ({ x, y, payload }: { x: number; y: number; payload: { value: string } }) => {
    const chosen = payload.value === selected;
    return (
      <text x={x} y={y + 12} textAnchor="middle" fontSize={12} fontWeight={chosen ? 700 : 400} fill={chosen ? theme.palette.text.primary : theme.palette.text.secondary}>
        {payload.value}
      </text>
    );
  };

  return (
    <Box component="figure" sx={{ m: 0 }} aria-labelledby="state-aid-chart-title">
      <ChartHeader
        titleId="state-aid-chart-title"
        title={<>State Aid by Year{inCurrentDollars && <Box component="span" sx={{ color: 'error.main' }}> In Current Dollars</Box>}</>}
        subtitle={perStudent ? 'Per Resident Student' : undefined}
        actions={students ? (
          // The size of the pages' other buttons, such as Adjust For Inflation
          <ToggleButtonGroup size="small" exclusive value={view} onChange={(_event, next) => next && setView(next)} aria-label="State aid by year: show">
            <ToggleButton value="total" sx={{ textTransform: 'none' }}>Total</ToggleButton>
            <ToggleButton value="perStudent" sx={{ textTransform: 'none' }}>Per Student</ToggleButton>
          </ToggleButtonGroup>
        ) : undefined}
      />
      <Box component="ul" aria-hidden sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 2, rowGap: 0.5, listStyle: 'none', p: 0, m: 0, mb: 1 }}>
        {AID_PARTS.map(part => (
          <Box component="li" key={part.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 16, height: 10, borderRadius: 0.5, backgroundColor: part.color, flexShrink: 0 }} />
            <Typography variant="body2">{isMobile ? part.phoneName : part.legendName}</Typography>
          </Box>
        ))}
      </Box>
      <Typography sx={visuallyHidden}>{summary}</Typography>
      <Box aria-hidden sx={{ height: isMobile ? 280 : 360, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 16, left: isMobile ? 0 : 4, bottom: 4 }} barCategoryGap="22%">
            <CartesianGrid stroke={theme.palette.grey[200]} vertical={false} />
            <XAxis dataKey="label" tick={YearTick} interval={0} axisLine={{ stroke: theme.palette.grey[300] }} tickLine={false} />
            <YAxis domain={axis.domain} ticks={axis.ticks} tickFormatter={formatCompactDollars} tick={axisTick} axisLine={false} tickLine={false} width={isMobile ? 48 : 60} />
            <Tooltip content={<AidTooltip perStudent={perStudent} />} cursor={{ fill: theme.palette.grey[100] }} />
            {selected && <ReferenceArea x1={selected} x2={selected} fill={theme.palette.primary.main} fillOpacity={0.1} strokeOpacity={0} />}
            {AID_PARTS.map(part => (
              <Bar
                key={part.key}
                dataKey={part.key}
                name={part.name}
                stackId="aid"
                fill={part.color}
                // A thin gap between the parts
                stroke={theme.palette.background.paper}
                strokeWidth={1}
                maxBarSize={56}
                isAnimationActive={animate}
              >
                {data.map(entry => <Cell key={entry.label} fillOpacity={entry.row.estimates[part.key] ? 0.45 : 1} />)}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Box>
      {rows.some(hasEstimate) && (
        <ChartNote>{isMobile ? 'Faded: Estimated from last reported. Adj. for inflation.' : 'Faded: estimated from the latest year reported, adjusted for inflation.'}</ChartNote>
      )}
    </Box>
  );
};

export default StateAidChart;
