import React, { useMemo, useState } from 'react';
import { Box, Divider, Link } from '@mui/material';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import StatePage from '../components/StatePage';
import StateTable from '../components/StateTable';
import ChartRow from '../components/ChartRow';
import ChartSelect from '../components/ChartSelect';
import TrendChart, { SERIES_COLORS } from '../components/TrendChart';
import { formatDollarsShort, formatThousands, shortYear, tileDelta } from '../utils/phrases';
import KeyFigures, { KeyFigure } from '../components/KeyFigures';
import { useStateLoads } from '../hooks/useStateLoads';
import { useStateEfaData, useStateEnrollmentByTypeData } from '../hooks/useStatewideData';
import { StudentGroup, useStatewideGroups } from '../hooks/useStatewideGroups';
import {
  changeFrom,
  efaTotals,
  formatCompact,
  formatCompactDollars,
  formatCount,
  formatDollars,
  formatDollarsInWords,
  formatPercent,
  formatSchoolYear,
  pivotByYear,
  PRELIMINARY,
  publicStudents,
  shareOfEnrollment,
  toSeries,
} from '../utils/stateMetrics';
import { EFA_AID_LABELS, plainLabel, titleCase } from '../utils/labels';
import { asFraction, COUNT, DOLLARS, downloadWorkbook, ExcelSheet, notesSheet, PERCENT } from '../utils/excel';

const PAGE = PAGE_REGISTRY.state.efa;
const DOE_EFA_URL = 'https://education.nh.gov/pathways-education/education-freedom-accounts';
const CSF_EFA_URL = 'https://nh.scholarshipfund.org/apply/nh-education-freedom-accounts';

// Lighter tints of the first two series colors, for the statewide lines
const STATE_TINTS = ['#8fbaeb', '#f4a98b'];

// Extra aid compared with all public school students: the EFA aid type, the statewide group it
// matches, and one hue for both lines: full strength for EFA students, a lighter tint for the
// state, so the EFA lines lead. English learners are left off to keep the chart readable.
const COMPARED_AID: { aid: string; name: string; group: StudentGroup; statewideName: string; color: string; statewideColor: string }[] = [
  {
    aid: 'Federal Free & Reduced (F&R) Price Meal Eligible',
    name: 'EFA Low Income',
    group: 'lowIncome',
    statewideName: 'State Low Income',
    color: SERIES_COLORS[0],
    statewideColor: STATE_TINTS[0],
  },
  {
    aid: 'Special Education Aid',
    name: 'EFA Special Education',
    group: 'specialEducation',
    statewideName: 'State Special Education',
    color: SERIES_COLORS[1],
    statewideColor: STATE_TINTS[1],
  },
];
const statewideKey = (aid: string) => `statewide:${aid}`;

const GRANTS_AS: { value: 'count' | 'percentage'; label: string }[] = [
  { value: 'count', label: '# of Grants' },
  { value: 'percentage', label: 'Percentage' },
];

