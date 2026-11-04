import React, { useMemo } from 'react';
import { Box, Divider } from '@mui/material';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import StatePage from '../components/StatePage';
import StateTable from '../components/StateTable';
import TrendChart from '../components/TrendChart';
import { useStateLoads } from '../hooks/useStateLoads';
import { useStateEfaData } from '../hooks/useStatewideData';
import { EFA_BASE_AID, efaTotals, formatCount, formatDollars, formatSchoolYear, pivotByYear } from '../utils/stateMetrics';

const PAGE = PAGE_REGISTRY.state.efa;

const formatMillions = (value: number) => `$${(value / 1e6).toFixed(1)}M`;

const StateEfa: React.FC = () => {
  const { loads, entries, entryTypes } = useStateEfaData();
  const { status, retry } = useStateLoads(loads);

  const totals = useMemo(() => efaTotals(entries, entryTypes), [entries, entryTypes]);
  const typeNames = useMemo(() => new Map(entryTypes.map(type => [type.id, type.name])), [entryTypes]);

  // Students receiving each kind of extra aid on top of base aid (at most three lines, by size)
  const extraAid = useMemo(() => {
    const extra = entries.filter(row => typeNames.get(row.entry_type_id) !== EFA_BASE_AID);
    const rows = pivotByYear(extra, row => typeNames.get(row.entry_type_id) ?? `Type ${row.entry_type_id}`, row => row.value);
    const largest = new Map<string, number>();
    extra.forEach(row => {
      const name = typeNames.get(row.entry_type_id) ?? `Type ${row.entry_type_id}`;
      largest.set(name, Math.max(largest.get(name) ?? 0, row.value));
    });
    const series = [...largest].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => ({ key: name, name }));
    return { rows, series };
  }, [entries, typeNames]);

  const latestYear = totals.length ? totals[totals.length - 1].year : null;
  const latestTable = useMemo(() => {
    if (!latestYear) return [];
    return entries
      .filter(row => row.year === latestYear)
      .map(row => {
        const amount = entryTypes.find(type => type.id === row.entry_type_id && type.year === row.year)?.value ?? null;
        return {
          aid: typeNames.get(row.entry_type_id) ?? `Type ${row.entry_type_id}`,
          students: row.value,
          amount,
          total: amount === null ? null : amount * row.value,
        };
      })
      .sort((a, b) => b.students - a.students);
  }, [entries, entryTypes, typeNames, latestYear]);

  return (
    <StatePage
      displayName={PAGE.displayName}
      status={status}
      onRetry={retry}
      errorMessage="Statewide Education Freedom Account data could not be loaded."
      intro="Education Freedom Accounts (EFAs) give families state education aid to spend on private school, homeschooling or other approved costs. Every EFA student receives base aid; some also qualify for extra aid."
      source="NH Department of Education, Education Freedom Account aid calculations (RSA 194-F)"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, '& > *': { flex: 1, minWidth: 0 } }}>
          <TrendChart
            title="Students with Education Freedom Accounts"
            subtitle="(Students receiving base aid)"
            data={totals.map(row => ({ year: row.year, students: row.students }))}
            series={[{ key: 'students', name: 'EFA students' }]}
            format={formatCount}
            csvName="nh-efa-students"
          />
          <TrendChart
            title="Estimated State Cost"
            subtitle="(Students in each aid category times that year's per-student amount)"
            data={totals.filter(row => (row.estimatedCost ?? 0) > 0).map(row => ({ year: row.year, cost: row.estimatedCost }))}
            series={[{ key: 'cost', name: 'Estimated cost' }]}
            format={formatDollars}
            axisFormat={formatMillions}
            note="An estimate from the state's aid calculations, not actual payments to families."
            csvName="nh-efa-estimated-cost"
          />
        </Box>

        <Divider />

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, '& > *': { flex: 1, minWidth: 0 } }}>
          <TrendChart
            title="EFA Students Receiving Extra Aid"
            data={extraAid.rows}
            series={extraAid.series}
            format={formatCount}
            csvName="nh-efa-extra-aid"
          />
          <StateTable
            title={latestYear ? `Aid by Category, ${formatSchoolYear(latestYear)}` : 'Aid by Category'}
            columns={[
              { key: 'aid', label: 'Aid category' },
              { key: 'students', label: 'Students', align: 'right', format: row => formatCount(row.students) },
              { key: 'amount', label: 'Per student', align: 'right', format: row => formatDollars(row.amount) },
              { key: 'total', label: 'Estimated total', align: 'right', format: row => formatDollars(row.total) },
            ]}
            rows={latestTable}
            csvName={`nh-efa-aid-${latestYear ?? ''}`}
          />
        </Box>
      </Box>
    </StatePage>
  );
};

export default StateEfa;
