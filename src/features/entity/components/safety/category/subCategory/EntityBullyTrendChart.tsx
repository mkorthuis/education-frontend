import React, { useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  selectStateBullyingData,
  selectBullyingTypes,
  selectStateEnrollmentData
} from '@/store/slices/safetySlice';
import ChartSelect from '@/features/state/components/ChartSelect';
import { EntityKind, useCurrentEntity } from '@/features/entity/entity';
import { SAFETY, IdFallback, safetyParams } from '@/features/entity/bindings/safety';
import SafetyTrendChart from './SafetyTrendChart';
import { countsByYear, entityOnly, ratesByYear } from './safetyTrends';

const ID_FALLBACK: Record<EntityKind, IdFallback> = { school: 'zero', district: 'none' };

const ALL_TYPES = 'all';

/** The picker's names for the state's bullying types, cyber-bullying first */
const typeName = (name: string) =>
  name === 'Cyber-bullying' ? 'Cyber Bullying' : name === 'Bullying (of any kind)' ? 'Other Bullying' : name;

const EntityBullyTrendChart: React.FC<{ kind: EntityKind }> = ({ kind }) => {
  const entity = useCurrentEntity(kind);
  const entityParams = safetyParams(entity, ID_FALLBACK[kind]);
  const [picked, setPicked] = useState<string>(ALL_TYPES);

  const entityBullying = useAppSelector(state => SAFETY[kind].data.bullying(state, entityParams));
  const stateBullying = useAppSelector(state => selectStateBullyingData(state, {}));
  const bullyingTypes = useAppSelector(selectBullyingTypes);
  const entityEnrollment = useAppSelector(state => SAFETY[kind].data.enrollment(state, entityParams));
  const stateEnrollment = useAppSelector(state => selectStateEnrollmentData(state, {}));

  const options = useMemo(() => [
    { value: ALL_TYPES, label: 'All Types' },
    ...bullyingTypes
      .map(type => ({ value: String(type.id), label: typeName(type.name) }))
      .sort((a, b) => (a.label === 'Cyber Bullying' ? -1 : b.label === 'Cyber Bullying' ? 1 : a.label.localeCompare(b.label))),
  ], [bullyingTypes]);

  // Incidents confirmed by investigation per 100 students, of the type picked and, beside one type, of all
  const chart = useMemo(() => {
    const years = entityBullying.map(row => row.year);
    const rates = (type: string) => {
      const counted = (row: { bullying_type: { id: number } }) => type === ALL_TYPES || String(row.bullying_type.id) === type;
      return ratesByYear(
        years,
        countsByYear(entityBullying, row => row.investigated_actual, counted),
        countsByYear(stateBullying, row => row.investigated_actual, counted),
        entityEnrollment,
        stateEnrollment
      );
    };
    return {
      rows: rates(picked),
      overall: picked === ALL_TYPES ? undefined : { data: entityOnly(rates(ALL_TYPES)), label: 'All Types' },
    };
  }, [picked, entityBullying, stateBullying, entityEnrollment, stateEnrollment]);

  const name = picked === ALL_TYPES ? 'Bullying' : options.find(option => option.value === picked)?.label ?? 'Bullying';
  return (
    <SafetyTrendChart
      kind={kind}
      title={`${name} Incidents By Year`}
      shortTitle={`${name} Incidents`}
      control={<ChartSelect value={picked} options={options} onChange={setPicked} label="Bullying to show" />}
      rows={chart.rows}
      overall={chart.overall}
    />
  );
};

export default EntityBullyTrendChart;
