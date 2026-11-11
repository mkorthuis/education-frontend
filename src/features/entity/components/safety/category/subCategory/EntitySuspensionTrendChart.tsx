import React, { useMemo, useState } from 'react';
import { Box } from '@mui/material';
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
import TrendChart from '@/features/state/components/TrendChart';
import ChartSelect from '@/features/state/components/ChartSelect';
import { REMOTE_BAND } from '@/features/state/utils/stateMetrics';
import { EntityKind, useCurrentEntity } from '@/features/entity/entity';
import { SAFETY, IdFallback, safetyParams } from '@/features/entity/bindings/safety';
import { countsByYear, entityOnly, formatPer100, formatPer100Axis, rateSeries, ratesByYear } from './safetyTrends';

const ID_FALLBACK: Record<EntityKind, IdFallback> = { school: 'zero', district: 'none' };

type SuspensionView = 'overall' | 'in-school' | 'out-of-school';

const VIEWS: { value: SuspensionView; label: string; title: string }[] = [
  { value: 'overall', label: 'Overall', title: 'All Suspensions By Year' },
  { value: 'in-school', label: 'In-School', title: 'In-School Suspensions By Year' },
  { value: 'out-of-school', label: 'Out-of-School', title: 'Out-of-School Suspensions By Year' },
];

const EntitySuspensionTrendChart: React.FC<{ kind: EntityKind }> = ({ kind }) => {
  const entityParams = safetyParams(useCurrentEntity(kind), ID_FALLBACK[kind]);
  const [view, setView] = useState<SuspensionView>('overall');

  const entityCounts = useAppSelector(state => SAFETY[kind].data.disciplineCount(state, entityParams));
  const stateCounts = useAppSelector(state => selectStateDisciplineCountData(state, {}));
  const countTypes = useAppSelector(selectDisciplineCountTypes);
  const entityEnrollment = useAppSelector(state => SAFETY[kind].data.enrollment(state, entityParams));
  const stateEnrollment = useAppSelector(state => selectStateEnrollmentData(state, {}));

  // Suspensions per 100 students: both kinds, or one with both beside it
  const chart = useMemo(() => {
    const typeId = (name: string) => countTypes.find(type => type.name.includes(name))?.id;
    const inSchool = typeId(IN_SCHOOL_SUSPENSION_TYPE);
    const outOfSchool = typeId(OUT_OF_SCHOOL_SUSPENSION_TYPE);
    if (inSchool === undefined || outOfSchool === undefined) return { rows: [] };
    const rates = (ids: number[]) => {
      const counted = (row: { count_type: { id: number } }) => ids.includes(row.count_type.id);
      return ratesByYear(
        countsByYear(entityCounts, row => row.count, counted),
        countsByYear(stateCounts, row => row.count, counted),
        entityEnrollment,
        stateEnrollment
      );
    };
    const all = rates([inSchool, outOfSchool]);
    return view === 'overall'
      ? { rows: all }
      : { rows: rates([view === 'in-school' ? inSchool : outOfSchool]), overall: { data: entityOnly(all), label: 'All Suspensions' } };
  }, [view, entityCounts, stateCounts, countTypes, entityEnrollment, stateEnrollment]);

  return (
    <Box sx={{ mt: 3 }}>
      <TrendChart
        title={VIEWS.find(option => option.value === view)!.title}
        subtitle="Per 100 Students"
        control={<ChartSelect value={view} options={VIEWS} onChange={setView} label="Suspensions to show" />}
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

export default EntitySuspensionTrendChart;
