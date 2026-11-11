import React, { useMemo, useState } from 'react';
import { Box } from '@mui/material';
import { useAppSelector } from '@/store/hooks';
import {
  selectStateBullyingData,
  selectBullyingTypes,
  selectStateEnrollmentData
} from '@/store/slices/safetySlice';
import TrendChart from '@/features/state/components/TrendChart';
import ChartSelect from '@/features/state/components/ChartSelect';
import { REMOTE_BAND } from '@/features/state/utils/stateMetrics';
import { EntityKind, useCurrentEntity } from '@/features/entity/entity';
import { SAFETY, IdFallback, safetyParams } from '@/features/entity/bindings/safety';
import { countsByYear, entityOnly, formatPer100, formatPer100Axis, rateSeries, ratesByYear } from './safetyTrends';

const ID_FALLBACK: Record<EntityKind, IdFallback> = { school: 'zero', district: 'none' };

const ALL_TYPES = 'all';

/** The picker's names for the state's bullying types */
const typeName = (name: string) =>
  name === 'Cyber-bullying' ? 'Cyber Bullying' : name === 'Bullying (of any kind)' ? 'Other Bullying' : name;

const EntityBullyTrendChart: React.FC<{ kind: EntityKind }> = ({ kind }) => {
  const entityParams = safetyParams(useCurrentEntity(kind), ID_FALLBACK[kind]);
  const [picked, setPicked] = useState(ALL_TYPES);

  const entityBullying = useAppSelector(state => SAFETY[kind].data.bullying(state, entityParams));
  const stateBullying = useAppSelector(state => selectStateBullyingData(state, {}));
  const bullyingTypes = useAppSelector(selectBullyingTypes);
  const entityEnrollment = useAppSelector(state => SAFETY[kind].data.enrollment(state, entityParams));
  const stateEnrollment = useAppSelector(state => selectStateEnrollmentData(state, {}));

  // All types, then cyber-bullying, then the rest by name
  const options = useMemo(() => [
    { value: ALL_TYPES, label: 'All Types' },
    ...bullyingTypes
      .map(type => ({ value: String(type.id), label: typeName(type.name) }))
      .sort((a, b) => (a.label === 'Cyber Bullying' ? -1 : b.label === 'Cyber Bullying' ? 1 : a.label.localeCompare(b.label))),
  ], [bullyingTypes]);

  // Incidents confirmed by investigation per 100 students: all types, or one with all beside it
  const chart = useMemo(() => {
    const rates = (type: string) => {
      const counted = (row: { bullying_type: { id: number } }) => type === ALL_TYPES || String(row.bullying_type.id) === type;
      return ratesByYear(
        countsByYear(entityBullying, row => row.investigated_actual, counted),
        countsByYear(stateBullying, row => row.investigated_actual, counted),
        entityEnrollment,
        stateEnrollment
      );
    };
    const all = rates(ALL_TYPES);
    return picked === ALL_TYPES ? { rows: all } : { rows: rates(picked), overall: { data: entityOnly(all), label: 'All Types' } };
  }, [picked, entityBullying, stateBullying, entityEnrollment, stateEnrollment]);

  const name = picked === ALL_TYPES ? 'Bullying' : options.find(option => option.value === picked)?.label ?? 'Bullying';
  return (
    <Box sx={{ mt: 3 }}>
      <TrendChart
        title={`${name} Incidents By Year`}
        shortTitle={`${name} Incidents`}
        subtitle="Per 100 Students"
        control={<ChartSelect value={picked} options={options} onChange={setPicked} label="Bullying to show" />}
        data={chart.rows}
        series={rateSeries(kind)}
        format={formatPer100}
        axisFormat={formatPer100Axis}
        compare={chart.overall}
        bands={REMOTE_BAND}
      />
    </Box>
  );
};

export default EntityBullyTrendChart;
