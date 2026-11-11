import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { useAppSelector } from '@/store/hooks';
import TrendChart from '@/features/state/components/TrendChart';
import { REMOTE_BAND } from '@/features/state/utils/stateMetrics';
import { EntityKind, useCurrentEntity } from '@/features/entity/entity';
import { SAFETY, STATE_SAFETY, IdFallback, safetyParams } from '@/features/entity/bindings/safety';
import { countsByYear, formatPer100, formatPer100Axis, rateSeries, ratesByYear } from './safetyTrends';

const ID_FALLBACK: Record<EntityKind, IdFallback> = { school: 'zero', district: 'zero' };

const TITLES = { restraint: 'Restraint Reports By Year', seclusion: 'Seclusion Reports By Year' };

interface EntityRestraintTrendChartProps {
  kind: EntityKind;
  measure: 'restraint' | 'seclusion';
}

/** Restraints, or seclusions, reported per 100 students */
const EntityRestraintTrendChart: React.FC<EntityRestraintTrendChartProps> = ({ kind, measure }) => {
  const entityParams = safetyParams(useCurrentEntity(kind), ID_FALLBACK[kind]);

  const entityReports = useAppSelector(state => SAFETY[kind].data[measure](state, entityParams));
  const stateReports = useAppSelector(state => STATE_SAFETY.data[measure](state, {}));
  const entityEnrollment = useAppSelector(state => SAFETY[kind].data.enrollment(state, entityParams));
  const stateEnrollment = useAppSelector(state => STATE_SAFETY.data.enrollment(state, {}));

  const rows = useMemo(() => ratesByYear(
    countsByYear<{ year: number; generated: number }>(entityReports, row => row.generated),
    countsByYear<{ year: number; generated: number }>(stateReports, row => row.generated),
    entityEnrollment,
    stateEnrollment
  ), [entityReports, stateReports, entityEnrollment, stateEnrollment]);

  return (
    <Box sx={{ mt: 3 }}>
      <TrendChart
        title={TITLES[measure]}
        subtitle="Per 100 Students"
        data={rows}
        series={rateSeries(kind)}
        format={formatPer100}
        axisFormat={formatPer100Axis}
        bands={REMOTE_BAND}
      />
    </Box>
  );
};

export default EntityRestraintTrendChart;
