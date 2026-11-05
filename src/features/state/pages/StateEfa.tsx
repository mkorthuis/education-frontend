import React, { useMemo } from 'react';
import { Box, Divider, Link } from '@mui/material';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import StatePage from '../components/StatePage';
import StateTable from '../components/StateTable';
import TrendChart from '../components/TrendChart';
import { formatDollarsShort, formatThousands, shortYear, tileDelta } from '../utils/phrases';
import KeyFigures, { KeyFigure } from '../components/KeyFigures';
import { useStateLoads } from '../hooks/useStateLoads';
import { useStateEfaData } from '../hooks/useStatewideData';
import {
  EFA_BASE_AID,
  efaTotals,
  formatCompact,
  formatCompactDollars,
  formatCount,
  formatDollars,
  formatDollarsInWords,
  formatSchoolYear,
  pivotByYear,
  PRELIMINARY,
} from '../utils/stateMetrics';
import { EFA_AID_LABELS, plainLabel } from '../utils/labels';

const PAGE = PAGE_REGISTRY.state.efa;
const DOE_EFA_URL = 'https://education.nh.gov/pathways-education/education-freedom-accounts';
const CSF_EFA_URL = 'https://nh.scholarshipfund.org/apply/nh-education-freedom-accounts';

// Titles and prose name the year in full; tiles show the short year ("26/27") and say
// "Preliminary" in their note when it is
const yearText = (year: number) => `${formatSchoolYear(year)}${year === PRELIMINARY.efaYear ? ' (preliminary)' : ''}`;
const preliminaryNote = (year: number) => (year === PRELIMINARY.efaYear ? 'Preliminary' : undefined);

