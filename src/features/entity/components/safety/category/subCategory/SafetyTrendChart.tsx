import React from 'react';
import { Box } from '@mui/material';
import TrendChart from '@/features/state/components/TrendChart';
import { formatPercent, REMOTE_BAND, YearRow } from '@/features/state/utils/stateMetrics';
import { EntityKind, ENTITY_LABEL } from '@/features/entity/entity';

interface SafetyTrendChartProps {
  kind: EntityKind;
  title: string;
  /** A shorter title for phones */
  shortTitle?: string;
  subtitle?: string;
  shortSubtitle?: string;
  /** Rows from ratesByYear: the district's or school's rate and the state's */
  rows: YearRow[];
  /** Percentages of students, rather than incidents per 100 students */
  percent?: boolean;
  /** A picker for what the chart counts */
  control?: React.ReactNode;
  /** The district's or school's rate for every type, drawn dashed while the picker shows one type */
  overall?: { data: YearRow[]; label: string };
}

const per100 = (value: number) => value.toFixed(2);
const per100Axis = (value: number) => String(Number(value.toFixed(2)));

/** A district's or school's safety measure by year beside the state's, in the State pages' chart */
const SafetyTrendChart: React.FC<SafetyTrendChartProps> = ({ kind, rows, percent = false, overall, subtitle, ...text }) => (
  <Box sx={{ mt: 3 }}>
    <TrendChart
      {...text}
      titleComponent="h3"
      subtitle={subtitle ?? (percent ? undefined : 'Per 100 Students')}
      data={rows}
      series={[{ key: 'entity', name: ENTITY_LABEL[kind] }, { key: 'state', name: 'State Average' }]}
      format={percent ? value => formatPercent(value, 1) : per100}
      axisFormat={percent ? value => formatPercent(value) : per100Axis}
      compare={overall}
      bands={REMOTE_BAND}
    />
  </Box>
);

export default SafetyTrendChart;
