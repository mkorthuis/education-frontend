import React, { useMemo } from 'react';
import TrendChart from '@/features/state/components/TrendChart';
import { REMOTE_BAND } from '@/features/state/utils/stateMetrics';
import { EntityKind } from '@/features/entity/entity';
import { IdFallback } from '@/features/entity/bindings/safety';
import { formatPer100, formatPer100Axis, RATE_SERIES } from '@/features/entity/trends';
import { useSafetyRates } from './useSafetyRates';

const ID_FALLBACK: Record<EntityKind, IdFallback> = { school: 'zero', district: 'zero' };

const TITLES = { restraint: 'Restraint Reports By Year', seclusion: 'Seclusion Reports By Year' };

interface EntityRestraintTrendChartProps {
  kind: EntityKind;
  measure: 'restraint' | 'seclusion';
}

/** Restraints, or seclusions, reported per 100 students */
const EntityRestraintTrendChart: React.FC<EntityRestraintTrendChartProps> = ({ kind, measure }) => {
  const rates = useSafetyRates(kind, measure, ID_FALLBACK[kind]);
  const rows = useMemo(() => rates(row => row.generated), [rates]);

  return (
    <TrendChart
      sx={{ mt: 3 }}
      title={TITLES[measure]}
      subtitle="Per 100 Students"
      data={rows}
      series={RATE_SERIES[kind]}
      format={formatPer100}
      axisFormat={formatPer100Axis}
      bands={REMOTE_BAND}
    />
  );
};

export default EntityRestraintTrendChart;
