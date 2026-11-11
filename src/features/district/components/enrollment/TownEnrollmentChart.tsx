import React, { useMemo, useState } from 'react';
import { TownEnrollmentData } from '@/services/api/endpoints/enrollments';
import { Town } from '@/store/slices/locationSlice';
import TrendChart from '@/features/state/components/TrendChart';
import ChartSelect from '@/features/state/components/ChartSelect';
import { formatCompact, formatCount, mergeSeries, REMOTE_BAND, totalsByYear } from '@/features/state/utils/stateMetrics';

export interface TownEnrollmentChartProps {
  enrollmentData: TownEnrollmentData[];
  towns: Town[];
}

const ALL_TOWNS = 'all';

/** Students living in the district's towns each year, in all of them or one */
const TownEnrollmentChart: React.FC<TownEnrollmentChartProps> = ({ enrollmentData, towns }) => {
  const [town, setTown] = useState<number | string>(ALL_TOWNS);

  const options = useMemo(() => [
    { value: ALL_TOWNS, label: 'All Towns' },
    ...towns.map(entry => ({ value: entry.id, label: entry.name })),
  ], [towns]);

  const rows = useMemo(() => mergeSeries({
    students: totalsByYear(enrollmentData, row => (town === ALL_TOWNS || row.town_id === town ? row.enrollment : 0)),
  }), [enrollmentData, town]);

  return (
    <TrendChart
      title="Current Students"
      subtitle="# of Students"
      control={towns.length > 1 ? <ChartSelect value={town} options={options} onChange={setTown} label="Town" /> : undefined}
      data={rows}
      series={[{ key: 'students', name: 'Students' }]}
      format={formatCount}
      axisFormat={value => formatCompact(value)}
      axis="fit"
      bands={REMOTE_BAND}
    />
  );
};

export default TownEnrollmentChart;
