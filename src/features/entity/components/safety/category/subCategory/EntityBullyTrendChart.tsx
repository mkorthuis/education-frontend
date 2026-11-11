import React, { useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectBullyingTypes } from '@/store/slices/safetySlice';
import TrendChart from '@/features/state/components/TrendChart';
import ChartSelect from '@/features/state/components/ChartSelect';
import { REMOTE_BAND } from '@/features/state/utils/stateMetrics';
import { EntityKind } from '@/features/entity/entity';
import { IdFallback } from '@/features/entity/bindings/safety';
import { entityOnly, formatPer100, formatPer100Axis, RATE_SERIES } from '@/features/entity/trends';
import { useSafetyRates } from './useSafetyRates';

const ID_FALLBACK: Record<EntityKind, IdFallback> = { school: 'zero', district: 'none' };

const ALL_TYPES = 'all';

/** The picker's names for the state's bullying types */
const typeName = (name: string) =>
  name === 'Cyber-bullying' ? 'Cyber Bullying' : name === 'Bullying (of any kind)' ? 'Other Bullying' : name;

const EntityBullyTrendChart: React.FC<{ kind: EntityKind }> = ({ kind }) => {
  const [picked, setPicked] = useState(ALL_TYPES);
  const rates = useSafetyRates(kind, 'bullying', ID_FALLBACK[kind]);
  const bullyingTypes = useAppSelector(selectBullyingTypes);

  // All types, then cyber-bullying, then the rest by name
  const options = useMemo(() => [
    { value: ALL_TYPES, label: 'All Types' },
    ...bullyingTypes
      .map(type => ({ value: String(type.id), label: typeName(type.name) }))
      .sort((a, b) => (a.label === 'Cyber Bullying' ? -1 : b.label === 'Cyber Bullying' ? 1 : a.label.localeCompare(b.label))),
  ], [bullyingTypes]);

  // Incidents confirmed by investigation per 100 students: all types, or one with all beside it
  const chart = useMemo(() => {
    const incidents = (type: string) =>
      rates(row => (type === ALL_TYPES || String(row.bullying_type.id) === type ? row.investigated_actual : 0));
    const all = incidents(ALL_TYPES);
    return picked === ALL_TYPES ? { rows: all } : { rows: incidents(picked), overall: { data: entityOnly(all), label: 'All Types' } };
  }, [picked, rates]);

  const name = picked === ALL_TYPES ? 'Bullying' : options.find(option => option.value === picked)?.label ?? 'Bullying';
  return (
    <TrendChart
      sx={{ mt: 3 }}
      title={`${name} Incidents By Year`}
      shortTitle={`${name} Incidents`}
      subtitle="Per 100 Students"
      control={<ChartSelect value={picked} options={options} onChange={setPicked} label="Bullying to show" />}
      data={chart.rows}
      series={RATE_SERIES[kind]}
      format={formatPer100}
      axisFormat={formatPer100Axis}
      compare={chart.overall}
      bands={REMOTE_BAND}
    />
  );
};

export default EntityBullyTrendChart;
