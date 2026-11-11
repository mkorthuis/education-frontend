import React, { useMemo } from 'react';
import TrendChart from '@/features/state/components/TrendChart';
import { formatPercent, REMOTE_BAND } from '@/features/state/utils/stateMetrics';
import { EntityKind } from '@/features/entity/entity';
import { IdFallback } from '@/features/entity/bindings/safety';
import { RATE_SERIES } from '@/features/entity/trends';
import { useSafetyRates } from './useSafetyRates';

const ID_FALLBACK: Record<EntityKind, IdFallback> = { school: 'none', district: 'none' };

const YEARS_SHOWN = 10;

const EntityTruancyHistoryChart: React.FC<{ kind: EntityKind }> = ({ kind }) => {
  const rates = useSafetyRates(kind, 'truancy', ID_FALLBACK[kind]);

  // The percentage of students who were truant over the district's (or school's) latest ten years
  const rows = useMemo(() => {
    const all = rates(row => row.count);
    const latest = all[all.length - 1]?.year ?? 0;
    return all.filter(row => row.year > latest - YEARS_SHOWN);
  }, [rates]);

  return (
    <TrendChart
      sx={{ mt: 3 }}
      // Titled as on the State Safety page
      title="Share of Students Who Were Truant"
      shortTitle="% Students Truant"
      subtitle="Students With 10 or More Half-Days of Unexcused Absence, as a Percentage of Enrollment"
      shortSubtitle="10+ Half Days Unexcused"
      data={rows}
      series={RATE_SERIES[kind]}
      format={value => formatPercent(value, 1)}
      axisFormat={value => formatPercent(value)}
      bands={REMOTE_BAND}
    />
  );
};

export default EntityTruancyHistoryChart;
