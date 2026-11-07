import React, { useId, useState } from 'react';
import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { AskChart } from '@/services/api/endpoints/ask';
import { visuallyHidden } from '@/components/ds';
import StateTable from '@/features/state/components/StateTable';
import { SERIES_COLORS } from '@/features/state/components/TrendChart';
import { ChartHeader, ChartNote } from '@/features/state/components/chartText';
import { formatCell, formatValue } from './askFormat';

// Above this many categories the bar list opens as a table
const MAX_BAR_ROWS = 15;
// Room kept past the longest bar for its value
const VALUE_ROOM = 64;

/** "Bar chart. Bow: $23,100. Concord: $21,450." with every category, or the top and bottom three of a long list */
const summarize = (chart: AskChart): string => {
  const describe = (point: AskChart['points'][number]) => {
    const values = chart.series.map((name, index) => {
      const value = point.values[index];
      const text = value === null ? 'no data' : formatValue(chart.unit, value);
      return chart.series.length > 1 ? `${name} ${text}` : text;
    });
    return `${point.label}: ${values.join(', ')}`;
  };
  const points = chart.points.length > 10 ? [...chart.points.slice(0, 3), ...chart.points.slice(-3)] : chart.points;
  return `Bar chart. ${points.map(describe).join('. ')}. The table view lists every value.`;
};

/**
 * A comparison across districts, groups or grades as horizontal bars: the names wrap, which SVG
 * axis labels can't, so long names fit on a phone. Bars start at zero.
 */
const CategoryBars: React.FC<{ chart: AskChart; note?: string }> = ({ chart, note }) => {
  const titleId = useId();
  const summaryId = useId();
  const [view, setView] = useState<'chart' | 'table'>(chart.points.length > MAX_BAR_ROWS ? 'table' : 'chart');
  const largest = Math.max(0, ...chart.points.flatMap(point => point.values.map(value => value ?? 0)));
  const width = (value: number | null) => (largest > 0 && value !== null && value > 0 ? `calc((100% - ${VALUE_ROOM}px) * ${value / largest})` : '0px');

  return (
    <Box component="figure" aria-labelledby={titleId} aria-describedby={summaryId} sx={{ m: 0, minWidth: 0 }}>
      <ChartHeader
        titleId={titleId}
        title={chart.title}
        component="h3"
        actions={(
          <ToggleButtonGroup size="small" exclusive value={view} onChange={(_event, next) => next && setView(next)} aria-label={`${chart.title}: show as`}>
            <ToggleButton value="chart" sx={{ textTransform: 'none' }}>Chart</ToggleButton>
            <ToggleButton value="table" sx={{ textTransform: 'none' }}>Table</ToggleButton>
          </ToggleButtonGroup>
        )}
      />
      <Box component="p" id={summaryId} sx={visuallyHidden}>{summarize(chart)}</Box>

      {view === 'table' ? (
        <StateTable
          caption={chart.title}
          columns={[
            { key: 'label', label: chart.x_label },
            ...chart.series.map((name, index) => ({
              key: `s${index}`,
              label: name,
              align: 'right' as const,
              format: (row: Record<string, string | number | null>) => formatCell(chart.unit, row[`s${index}`]),
            })),
          ]}
          rows={chart.points.map(point => Object.fromEntries([['label', point.label], ...point.values.map((value, index) => [`s${index}`, value])]))}
        />
      ) : (
        <>
          {chart.series.length > 1 && (
            <Box component="ul" aria-hidden sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 2, rowGap: 0.5, listStyle: 'none', p: 0, m: 0, mb: 1.5 }}>
              {chart.series.map((name, index) => (
                <Box component="li" key={name} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ width: 16, height: 10, borderRadius: 0.5, backgroundColor: SERIES_COLORS[index % SERIES_COLORS.length] }} />
                  <Typography variant="body2" color="text.primary">{name}</Typography>
                </Box>
              ))}
            </Box>
          )}
          <Box aria-hidden sx={{ display: 'flex', flexDirection: 'column', gap: chart.series.length > 1 ? 1.5 : 1 }}>
            {chart.points.map(point => (
              <Box
                key={point.label}
                sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'minmax(120px, 35%) 1fr' }, columnGap: 2, rowGap: 0.5, alignItems: 'center' }}
              >
                <Typography variant="body2" color="text.primary">{point.label}</Typography>
                <Box sx={{ borderLeft: '1px solid', borderColor: 'grey.300', display: 'flex', flexDirection: 'column', gap: 0.5, py: 0.25 }}>
                  {chart.series.map((name, index) => {
                    const value = point.values[index];
                    return (
                      <Box key={name} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minHeight: 16 }}>
                        <Box sx={{ width: width(value), height: 14, backgroundColor: SERIES_COLORS[index % SERIES_COLORS.length], borderRadius: '0 2px 2px 0', flexShrink: 0 }} />
                        <Typography variant="body2" color="text.primary" sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                          {value === null ? '—' : formatValue(chart.unit, value)}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            ))}
          </Box>
        </>
      )}
      {note && <ChartNote>{note}</ChartNote>}
    </Box>
  );
};

export default CategoryBars;
