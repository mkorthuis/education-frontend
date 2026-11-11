import { useId } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import { SERIES_COLORS } from '@/features/state/components/TrendChart';
import { ChartHeader, visuallyHidden } from '@/features/state/components/chartText';
import { getEntityLabel, getEntityPlural, EntityType } from './utils/academicUtils';

// Interface for processed chart data
interface ChartDataPoint {
  percentage: number;
  count: number;
  isCurrentEntity: boolean;
}

export interface EntityAcademicPerformanceProps {
  chartData: ChartDataPoint[];
  entityType: EntityType;
  stateAverage: number | null;
  rank: number | null;
  total: number;
  hasData: boolean;
}

// The same colors as the District (or School) and State Average lines in the chart beside it
const ENTITY_COLOR = SERIES_COLORS[0];
const STATE_COLOR = SERIES_COLORS[1];

const BarsTooltip = ({ active, payload, plural }: any) => {
  if (!active || !payload?.length) return null;
  const { percentage, count } = payload[0].payload as ChartDataPoint;
  return (
    <Box sx={{ backgroundColor: 'background.paper', p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1, boxShadow: 1 }}>
      <Typography variant="subtitle2" gutterBottom>{percentage}% Proficient</Typography>
      <Typography variant="body2">{count} {count === 1 ? plural.slice(0, -1) : plural}</Typography>
    </Box>
  );
};

/** How many districts (or schools) reached each percent proficient, with this one marked, in the State pages' chart style */
function EntityAcademicPerformance({
  chartData,
  entityType,
  stateAverage,
  rank,
  total,
  hasData
}: EntityAcademicPerformanceProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const titleId = useId();
  const summaryId = useId();
  const entityLabel = getEntityLabel(entityType);
  const entityPlural = getEntityPlural(entityType);
  const othersColor = theme.palette.grey[400];
  const own = chartData.find(entry => entry.isCurrentEntity);
  const axisTick = { fontSize: 12, fill: theme.palette.text.secondary };

  const legend = [
    { label: `This ${entityLabel}`, swatch: <Box sx={{ width: 10, height: 10, borderRadius: 0.5, backgroundColor: ENTITY_COLOR }} /> },
    { label: `Other ${entityPlural}`, swatch: <Box sx={{ width: 10, height: 10, borderRadius: 0.5, backgroundColor: othersColor }} /> },
    ...(stateAverage !== null
      ? [{ label: `State Average: ${stateAverage}%`, swatch: <Box sx={{ width: 16, height: 0, borderTop: '3px dashed', borderColor: STATE_COLOR }} /> }]
      : []),
  ];

  return (
    <Box component="figure" aria-labelledby={titleId} aria-describedby={summaryId} sx={{ m: 0, minWidth: 0 }}>
      <ChartHeader
        titleId={titleId}
        title={`% Students Proficient For Each ${entityLabel}`}
        subtitle={rank !== null && total > 0 ? `Ranked #${rank} of ${total} ${entityPlural.toLowerCase()}` : `Number of ${entityPlural}`}
      />
      <Box component="p" id={summaryId} sx={visuallyHidden}>
        {`Bar chart of how many ${entityPlural.toLowerCase()} reached each percent proficient.`}
        {own ? ` This ${entityType}: ${own.percentage}%${rank !== null ? `, ranked #${rank} of ${total}` : ''}.` : ''}
        {stateAverage !== null ? ` State average: ${stateAverage}%.` : ''}
      </Box>
      <Box component="ul" aria-hidden sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 2, rowGap: 0.5, listStyle: 'none', p: 0, m: 0, mb: 1 }}>
        {legend.map(item => (
          <Box component="li" key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            {item.swatch}
            <Typography variant="body2" color="text.primary">{item.label}</Typography>
          </Box>
        ))}
      </Box>
      <Box aria-hidden sx={{ width: '100%', height: isMobile ? 280 : 340 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }} barCategoryGap={0} barGap={0}>
            <CartesianGrid stroke={theme.palette.grey[200]} vertical={false} />
            <XAxis
              dataKey="percentage"
              ticks={isMobile ? [0, 20, 40, 60, 80, 100] : [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
              interval={0}
              tickFormatter={value => `${value}%`}
              tick={axisTick}
              axisLine={{ stroke: theme.palette.grey[300] }}
              tickLine={false}
            />
            <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} width={32} />
            <Tooltip content={<BarsTooltip plural={entityPlural} />} cursor={{ fill: theme.palette.grey[100] }} />
            {stateAverage !== null && (
              <ReferenceLine x={stateAverage} stroke={STATE_COLOR} strokeWidth={2} strokeDasharray="6 4" isFront />
            )}
            <Bar dataKey="count" name={entityPlural} minPointSize={1}>
              {chartData.map(entry => (
                <Cell key={entry.percentage} fill={entry.isCurrentEntity ? ENTITY_COLOR : othersColor} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
      {!hasData && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          No data available. Please select filters to view {entityType} data.
        </Typography>
      )}
    </Box>
  );
}

export default EntityAcademicPerformance;
