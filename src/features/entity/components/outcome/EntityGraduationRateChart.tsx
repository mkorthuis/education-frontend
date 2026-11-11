import React, { useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import * as outcomeSlice from '@/store/slices/outcomeSlice';
import TrendChart from '@/features/state/components/TrendChart';
import ChartSelect from '@/features/state/components/ChartSelect';
import { AxisMode, formatPercent, graduationRates, toSeries } from '@/features/state/utils/stateMetrics';
import { EntityKind, useRouteId } from '@/features/entity/entity';
import { OUTCOME } from '@/features/entity/bindings/outcome';
import { besideState, RATE_SERIES } from '@/features/entity/trends';

// graduationRates' keys
type Outcome = 'graduated' | 'hiset' | 'droppedOut';

const OUTCOMES: { value: Outcome; label: string; axis: AxisMode; note?: string }[] = [
  { value: 'graduated', label: 'Graduation Rate', axis: 'fit' },
  {
    value: 'hiset',
    label: 'HiSET Pass Rate',
    axis: 'zero',
    note: "The HiSET is a high school equivalency test: students who don't graduate can pass it for a credential equal to a diploma.",
  },
  { value: 'droppedOut', label: 'Dropout Rate', axis: 'zero' },
];

const classYear = (year: number) => String(year);

/** Each class's graduation, HiSET or dropout rate beside the state's */
const EntityGraduationRateChart: React.FC<{ kind: EntityKind }> = ({ kind }) => {
  const [outcome, setOutcome] = useState<Outcome>('graduated');
  const entityParams = OUTCOME[kind].params(useRouteId());
  const entityCohorts = useAppSelector(state => OUTCOME[kind].select.graduationCohort(state, entityParams));
  const stateCohorts = useAppSelector(state => outcomeSlice.selectStateGraduationCohortData(state, {}));
  const picked = OUTCOMES.find(option => option.value === outcome)!;

  // The share of each class that started grade 9 together
  const entityRates = useMemo(() => graduationRates(entityCohorts), [entityCohorts]);
  const stateRates = useMemo(() => graduationRates(stateCohorts), [stateCohorts]);
  const rows = useMemo(
    () => besideState(toSeries(entityRates, row => row[outcome]), toSeries(stateRates, row => row[outcome])),
    [entityRates, stateRates, outcome]
  );

  return (
    <TrendChart
      title={`${picked.label} By Class`}
      shortTitle={picked.label}
      // As on the State Graduation page
      subtitle="Percentage of Each Class That Started Grade 9 Together"
      shortSubtitle="% of Each Class That Started Grade 9"
      control={<ChartSelect value={outcome} options={OUTCOMES} onChange={setOutcome} label="Rate to show" />}
      data={rows}
      series={RATE_SERIES[kind]}
      format={value => formatPercent(value, 1)}
      axisFormat={value => formatPercent(value)}
      axis={picked.axis}
      yearLabel={classYear}
      yearHeader="Class of"
      note={picked.note}
    />
  );
};

export default EntityGraduationRateChart;
