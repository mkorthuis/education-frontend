import React, { useMemo, useState } from 'react';
import { Box } from '@mui/material';
import { useAppSelector } from '@/store/hooks';
import {
  selectEfaEntries,
  selectEfaStateEntries,
  selectEfaEntryTypes
} from '@/store/slices/efaSlice';
import {
  selectTownEnrollment,
  selectStateTownEnrollment
} from '@/store/slices/enrollmentSlice';
import { selectCurrentDistrict } from '@/store/slices/locationSlice';
import TrendChart from '@/features/state/components/TrendChart';
import ChartSelect from '@/features/state/components/ChartSelect';
import {
  EFA_BASE_AID,
  formatCompact,
  formatCount,
  formatPercent,
  formatSchoolYear,
  totalsByYear
} from '@/features/state/utils/stateMetrics';
import { enrolledByYear, ratesByYear, rateSeries } from '@/features/entity/trends';

type GrantsAs = 'count' | 'percentage';

// As on the State EFA page
const GRANTS_AS: { value: GrantsAs; label: string }[] = [
  { value: 'count', label: '# of Grants' },
  { value: 'percentage', label: 'Percentage' },
];

/** EFA grants by year: students with a grant, or their share of public school enrollment beside the state's */
const EfaTrendChart: React.FC = () => {
  const [grantsAs, setGrantsAs] = useState<GrantsAs>('count');
  const districtParams = { district_id: useAppSelector(selectCurrentDistrict)?.id };

  const entries = useAppSelector(state => selectEfaEntries(state, districtParams));
  const stateEntries = useAppSelector(state => selectEfaStateEntries(state, {}));
  const entryTypes = useAppSelector(selectEfaEntryTypes);
  const townEnrollment = useAppSelector(state => selectTownEnrollment(state, districtParams));
  const stateTownEnrollment = useAppSelector(state => selectStateTownEnrollment(state, {}));

  const chart = useMemo(() => {
    // Every EFA student gets base aid, so its count is the count of students, summed over the
    // district's towns. A year the state has and the district doesn't had no district students.
    const baseAid = entryTypes.find(type => type.name === EFA_BASE_AID)?.id;
    const students = (rows: { year: number; entry_type_id: number; value: number }[]) =>
      totalsByYear(rows, row => (row.entry_type_id === baseAid ? row.value : 0));
    const stateStudents = students(stateEntries);
    const districtTotals = new Map(students(entries).map(point => [point.year, point.value]));
    const districtStudents = [...new Set([...entries, ...stateEntries].map(row => row.year))]
      .sort((a, b) => a - b)
      .map(year => ({ year, value: districtTotals.get(year) ?? 0 }));
    const shares = ratesByYear(
      districtStudents,
      stateStudents,
      totalsByYear(townEnrollment, row => row.enrollment),
      enrolledByYear(stateTownEnrollment)
    );
    return {
      counts: districtStudents.map(point => ({ year: point.year, entity: point.value })),
      // Years with grants but no enrollment published yet are left out, as on the State EFA page
      shares: shares.filter(row => row.entity !== null),
      missing: shares.filter(row => row.entity === null).map(row => row.year),
    };
  }, [entries, stateEntries, entryTypes, townEnrollment, stateTownEnrollment]);

  return (
    <Box sx={{ mt: 3 }}>
      <TrendChart
        title="EFA Grants By Year"
        subtitle={grantsAs === 'count' ? 'Number of Students' : 'Percentage of Public School Enrollment'}
        shortSubtitle={grantsAs === 'count' ? '# of Students' : '% of Public School Enrollment'}
        control={<ChartSelect value={grantsAs} options={GRANTS_AS} onChange={setGrantsAs} label="Show EFA grants as" />}
        // The state's line only beside percentages
        series={grantsAs === 'count' ? rateSeries('district').slice(0, 1) : rateSeries('district')}
        emptyMessage="No EFA grant data available"
        {...(grantsAs === 'count'
          ? {
            data: chart.counts,
            format: formatCount,
            axisFormat: (value: number) => formatCompact(value),
          }
          : {
            data: chart.shares,
            format: (value: number) => formatPercent(value, 1),
            axisFormat: (value: number) => formatPercent(value, Number.isInteger(value) ? 0 : 1),
            note: chart.missing.length
              ? `${chart.missing.map(formatSchoolYear).join(', ')} isn't shown: the state hasn't published that year's enrollment yet.`
              : undefined,
          })}
      />
    </Box>
  );
};

export default EfaTrendChart;
