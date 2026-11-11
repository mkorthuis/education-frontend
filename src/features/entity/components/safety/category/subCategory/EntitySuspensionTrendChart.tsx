import React, { useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectDisciplineCountTypes } from '@/store/slices/safetySlice';
import { IN_SCHOOL_SUSPENSION_TYPE, OUT_OF_SCHOOL_SUSPENSION_TYPE } from '@/utils/safetyCalculations';
import TrendChart from '@/features/state/components/TrendChart';
import ChartSelect from '@/features/state/components/ChartSelect';
import { REMOTE_BAND } from '@/features/state/utils/stateMetrics';
import { EntityKind } from '@/features/entity/entity';
import { IdFallback } from '@/features/entity/bindings/safety';
import { entityOnly, formatPer100, formatPer100Axis, RATE_SERIES } from '@/features/entity/trends';
import { useSafetyRates } from './useSafetyRates';

const ID_FALLBACK: Record<EntityKind, IdFallback> = { school: 'zero', district: 'none' };

type SuspensionView = 'overall' | 'in-school' | 'out-of-school';

const VIEWS: { value: SuspensionView; label: string; title: string }[] = [
  { value: 'overall', label: 'Overall', title: 'All Suspensions By Year' },
  { value: 'in-school', label: 'In-School', title: 'In-School Suspensions By Year' },
  { value: 'out-of-school', label: 'Out-of-School', title: 'Out-of-School Suspensions By Year' },
];

const EntitySuspensionTrendChart: React.FC<{ kind: EntityKind }> = ({ kind }) => {
  const [view, setView] = useState<SuspensionView>('overall');
  const rates = useSafetyRates(kind, 'disciplineCount', ID_FALLBACK[kind]);
  const countTypes = useAppSelector(selectDisciplineCountTypes);

  // Suspensions per 100 students: both kinds, or one with both beside it
  const chart = useMemo(() => {
    const typeId = (name: string) => countTypes.find(type => type.name.includes(name))?.id;
    const inSchool = typeId(IN_SCHOOL_SUSPENSION_TYPE);
    const outOfSchool = typeId(OUT_OF_SCHOOL_SUSPENSION_TYPE);
    if (inSchool === undefined || outOfSchool === undefined) return { rows: [] };
    const suspensions = (ids: number[]) => rates(row => (ids.includes(row.count_type.id) ? row.count : 0));
    const all = suspensions([inSchool, outOfSchool]);
    return view === 'overall'
      ? { rows: all }
      : { rows: suspensions([view === 'in-school' ? inSchool : outOfSchool]), overall: { data: entityOnly(all), label: 'All Suspensions' } };
  }, [view, rates, countTypes]);

  return (
    <TrendChart
      sx={{ mt: 3 }}
      title={VIEWS.find(option => option.value === view)!.title}
      subtitle="Per 100 Students"
      control={<ChartSelect value={view} options={VIEWS} onChange={setView} label="Suspensions to show" />}
      data={chart.rows}
      series={RATE_SERIES[kind]}
      format={formatPer100}
      axisFormat={formatPer100Axis}
      compare={chart.overall}
      bands={REMOTE_BAND}
    />
  );
};

export default EntitySuspensionTrendChart;