const StateEfa: React.FC = () => {
  const { loads, entries, entryTypes } = useStateEfaData();
  const publicEnrollment = useStateEnrollmentByTypeData();
  const { status, retry } = useStateLoads([...loads, ...publicEnrollment.loads]);
  // The grants chart shows a count or a share of public school enrollment, like the district pages
  const [grantsAs, setGrantsAs] = useState<'count' | 'percentage'>('count');

  const totals = useMemo(() => efaTotals(entries, entryTypes), [entries, entryTypes]);
  const typeNames = useMemo(() => new Map(entryTypes.map(type => [type.id, type.name])), [entryTypes]);

  const statewideGroups = useStatewideGroups();

  // The share of EFA students receiving low-income and special education aid on top of the base
  // amount, each beside the share of all public school students in that group (dashed, same color)
  const extraAid = useMemo(() => {
    const studentsByYear = new Map(totals.map(row => [row.year, row.students]));
    const share = (row: { year: number; value: number }) => {
      const students = studentsByYear.get(row.year);
      return typeof students === 'number' && students > 0 ? (row.value / students) * 100 : 0;
    };
    const compared = new Set(COMPARED_AID.map(aid => aid.aid));
    const extra = entries.filter(row => compared.has(typeNames.get(row.entry_type_id) ?? '') && typeof studentsByYear.get(row.year) === 'number');
    const rows = pivotByYear(extra, row => typeNames.get(row.entry_type_id) ?? '', share);
    const present = COMPARED_AID.filter(aid => rows.some(row => typeof row[aid.aid] === 'number'));
    // Statewide figures only for the EFA years, so the chart's years stay the program's. Each group's
    // statewide line runs as far as its data does.
    const statewideThrough = new Map<StudentGroup, number>();
    rows.forEach(row => present.forEach(aid => {
      const point = (statewideGroups[aid.group] ?? []).find(entry => entry.year === row.year);
      row[statewideKey(aid.aid)] = point ? point.value : null;
      if (point) statewideThrough.set(aid.group, Math.max(statewideThrough.get(aid.group) ?? point.year, point.year));
    }));
    const statewide = present.filter(aid => statewideThrough.has(aid.group));
    const series = [
      ...present.map(aid => ({ key: aid.aid, name: aid.name, color: aid.color })),
      ...statewide.map(aid => ({ key: statewideKey(aid.aid), name: aid.statewideName, color: aid.statewideColor, dashed: true })),
    ];
    // "through 2025-26", naming any group whose statewide figures stop sooner
    const latest = Math.max(...statewideThrough.values());
    const shorter = statewide.filter(aid => statewideThrough.get(aid.group)! < latest)
      .map(aid => `${aid.statewideName.replace(/^State /, '').toLowerCase()} through ${formatSchoolYear(statewideThrough.get(aid.group)!)}`);
    const note = statewide.length
      ? `Dashed lines: All New Hampshire public school students, through ${formatSchoolYear(latest)}${shorter.length ? `; ${shorter.join('; ')}` : ''}.`
      : undefined;
    return { rows, series, note };
  }, [entries, typeNames, totals, statewideGroups]);

  // Grants as a percentage of public school enrollment, for years with both: October 1 students in
  // kindergarten to grade 12, the grades EFA students are in
  const grantShare = useMemo(() => {
    const enrolled = new Map(publicStudents(publicEnrollment.byType, { k12: true }).map(point => [point.year, point.value]));
    const counts = totals.flatMap(row => (typeof row.students === 'number' ? [{ year: row.year, value: row.students }] : []));
    const shares = shareOfEnrollment(counts, [...enrolled].map(([year, value]) => ({ year, value })));
    const missing = counts.filter(point => !shares.some(share => share.year === point.year)).map(point => point.year);
    return { rows: shares.map(point => ({ year: point.year, grants: point.value })), missing, enrolled };
  }, [totals, publicEnrollment.byType]);

  const latest = totals.length ? totals[totals.length - 1] : null;
  const previous = totals.length > 1 ? totals[totals.length - 2] : null;
  const latestYear = latest?.year ?? null;
  // EFA students now against the year before
  const studentChange = useMemo(
    () => (previous ? changeFrom(toSeries(totals, row => row.students), previous.year) : null),
    [totals, previous]
  );
  const latestTable = useMemo(() => {
    if (!latestYear) return [];
    return entries
      .filter(row => row.year === latestYear)
      .map(row => {
        const amount = entryTypes.find(type => type.id === row.entry_type_id && type.year === row.year)?.value ?? null;
        const aid = plainLabel(EFA_AID_LABELS, typeNames.get(row.entry_type_id) ?? `Type ${row.entry_type_id}`);
        return { aid, students: row.value, amount, total: amount === null ? null : amount * row.value };
      })
      .sort((a, b) => b.students - a.students);
  }, [entries, entryTypes, typeNames, latestYear]);
  const tableTotal = latestTable.reduce((sum, row) => sum + (row.total ?? 0), 0);

  const keyFigures = useMemo(() => {
    const figures: KeyFigure[] = [];
    if (latest && typeof latest.students === 'number') {
      figures.push({
        label: 'EFA Students',
        value: formatCount(latest.students),
        shortValue: formatThousands(latest.students, 1),
        period: shortYear(latest.year),
        // Change since the year before
        delta: tileDelta(studentChange, { unit: 'percent', higherIsBetter: true }),
      });
      if (latest.estimatedCost) {
        const perStudent = latest.estimatedCost / latest.students;
        figures.push({
          label: 'Estimated State Cost',
          value: formatDollarsShort(latest.estimatedCost),
          period: shortYear(latest.year),
        });
        figures.push({
          label: 'Average per Student',
          value: formatDollars(Math.round(perStudent / 10) * 10),
          period: shortYear(latest.year),
        });
      }
    }
    return figures;
  }, [latest, studentChange]);

  // Everything on the page in one workbook: a sheet per tile row, chart and table, then notes
  const downloadExcel = () => {
    const sheets: ExcelSheet[] = [
      {
        name: 'Key Figures',
        subtitle: latest ? `Education Freedom Accounts in New Hampshire, ${formatSchoolYear(latest.year)}` : undefined,
        columns: [
          { header: 'School Year', width: 12 },
          { header: 'EFA Students', format: COUNT },
          { header: previous ? `Change from ${formatSchoolYear(previous.year)}` : 'Change', width: 20, format: PERCENT },
          { header: 'Estimated State Cost', width: 20, format: DOLLARS },
          { header: 'Average per Student', width: 20, format: DOLLARS },
        ],
        rows: latest ? [[
          formatSchoolYear(latest.year),
          latest.students,
          asFraction(studentChange?.percentChange),
          latest.estimatedCost,
          latest.estimatedCost && typeof latest.students === 'number' ? latest.estimatedCost / latest.students : null,
        ]] : [],
      },
      {
        name: 'EFA Grants By Year',
        subtitle: 'Students with an EFA grant, and their share of public school enrollment',
        columns: [
          { header: 'School Year', width: 12 },
          { header: 'EFA Grants', format: COUNT },
          { header: 'K-12 Public School Enrollment', width: 28, format: COUNT },
          { header: '% of Public School Enrollment', width: 28, format: PERCENT },
        ],
        rows: totals.map(row => [
          formatSchoolYear(row.year),
          row.students,
          grantShare.enrolled.get(row.year) ?? null,
          asFraction(grantShare.rows.find(share => share.year === row.year)?.grants),
        ]),
      },
      {
        name: 'EFA State Cost By Year',
        subtitle: 'Estimated state aid amounts, not actual payments',
        columns: [{ header: 'School Year', width: 12 }, { header: 'Estimated State Cost', width: 20, format: DOLLARS }],
        rows: totals.filter(row => (row.estimatedCost ?? 0) > 0).map(row => [formatSchoolYear(row.year), row.estimatedCost]),
      },
      {
        name: 'Extra Aid By Year',
        title: '% EFA Students Receiving Extra Aid By Year',
        subtitle: 'EFA students receiving extra aid in addition to the base amount, beside all public school students in the same group',
        columns: [
          { header: 'School Year', width: 12 },
          ...COMPARED_AID.flatMap(aid => [
            { header: `${aid.name} (%)`, width: 26, format: PERCENT },
            { header: `${aid.statewideName} (%)`, width: 26, format: PERCENT },
          ]),
        ],
        rows: extraAid.rows.map(row => [
          formatSchoolYear(row.year),
          ...COMPARED_AID.flatMap(aid => [asFraction(row[aid.aid]), asFraction(row[statewideKey(aid.aid)])]),
        ]),
      },
      {
        name: latestYear ? `Aid by Category ${formatSchoolYear(latestYear)}` : 'Aid by Category',
        title: latestYear ? `Aid by Category, ${formatSchoolYear(latestYear)}` : 'Aid by Category',
        subtitle: 'EFA students and estimated state aid in each aid category',
        columns: [
          { header: 'Aid Category', width: 48 },
          { header: 'Students', format: COUNT },
          { header: 'Per Student', format: DOLLARS },
          { header: 'Estimated Total', width: 18, format: DOLLARS },
        ],
        rows: latestTable.map(row => [titleCase(row.aid), row.students, row.amount, row.total]),
        totalRow: latestTable.length ? ['Total', latest?.students ?? null, null, tableTotal] : undefined,
      },
      notesSheet('Education Freedom Accounts for New Hampshire', [
        ...(latestYear === PRELIMINARY.efaYear
          ? [`${formatSchoolYear(PRELIMINARY.efaYear)} numbers are preliminary, from the state's count as of ${PRELIMINARY.efaAsOf}; other years are final.`]
          : []),
        'EFA grants, estimated cost and aid by category: NH Department of Education, Education Freedom Account aid calculations (RSA 194-F). Estimated cost is the students in each aid category times that year\'s per-student amount, not actual payments to families.',
        'Public school enrollment: NH Department of Education, State Totals Ten Years Public and Private Fall Enrollments (October 1, kindergarten to grade 12, in district, academy, charter and interstate schools).',
        'State Low Income: NH Department of Education, Free Reduced K-12 School Lunch Eligibility Rates by School (statewide, as of October 1).',
        'State Special Education: NH Department of Education school metrics, "Students with Disability (%)", district figures weighted by enrollment.',
        'Students can receive more than one kind of extra aid, so the aid table\'s total counts each student once (the base amount).',
      ]),
    ];
    return downloadWorkbook('nh-education-freedom-accounts.xlsx', sheets);
  };

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
          {latestYear === PRELIMINARY.efaYear && (
            <>
              {' '}{formatSchoolYear(PRELIMINARY.efaYear)} numbers are preliminary; other years are final.
            </>
          )}
        </>
      )}
      keyFigures={<KeyFigures figures={keyFigures} centerLastTile />}
      keyFiguresBesideIntro
      onDownload={downloadExcel}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <ChartRow>
          <TrendChart
            title="EFA Grants By Year"
            subtitle={grantsAs === 'count' ? 'Number of Students' : 'Percentage of Public School Enrollment'}
            shortSubtitle={grantsAs === 'count' ? '# of Students' : '% of Public School Enrollment'}
            control={<ChartSelect value={grantsAs} options={GRANTS_AS} onChange={setGrantsAs} label="Show EFA grants as" />}
            showViewToggle={false}
            {...(grantsAs === 'count'
              ? {
                data: totals.map(row => ({ year: row.year, grants: row.students })),
                format: formatCount,
                axisFormat: (value: number) => formatCompact(value),
              }
              : {
                data: grantShare.rows,
                format: (value: number) => formatPercent(value, 1),
                // Whole percents, or one decimal for steps like 2.5%
                axisFormat: (value: number) => formatPercent(value, Number.isInteger(value) ? 0 : 1),
                note: grantShare.missing.length
                  ? `${grantShare.missing.map(formatSchoolYear).join(', ')} isn't shown: the state hasn't published that year's enrollment yet.`
                  : undefined,
              })}
            series={[{ key: 'grants', name: 'EFA grants' }]}
          />
          <TrendChart
            title="EFA State Cost By Year"
            showViewToggle={false}
            // Shown on phones too: it's the only place the chart says these aren't actual payments
            subtitle="Estimated State Aid Amounts, Not Actual Payments"
            data={totals.filter(row => (row.estimatedCost ?? 0) > 0).map(row => ({ year: row.year, cost: row.estimatedCost }))}
            series={[{ key: 'cost', name: 'Estimated cost' }]}
            format={value => formatDollarsInWords(value)}
            axisFormat={formatCompactDollars}
          />
        </ChartRow>

        <Divider />

        <ChartRow>
          <TrendChart
            title="% EFA Students Receiving Extra Aid By Year"
            shortTitle="% EFA Students w/ Extra Aid By Year"
            showViewToggle={false}
            subtitle="In Addition to Base Amount"
            data={extraAid.rows}
            series={extraAid.series}
            format={value => formatPercent(value, 1)}
            axisFormat={value => formatPercent(value)}
            yDomain={[0, 100]}
            note={extraAid.note}
          />
          <StateTable
            title={latestYear ? `Aid by Category, ${formatSchoolYear(latestYear)}` : 'Aid by Category'}
            columns={[
              { key: 'aid', label: 'Aid Category', format: row => titleCase(row.aid) },
              { key: 'students', label: 'Students', align: 'right', format: row => formatCount(row.students) },
              { key: 'amount', label: 'Per Student', align: 'right', format: row => (row.amount === null ? '—' : formatDollars(row.amount)), hideOnPhone: true },
              {
                key: 'total',
                label: 'Estimated Total',
                shortLabel: 'Total',
                align: 'right',
                // "$54.4 Million", in the table's Title Case
                format: row => titleCase(formatDollarsInWords(row.total)),
                shortFormat: row => (row.total === null ? '—' : formatDollarsShort(row.total)),
              },
            ]}
            rows={latestTable}
            totalRow={latestTable.length ? { aid: 'Total', students: latest?.students ?? 0, amount: null, total: tableTotal } : undefined}
            note="Students can receive more than one kind of extra aid, so the total counts each student once (the base amount)."
          />
        </ChartRow>
      </Box>
    </StatePage>
  );
};

export default StateEfa;
