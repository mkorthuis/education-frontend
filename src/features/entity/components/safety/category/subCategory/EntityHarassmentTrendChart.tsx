import React, { useMemo, useState } from 'react';
import { BaseHarassmentData } from '@/store/slices/safety/types';
import TrendChart from '@/features/state/components/TrendChart';
import ChartSelect from '@/features/state/components/ChartSelect';
import { REMOTE_BAND } from '@/features/state/utils/stateMetrics';
import { EntityKind } from '@/features/entity/entity';
import { IdFallback } from '@/features/entity/bindings/safety';
import { formatPer100, formatPer100Axis, RATE_SERIES } from '@/features/entity/trends';
import { useSafetyRates } from './useSafetyRates';

const ID_FALLBACK: Record<EntityKind, IdFallback> = { school: 'zero', district: 'none' };

type HarassmentView = 'incidents' | 'students-impacted' | 'students-disciplined';

const VIEWS: { value: HarassmentView; label: string; title: string; count: (row: BaseHarassmentData) => number }[] = [
  { value: 'incidents', label: 'Incidents', title: 'Harassment Incidents By Year', count: row => row.incident_count },
  { value: 'students-impacted', label: 'Students Impacted', title: 'Students Impacted By Year', count: row => row.student_impact_count },
  { value: 'students-disciplined', label: 'Students Disciplined', title: 'Students Disciplined By Year', count: row => row.student_engaged_count },
];

const EntityHarassmentTrendChart: React.FC<{ kind: EntityKind }> = ({ kind }) => {
  const [view, setView] = useState<HarassmentView>('incidents');
  const rates = useSafetyRates(kind, 'harassment', ID_FALLBACK[kind]);

  const picked = VIEWS.find(option => option.value === view)!;
  // Incidents, or students, per 100 students across every classification of harassment
  const rows = useMemo(() => rates(picked.count), [rates, picked]);

  return (
    <TrendChart
      sx={{ mt: 3 }}
      title={picked.title}
      subtitle="Per 100 Students"
      control={<ChartSelect value={view} options={VIEWS} onChange={setView} label="Harassment to show" />}
      data={rows}
      series={RATE_SERIES[kind]}
      format={formatPer100}
      axisFormat={formatPer100Axis}
      bands={REMOTE_BAND}
    />
  );
};

export default EntityHarassmentTrendChart;
