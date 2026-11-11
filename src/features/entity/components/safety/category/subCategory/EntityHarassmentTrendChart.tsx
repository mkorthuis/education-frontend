import React, { useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  selectStateHarassmentData,
  selectStateEnrollmentData
} from '@/store/slices/safetySlice';
import { BaseHarassmentData } from '@/store/slices/safety/types';
import ChartSelect from '@/features/state/components/ChartSelect';
import { EntityKind, useCurrentEntity } from '@/features/entity/entity';
import { SAFETY, IdFallback, safetyParams } from '@/features/entity/bindings/safety';
import SafetyTrendChart from './SafetyTrendChart';
import { countsByYear, ratesByYear } from './safetyTrends';

const ID_FALLBACK: Record<EntityKind, IdFallback> = { school: 'zero', district: 'none' };

type HarassmentView = 'incidents' | 'students-impacted' | 'students-disciplined';

const VIEWS: { value: HarassmentView; label: string; title: string; count: (row: BaseHarassmentData) => number }[] = [
  { value: 'incidents', label: 'Incidents', title: 'Harassment Incidents By Year', count: row => row.incident_count },
  { value: 'students-impacted', label: 'Students Impacted', title: 'Students Impacted By Year', count: row => row.student_impact_count },
  { value: 'students-disciplined', label: 'Students Disciplined', title: 'Students Disciplined By Year', count: row => row.student_engaged_count },
];

const EntityHarassmentTrendChart: React.FC<{ kind: EntityKind }> = ({ kind }) => {
  const entity = useCurrentEntity(kind);
  const entityParams = safetyParams(entity, ID_FALLBACK[kind]);
  const [view, setView] = useState<HarassmentView>('incidents');

  const entityHarassment = useAppSelector(state => SAFETY[kind].data.harassment(state, entityParams));
  const stateHarassment = useAppSelector(state => selectStateHarassmentData(state, {}));
  const entityEnrollment = useAppSelector(state => SAFETY[kind].data.enrollment(state, entityParams));
  const stateEnrollment = useAppSelector(state => selectStateEnrollmentData(state, {}));

  const picked = VIEWS.find(option => option.value === view)!;
  // Incidents, or students, per 100 students, across every classification of harassment
  const rows = useMemo(() => ratesByYear(
    entityHarassment.map(row => row.year),
    countsByYear(entityHarassment, picked.count),
    countsByYear(stateHarassment, picked.count),
    entityEnrollment,
    stateEnrollment
  ), [picked, entityHarassment, stateHarassment, entityEnrollment, stateEnrollment]);

  return (
    <SafetyTrendChart
      kind={kind}
      title={picked.title}
      control={<ChartSelect value={view} options={VIEWS} onChange={setView} label="Harassment to show" />}
      rows={rows}
    />
  );
};

export default EntityHarassmentTrendChart;
