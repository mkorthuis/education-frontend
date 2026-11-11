import React, { useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  selectStateDisciplineCountData,
  selectDisciplineCountTypes,
  selectStateEnrollmentData
} from '@/store/slices/safetySlice';
import {
  IN_SCHOOL_SUSPENSION_TYPE,
  OUT_OF_SCHOOL_SUSPENSION_TYPE
} from '@/utils/safetyCalculations';
import ChartSelect from '@/features/state/components/ChartSelect';
import { EntityKind, useCurrentEntity } from '@/features/entity/entity';
import { SAFETY, IdFallback, safetyParams } from '@/features/entity/bindings/safety';
import SafetyTrendChart from './SafetyTrendChart';
import { countsByYear, entityOnly, ratesByYear } from './safetyTrends';

const ID_FALLBACK: Record<EntityKind, IdFallback> = { school: 'zero', district: 'none' };

type SuspensionView = 'overall' | 'in-school' | 'out-of-school';

const VIEWS: { value: SuspensionView; label: string; title: string }[] = [
  { value: 'overall', label: 'Overall', title: 'All Suspensions By Year' },
  { value: 'in-school', label: 'In-School', title: 'In-School Suspensions By Year' },
  { value: 'out-of-school', label: 'Out-of-School', title: 'Out-of-School Suspensions By Year' },
];

const EntitySuspensionTrendChart: React.FC<{ kind: EntityKind }> = ({ kind }) => {
  const entity = useCurrentEntity(kind);
  const entityParams = safetyParams(entity, ID_FALLBACK[kind]);
  const [view, setView] = useState<SuspensionView>('overall');

  const entityCounts = useAppSelector(state => SAFETY[kind].data.disciplineCount(state, entityParams));
  const stateCounts = useAppSelector(state => selectStateDisciplineCountData(state, {}));
  const countTypes = useAppSelector(selectDisciplineCountTypes);
  const entityEnrollment = useAppSelector(state => SAFETY[kind].data.enrollment(state, entityParams));
  const stateEnrollment = useAppSelector(state => selectStateEnrollmentData(state, {}));

  // Suspensions per 100 students, of the type picked and, beside one type, of both
  const chart = useMemo(() => {
    const inSchool = countTypes.find(type => type.name.includes(IN_SCHOOL_SUSPENSION_TYPE));
    const outOfSchool = countTypes.find(type => type.name.includes(OUT_OF_SCHOOL_SUSPENSION_TYPE));
    if (!inSchool || !outOfSchool) return { rows: [] };
    const typeIds = (picked: SuspensionView) =>
      picked === 'in-school' ? [inSchool.id] : picked === 'out-of-school' ? [outOfSchool.id] : [inSchool.id, outOfSchool.id];
    const years = entityCounts.map(row => row.year);
    const rates = (picked: SuspensionView) => {
      const ids = typeIds(picked);
      const counted = (row: { count_type: { id: number } }) => ids.includes(row.count_type.id);
      return ratesByYear(
        years,
        countsByYear(entityCounts, row => row.count, counted),
        countsByYear(stateCounts, row => row.count, counted),
        entityEnrollment,
        stateEnrollment
      );
    };
    return {
      rows: rates(view),
      overall: view === 'overall' ? undefined : { data: entityOnly(rates('overall')), label: 'All Suspensions' },
    };
  }, [view, entityCounts, stateCounts, countTypes, entityEnrollment, stateEnrollment]);

  return (
    <SafetyTrendChart
      kind={kind}
      title={VIEWS.find(option => option.value === view)!.title}
      control={<ChartSelect value={view} options={VIEWS} onChange={setView} label="Suspensions to show" />}
      rows={chart.rows}
      overall={chart.overall}
    />
  );
};

export default EntitySuspensionTrendChart;