const StateEfa: React.FC = () => {
  const { loads, entries, entryTypes } = useStateEfaData();
  const { status, retry } = useStateLoads(loads);

  const totals = useMemo(() => efaTotals(entries, entryTypes), [entries, entryTypes]);
  const typeNames = useMemo(() => new Map(entryTypes.map(type => [type.id, type.name])), [entryTypes]);
  const aidName = (typeId: number) => plainLabel(EFA_AID_LABELS, typeNames.get(typeId) ?? `Type ${typeId}`);

  // Students receiving each kind of extra aid on top of the base amount (at most three lines, by size)
  const extraAid = useMemo(() => {
    const extra = entries.filter(row => typeNames.get(row.entry_type_id) !== EFA_BASE_AID);
    const rows = pivotByYear(extra, row => aidName(row.entry_type_id), row => row.value);
    const largest = new Map<string, number>();
    extra.forEach(row => {
      const name = aidName(row.entry_type_id);
      largest.set(name, Math.max(largest.get(name) ?? 0, row.value));
    });
    // "Extra: low-income (free or reduced-price meals)" is charted as "Low-income (free or reduced-price meals)"
    const sentenceCase = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
    const series = [...largest].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => {
      const short = sentenceCase(name.replace(/^Extra: /, ''));
      return { key: name, name: short, shortName: short.split(' (')[0] };
    });
    return { rows, series };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, typeNames]);

  const latest = totals.length ? totals[totals.length - 1] : null;
  const previous = totals.length > 1 ? totals[totals.length - 2] : null;
  const latestYear = latest?.year ?? null;
  const latestTable = useMemo(() => {
    if (!latestYear) return [];
    return entries
      .filter(row => row.year === latestYear)
      .map(row => {
        const amount = entryTypes.find(type => type.id === row.entry_type_id && type.year === row.year)?.value ?? null;
        return { aid: aidName(row.entry_type_id), students: row.value, amount, total: amount === null ? null : amount * row.value };
      })
      .sort((a, b) => b.students - a.students);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, entryTypes, typeNames, latestYear]);
  const tableTotal = latestTable.reduce((sum, row) => sum + (row.total ?? 0), 0);

  const keyFigures = useMemo(() => {
    const figures: KeyFigure[] = [];
    const takeaway: string[] = [];
    if (latest && typeof latest.students === 'number') {
      figures.push({
        label: 'EFA Students',
        value: formatCount(latest.students),
        shortValue: formatThousands(latest.students, 1),
        period: shortYear(latest.year),
        // Change since the year before
        delta: previous && typeof previous.students === 'number' && previous.students > 0
          ? tileDelta({
            from: { year: previous.year, value: previous.students },
            to: { year: latest.year, value: latest.students },
            change: latest.students - previous.students,
            percentChange: ((latest.students - previous.students) / previous.students) * 100,
          }, { unit: 'percent', higherIsBetter: true })
          : undefined,
        detail: latest.year === PRELIMINARY.efaYear ? `Preliminary count as of ${PRELIMINARY.efaAsOf}` : undefined,
        shortDetail: latest.year === PRELIMINARY.efaYear ? 'Preliminary' : undefined,
      });
      takeaway.push(`${formatCount(latest.students)} students have Education Freedom Accounts for ${formatSchoolYear(latest.year)}`
        + (latest.year === PRELIMINARY.efaYear ? ` (the state's preliminary count as of ${PRELIMINARY.efaAsOf})` : '')
        + (previous && typeof previous.students === 'number' ? `, up from ${formatCount(previous.students)} in ${formatSchoolYear(previous.year)}.` : '.'));
      if (latest.estimatedCost) {
        const perStudent = latest.estimatedCost / latest.students;
        figures.push({
          label: 'Estimated State Cost',
          value: formatDollarsShort(latest.estimatedCost),
          period: shortYear(latest.year),
          detail: [preliminaryNote(latest.year), 'From the state\'s aid amounts'].filter(Boolean).join('. '),
        });
        figures.push({
          label: 'Average per Student',
          value: formatDollars(Math.round(perStudent / 10) * 10),
          period: shortYear(latest.year),
          detail: [preliminaryNote(latest.year), 'Base amount plus any extra aid'].filter(Boolean).join('. '),
        });
        takeaway.push(`At the state's per-student aid amounts, that comes to about ${formatDollarsInWords(Math.round(latest.estimatedCost / 1e6) * 1e6)}, or about ${formatDollars(Math.round(perStudent / 10) * 10)} per student.`);
      }
    }
    return { figures, takeaway };
  }, [latest, previous]);

  return (
    <StatePage
      displayName={PAGE.displayName}
      status={status}
      onRetry={retry}
      errorMessage="Statewide Education Freedom Account data could not be loaded."
      intro={(
        <>
          Education Freedom Accounts (EFAs) give families state education aid to spend on private school, homeschooling or
          other approved costs. Every EFA student receives a base amount; some also qualify for extra aid. Who qualifies and
          how to apply: see the{' '}
          <Link href={DOE_EFA_URL} target="_blank" rel="noopener noreferrer">NH Department of Education's EFA page</Link>{' '}
          and the program administrator,{' '}
          <Link href={CSF_EFA_URL} target="_blank" rel="noopener noreferrer">Children's Scholarship Fund NH</Link>.
        </>
      )}
      keyFigures={<KeyFigures takeaway={keyFigures.takeaway} figures={keyFigures.figures} />}
      districtSection="efa"
      notCovered="Actual payments to families, EFA students by town, and the schools EFA students attend aren't on the site yet."
      source="NH Department of Education, Education Freedom Account aid calculations (RSA 194-F)"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, '& > *': { flex: 1, minWidth: 0 } }}>
          <TrendChart
            title="Students with Education Freedom Accounts"
            subtitle="Every EFA student, counted once"
            data={totals.map(row => ({ year: row.year, students: row.students }))}
            series={[{ key: 'students', name: 'EFA students' }]}
            format={formatCount}
            axisFormat={value => formatCompact(value)}
            note={latestYear === PRELIMINARY.efaYear ? `${formatSchoolYear(PRELIMINARY.efaYear)} is the state's preliminary count as of ${PRELIMINARY.efaAsOf}.` : undefined}
            csvName="nh-efa-students"
            csvUnit="students"
          />
          <TrendChart
            title="Estimated state cost"
            subtitle="Students in each aid category times that year's per-student amount"
            data={totals.filter(row => (row.estimatedCost ?? 0) > 0).map(row => ({ year: row.year, cost: row.estimatedCost }))}
            series={[{ key: 'cost', name: 'Estimated cost' }]}
            format={value => formatDollarsInWords(value)}
            axisFormat={formatCompactDollars}
            note="An estimate from the state's aid amounts, not actual payments to families."
            csvName="nh-efa-estimated-cost"
            csvUnit="dollars"
          />
        </Box>

        <Divider />

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, '& > *': { flex: 1, minWidth: 0 } }}>
          <TrendChart
            title="EFA students receiving extra aid"
            subtitle="On top of the base amount"
            data={extraAid.rows}
            series={extraAid.series}
            format={formatCount}
            axisFormat={value => formatCompact(value)}
            csvName="nh-efa-extra-aid"
            csvUnit="students"
          />
          <StateTable
            title={latestYear ? `Aid by category, ${yearText(latestYear)}` : 'Aid by category'}
            columns={[
              { key: 'aid', label: 'Aid category' },
              { key: 'students', label: 'Students', align: 'right', format: row => formatCount(row.students) },
              { key: 'amount', label: 'Per student', align: 'right', format: row => (row.amount === null ? '—' : formatDollars(row.amount)), hideOnPhone: true },
              { key: 'total', label: 'Estimated total', align: 'right', format: row => formatDollarsInWords(row.total) },
            ]}
            rows={latestTable}
            totalRow={latestTable.length ? { aid: 'Total', students: latest?.students ?? 0, amount: null, total: tableTotal } : undefined}
            note="Students can receive more than one kind of extra aid, so the total counts each student once (the base amount)."
            csvName={`nh-efa-aid-${latestYear ?? ''}`}
          />
        </Box>
      </Box>
    </StatePage>
  );
};

export default StateEfa;
