import React, { useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import * as outcomeSlice from '@/store/slices/outcomeSlice';
import TrendChart from '@/features/state/components/TrendChart';
import ChartSelect from '@/features/state/components/ChartSelect';
import { formatPercent, postGraduationShares, YearRow } from '@/features/state/utils/stateMetrics';
import { PLAN_LABELS, plainLabel } from '@/features/state/utils/labels';
import { POST_GRADUATION_TYPE_ORDER } from '@/features/district/utils/outcomeDataProcessing';
import { EntityKind, useRouteId } from '@/features/entity/entity';
import { OUTCOME } from '@/features/entity/bindings/outcome';
import { besideState, RATE_SERIES } from '@/features/entity/trends';

const FOUR_YEAR_COLLEGE = '4 Year College';

const classYear = (year: number) => String(year);

const planOrder = (name: string) => {
  const index = POST_GRADUATION_TYPE_ORDER.indexOf(name as typeof POST_GRADUATION_TYPE_ORDER[number]);
  return index < 0 ? POST_GRADUATION_TYPE_ORDER.length : index;
};

/** One plan's share of each class's graduates beside the state's, four-year college first */
const EntityWhatIsNextChart: React.FC<{ kind: EntityKind }> = ({ kind }) => {
  const [chosen, setChosen] = useState(FOUR_YEAR_COLLEGE);
  const entityParams = OUTCOME[kind].params(useRouteId());
  const planTypes = useAppSelector(outcomeSlice.selectPostGraduationTypes);
  const entityPlans = useAppSelector(state => OUTCOME[kind].select.postGraduation(state, entityParams));
  const statePlans = useAppSelector(state => outcomeSlice.selectStatePostGraduationData(state, {}));

  // The plans in the district pages' order, with the State pages' names
  const options = useMemo(() => [...planTypes]
    .sort((a, b) => planOrder(a.name) - planOrder(b.name))
    .map(type => ({ value: type.name, label: plainLabel(PLAN_LABELS, type.name) })), [planTypes]);
  const plan = options.some(option => option.value === chosen) ? chosen : options[0]?.value ?? FOUR_YEAR_COLLEGE;

  const entityShares = useMemo(() => postGraduationShares(entityPlans), [entityPlans]);
  const stateShares = useMemo(() => postGraduationShares(statePlans), [statePlans]);
  // A plan missing from a class's reports had no graduates
  const rows = useMemo(() => {
    const share = (shares: YearRow[]) => shares.map(row => ({ year: row.year, value: row[plan] ?? 0 }));
    return besideState(share(entityShares), share(stateShares));
  }, [entityShares, stateShares, plan]);

  return (
    <TrendChart
      // The picker names the plan, as on the district schools enrollment chart
      title="Graduates' Plans After High School"
      shortTitle="Graduates' Plans"
      subtitle="Percentage of Graduates"
      control={<ChartSelect value={plan} options={options} onChange={setChosen} label="Plan to show" />}
      data={rows}
      series={RATE_SERIES[kind]}
      format={value => formatPercent(value, 1)}
      axisFormat={value => formatPercent(value)}
      yearLabel={classYear}
      yearHeader="Class of"
      note="Reported by high school graduates. Not confirmed."
    />
  );
};

export default EntityWhatIsNextChart;
