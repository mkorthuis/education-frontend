import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { useAppSelector } from '@/store/hooks';
import {
  selectStateTruancyData,
  selectStateEnrollmentData
} from '@/store/slices/safetySlice';
import { BaseTruancyData } from '@/store/slices/safety/types';
import TrendChart from '@/features/state/components/TrendChart';
import { formatPercent, REMOTE_BAND } from '@/features/state/utils/stateMetrics';
import { EntityKind, useCurrentEntity } from '@/features/entity/entity';
import { SAFETY, IdFallback, safetyParams } from '@/features/entity/bindings/safety';
import { countsByYear, rateSeries, ratesByYear } from './safetyTrends';

const ID_FALLBACK: Record<EntityKind, IdFallback> = { school: 'none', district: 'none' };

const YEARS_SHOWN = 10;

const EntityTruancyHistoryChart: React.FC<{ kind: EntityKind }> = ({ kind }) => {
  const entityParams = safetyParams(useCurrentEntity(kind), ID_FALLBACK[kind]);

  const entityTruancy = useAppSelector(state => SAFETY[kind].data.truancy(state, entityParams));
  const stateTruancy = useAppSelector(state => selectStateTruancyData(state, {}));
  const entityEnrollment = useAppSelector(state => SAFETY[kind].data.enrollment(state, entityParams));
  const stateEnrollment = useAppSelector(state => selectStateEnrollmentData(state, {}));

  // The percentage of students who were truant, over the latest ten years of either's data
  const rows = useMemo(() => {
    const latest = Math.max(0, ...entityTruancy.map(row => row.year), ...stateTruancy.map(row => row.year));
    const recent = entityTruancy.filter(row => row.year > latest - YEARS_SHOWN);
    return ratesByYear(
      countsByYear<BaseTruancyData>(recent, row => row.count),
      countsByYear(stateTruancy, row => row.count),
      entityEnrollment,
      stateEnrollment,
      1
    );
  }, [entityTruancy, stateTruancy, entityEnrollment, stateEnrollment]);

  return (
    <Box sx={{ mt: 3 }}>
      {/* Titled as on the State Safety page */}
      <TrendChart
        title="Share of Students Who Were Truant"
        shortTitle="% Students Truant"
        subtitle="Students With 10 or More Half-Days of Unexcused Absence, as a Percentage of Enrollment"
        shortSubtitle="10+ Half Days Unexcused"
        data={rows}
        series={rateSeries(kind)}
        format={value => formatPercent(value, 1)}
        axisFormat={value => formatPercent(value)}
        bands={REMOTE_BAND}
      />
    </Box>
  );
};

export default EntityTruancyHistoryChart;
