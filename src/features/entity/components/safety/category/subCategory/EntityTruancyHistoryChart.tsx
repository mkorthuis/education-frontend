import React, { useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  selectStateTruancyData,
  selectStateEnrollmentData
} from '@/store/slices/safetySlice';
import { EntityKind, useCurrentEntity } from '@/features/entity/entity';
import { SAFETY, IdFallback, safetyParams } from '@/features/entity/bindings/safety';
import { BaseTruancyData } from '@/store/slices/safety/types';
import SafetyTrendChart from './SafetyTrendChart';
import { countsByYear, ratesByYear } from './safetyTrends';

const ID_FALLBACK: Record<EntityKind, IdFallback> = { school: 'none', district: 'none' };

// The latest ten years
const YEARS_SHOWN = 10;

const EntityTruancyHistoryChart: React.FC<{ kind: EntityKind }> = ({ kind }) => {
  const entity = useCurrentEntity(kind);
  const entityParams = safetyParams(entity, ID_FALLBACK[kind]);

  const entityTruancy = useAppSelector(state => SAFETY[kind].data.truancy(state, entityParams));
  const stateTruancy = useAppSelector(state => selectStateTruancyData(state, {}));
  const entityEnrollment = useAppSelector(state => SAFETY[kind].data.enrollment(state, entityParams));
  const stateEnrollment = useAppSelector(state => selectStateEnrollmentData(state, {}));

  // The percentage of students who were truant, over the latest ten years of the district's (or
  // school's) and the state's data
  const rows = useMemo(() => {
    const latest = Math.max(0, ...entityTruancy.map(row => row.year), ...stateTruancy.map(row => row.year));
    return ratesByYear(
      entityTruancy.map(row => row.year).filter(year => year > latest - YEARS_SHOWN),
      countsByYear<BaseTruancyData>(entityTruancy, row => row.count),
      countsByYear(stateTruancy, row => row.count),
      entityEnrollment,
      stateEnrollment,
      1
    );
  }, [entityTruancy, stateTruancy, entityEnrollment, stateEnrollment]);

  return (
    <SafetyTrendChart
      kind={kind}
      // As on the State Safety page
      title="Share of Students Who Were Truant"
      shortTitle="% Students Truant"
      subtitle="Students With 10 or More Half-Days of Unexcused Absence, as a Percentage of Enrollment"
      shortSubtitle="10+ Half Days Unexcused"
      rows={rows}
      percent
    />
  );
};

export default EntityTruancyHistoryChart;
