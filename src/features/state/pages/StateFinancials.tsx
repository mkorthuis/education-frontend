import React, { useMemo, useState } from 'react';
import { Box, Divider, ToggleButton, useMediaQuery, useTheme } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectAdjustForInflation, toggleInflationAdjustment } from '@/store/slices/financeSlice';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import StatePage from '../components/StatePage';
import StateTable from '../components/StateTable';
import { Note } from '@/components/ds';
import ChartRow from '../components/ChartRow';
import ChartSelect from '../components/ChartSelect';
import { compareByType, ComparisonRow, comparisonColumns, CompareYearPicker, useCompareYear } from '../components/CompareYear';
import TrendChart, { CONTEXT_COLOR, ENTITY_COLORS, SERIES_COLORS } from '../components/TrendChart';
import KeyFigures, { KeyFigure } from '../components/KeyFigures';
import { useStateLoads } from '../hooks/useStateLoads';
import { useStateEnrollmentData, useStateFinanceData } from '../hooks/useStatewideData';
import {
  adjustRowsForInflation,
  adjustSeriesForInflation,
  changeSince,
  describeChange,
  formatCompactDollars,
  formatDollars,
  formatPercent,
  formatSchoolYear,
  formatSignedPercent,
  latestPoint,
  mergeSeries,
  percentChange,
  percentChangeSeries,
  REVENUE_SOURCES,
  revenueBySource,
  SPENDING_GROUPS,
  SPENDING_LINES,
  spendingByLine,
  spendingShares,
  toSeries,
  valueIn,
  YearRow,
  YearValue,
} from '../utils/stateMetrics';
import { changedBy, formatDollarsShort, formatThousands, realChangeText, realPercentChange, shortYear, tileDelta } from '../utils/phrases';
import { asFraction, COUNT, DOLLARS, downloadWorkbook, ExcelSheet, ExcelValue, notesSheet, PERCENT } from '../utils/excel';

const PAGE = PAGE_REGISTRY.state.financials;
const TREND_YEARS = 10;

const LEVELS = [
  { key: 'total', name: 'All Grades', color: ENTITY_COLORS.total },
  { key: 'elementary', name: 'Elementary', color: ENTITY_COLORS.elementary },
  { key: 'middle', name: 'Middle', color: ENTITY_COLORS.middle },
  { key: 'high', name: 'High', color: ENTITY_COLORS.high },
] as const;

// In the latest year's dollars when the inflation switch is on
const toDollars = (series: YearValue[], adjust: boolean, latestYear: number | null) =>
  adjust && latestYear ? adjustSeriesForInflation(series, latestYear) : series;

type SpendingRow = ComparisonRow & { section: string };

// The cost per student chart shows all grades or the three school levels
type CostView = 'all' | 'levels';
const COST_VIEWS: { value: CostView; label: string }[] = [
  { value: 'all', label: 'All Grades' },
  { value: 'levels', label: 'By Grade Level' },
];
// Phones' shorter names for the spending table's categories
const SPENDING_PHONE_NAMES: Record<string, string> = {
  'Special Education': 'Special Ed.',
  'Support Services': 'Support Service',
};

// The spending share chart shows one category at a time
type SpendingGroupKey = typeof SPENDING_GROUPS[number]['key'];
const SPENDING_GROUP_OPTIONS = SPENDING_GROUPS.map(group => ({ value: group.key as SpendingGroupKey, label: group.name }));

const valuesOf = (rows: Record<string, number | null>[], keys: string[]) =>
  rows.flatMap(row => keys.map(key => row[key])).filter((value): value is number => typeof value === 'number');

const StateFinancials: React.FC = () => {
  const dispatch = useAppDispatch();
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));
  const adjustForInflation = useAppSelector(selectAdjustForInflation);
  const finance = useStateFinanceData();
  const enrollment = useStateEnrollmentData();
  const { status, retry } = useStateLoads([...finance.loads, ...finance.revenueLoads, ...finance.expenditureLoads, ...enrollment.loads]);

  const latestYear = useMemo(() => latestPoint(toSeries(finance.perPupil, row => row.total))?.year ?? null, [finance.perPupil]);

  // Both versions of the chart's dollars, so its axis covers both and stays put when the inflation
  // switch changes; the axis fits the lines the view shows
  const [costView, setCostView] = useState<CostView>('all');
  const [spendingGroup, setSpendingGroup] = useState<SpendingGroupKey>('instruction');
  const perPupil = useMemo(() => {
    const build = (adjust: boolean) => mergeSeries(Object.fromEntries(LEVELS.map(level => [
      level.key, toDollars(toSeries(finance.perPupil, row => row[level.key]), adjust, latestYear),
    ])));
    const nominal = build(false);
    const adjusted = build(true);
    const series = costView === 'all' ? LEVELS.filter(level => level.key === 'total') : LEVELS.filter(level => level.key !== 'total');
    return {
      rows: adjustForInflation ? adjusted : nominal,
      series,
      axis: valuesOf([...nominal, ...adjusted], series.map(level => level.key)),
    };
  }, [finance.perPupil, adjustForInflation, latestYear, costView]);

  // Students and spending as percent change over the same ten years as the overview
  const studentsVsSpending = useMemo(() => {
    const students = toSeries(enrollment.adm, row => row.total);
    const nominal = toSeries(finance.rollups, row => row.total);
    const latest = Math.min(latestPoint(students)?.year ?? 0, latestPoint(nominal)?.year ?? 0);
    if (!latest || !latestYear) return { rows: [], baseYear: null as number | null };
    const baseYear = Math.max(latest - TREND_YEARS, students[0]?.year ?? 0, nominal[0]?.year ?? 0);
    return {
      baseYear,
      rows: mergeSeries({
        students: percentChangeSeries(students, baseYear),
        spending: percentChangeSeries(nominal, baseYear),
        realSpending: percentChangeSeries(adjustSeriesForInflation(nominal, latestYear), baseYear),
      }).filter(row => row.year <= latest),
    };
  }, [enrollment.adm, finance.rollups, latestYear]);

  // Spending by DOE-25 line: each group's share each year, and the latest year by line against a
  // year the reader picks, like the Staff page's tables
  const spendingLines = useMemo(() => spendingByLine(finance.expenditure, finance.expenditureEntryTypes), [finance.expenditure, finance.expenditureEntryTypes]);
  const spendingGroupShares = useMemo(() => spendingShares(spendingLines), [spendingLines]);
  const spendingCompare = useCompareYear(spendingLines.map(row => row.year));
  // The table in dollars as spent, or every year in the latest year's dollars
  const [spendingAdjusted, setSpendingAdjusted] = useState(false);
  const spendingTable = useMemo(() => {
    const latest = spendingLines[spendingLines.length - 1];
    const byYear = spendingAdjusted && latest ? adjustRowsForInflation(spendingLines, latest.year) : spendingLines;
    // Only the lines the latest year has, in the table's order
    const order = SPENDING_LINES.filter(line => typeof latest?.[line.name] === 'number').map(line => line.name);
    const { year, rows, total } = compareByType(byYear, spendingCompare.year, line => line, 'All Spending', order);
    const sectioned: SpendingRow[] = rows.map(row => ({ ...row, section: SPENDING_LINES.find(line => line.name === row.type)?.section ?? '' }));
    return { year, rows: sectioned, total: total && { ...total, section: '' } };
  }, [spendingLines, spendingCompare.year, spendingAdjusted]);

  const revenue = useMemo(() => revenueBySource(finance.revenue, finance.revenueEntryTypes), [finance.revenue, finance.revenueEntryTypes]);
  const revenueShares = useMemo(() => revenue.map(row => {
    const total = REVENUE_SOURCES.reduce((sum, source) => sum + (row[source.key] ?? 0), 0);
    const shares: Record<string, number | null> = {};
    REVENUE_SOURCES.forEach(source => { shares[source.key] = total ? ((row[source.key] ?? 0) / total) * 100 : null; });
    return { year: row.year, ...shares } as YearRow;
  }), [revenue]);
  const latestRevenue = revenue[revenue.length - 1];
  const latestRevenueTotal = latestRevenue ? REVENUE_SOURCES.reduce((sum, source) => sum + (latestRevenue[source.key] ?? 0), 0) : 0;
  // The latest year by source against a year the reader picks, as received or in the latest year's dollars
  const revenueCompare = useCompareYear(revenue.map(row => row.year));
  const [revenueAdjusted, setRevenueAdjusted] = useState(false);
  const revenueTable = useMemo(() => {
    const byYear = revenueAdjusted && latestRevenue ? adjustRowsForInflation(revenue, latestRevenue.year) : revenue;
    const name = (key: string) => {
      const source = REVENUE_SOURCES.find(entry => entry.key === key);
      return (isMobile && source?.phoneName) || source?.name || key;
    };
    return compareByType(byYear, revenueCompare.year, name, 'Total', REVENUE_SOURCES.map(source => source.key));
  }, [revenue, latestRevenue, revenueCompare.year, revenueAdjusted, isMobile]);
  // How the state's share has moved, which is hard to read off stacked columns
  const stateShareText = useMemo(() => {
    const first = revenueShares[0];
    const last = revenueShares[revenueShares.length - 1];
    if (!first || !last || first === last || typeof first.state !== 'number' || typeof last.state !== 'number') return '';
    return `The state's share went from ${formatPercent(first.state)} in ${shortYear(first.year)} to ${formatPercent(last.state)} in ${shortYear(last.year)}.`;
  }, [revenueShares]);
  const localShare = latestRevenue && latestRevenueTotal ? ((latestRevenue.local ?? 0) / latestRevenueTotal) * 100 : null;

  const keyFigures = useMemo(() => {
    const perPupilSeries = toSeries(finance.perPupil, row => row.total);
    const spendingSeries = toSeries(finance.rollups, row => row.total);
    const studentSeries = toSeries(enrollment.adm, row => row.total);
    const latestPerPupil = latestPoint(perPupilSeries);
    const latestSpending = latestPoint(spendingSeries);
    const perPupilChange = changeSince(perPupilSeries, TREND_YEARS);
    const spendingChange = changeSince(spendingSeries, TREND_YEARS);
    const studentChange = spendingChange
      ? changeSince(studentSeries.filter(point => point.year <= spendingChange.to.year), spendingChange.to.year - spendingChange.from.year)
      : null;
    const figures: KeyFigure[] = [];
    const takeaway: string[] = [];
    if (latestPerPupil) {
      figures.push({
        label: 'Cost per Student',
        value: formatDollars(latestPerPupil.value),
        shortValue: `$${formatThousands(latestPerPupil.value)}`,
        period: shortYear(latestPerPupil.year),
        delta: tileDelta(perPupilChange, { unit: 'percent', higherIsBetter: false }),
        // The same change after inflation, under the value
        detail: realChangeText(perPupilChange),
      });
    }
    if (latestSpending) {
      figures.push({
        label: 'Total Spending',
        value: formatDollarsShort(latestSpending.value),
        shortValue: formatDollarsShort(latestSpending.value, 1),
        period: shortYear(latestSpending.year),
        delta: tileDelta(spendingChange, { unit: 'percent', higherIsBetter: false }),
        detail: realChangeText(spendingChange),
      });
    }
    if (localShare !== null && latestRevenue) {
      figures.push({
        label: 'Revenue Raised Locally',
        shortLabel: 'Raised Locally',
        value: formatPercent(localShare),
        period: shortYear(latestRevenue.year),
        // The change relative to the share then, like the other tiles; neither direction is better
        delta: tileDelta(changeSince(toSeries(revenueShares, row => row.local), TREND_YEARS), { unit: 'percent' }),
      });
    }
    if (spendingChange && studentChange && studentChange.from.year === spendingChange.from.year) {
      takeaway.push(`From ${formatSchoolYear(spendingChange.from.year)} to ${formatSchoolYear(spendingChange.to.year)}, the number of students went ${describeChange(studentChange.percentChange)}`
        + ` while total spending went ${describeChange(spendingChange.percentChange)} (${describeChange(realPercentChange(spendingChange))} after inflation).`);
    }
    // Support services spending, and the state's share of revenue, over the same years
    const supportLines = SPENDING_LINES.filter(line => line.section === 'Support Services').map(line => line.name);
    const supportChange = changeSince(
      spendingLines.map(row => ({ year: row.year, value: supportLines.reduce((sum, line) => sum + (row[line] ?? 0), 0) })),
      TREND_YEARS
    );
    if (supportChange) {
      takeaway.push(`Spending on support services ${changedBy(supportChange.percentChange)} since ${formatSchoolYear(supportChange.from.year)}.`);
    }
    const stateShareChange = changeSince(toSeries(revenueShares, row => row.state), TREND_YEARS);
    if (stateShareChange) {
      takeaway.push(`Meanwhile, the state's share of school funding ${changedBy(stateShareChange.percentChange)}.`);
    }
    return { figures, takeaway };
  }, [finance.perPupil, finance.rollups, enrollment.adm, localShare, latestRevenue, revenueShares, spendingLines]);

  // Everything on the page as one workbook: a sheet per chart or table, and the notes the page leaves out
  const downloadExcel = () => {
    const dollarsYear = latestYear ? `${formatSchoolYear(latestYear)} Dollars` : 'Today\'s Dollars';
    const tileRow = (figure: string, series: YearValue[], text: (value: number) => string, withInflation: boolean): ExcelValue[] => {
      const latest = latestPoint(series);
      const change = changeSince(series, TREND_YEARS);
      return [
        figure,
        latest ? formatSchoolYear(latest.year) : null,
        latest ? text(latest.value) : null,
        change ? change.percentChange / 100 : null,
        change && withInflation ? realPercentChange(change) / 100 : null,
        change ? formatSchoolYear(change.from.year) : null,
      ];
    };
    const yearColumn = { header: 'School Year', width: 12 };
    const localShares = toSeries(revenueShares, row => row.local);

    // Spending lines down the side and years across, each category's total above its lines
    const spendingYears = spendingLines.map(row => row.year);
    const breakdownSheet = (name: string, subtitle: string, byYear: YearRow[]): ExcelSheet => {
      const rows: ExcelValue[][] = [];
      const subtotalRows: number[] = [];
      const sum = (row: YearRow, lines: string[]) => lines.reduce((total, line) => total + (row[line] ?? 0), 0);
      [...new Set(SPENDING_LINES.map(line => line.section))].forEach(section => {
        const lines = SPENDING_LINES.filter(line => line.section === section && byYear.some(row => typeof row[line.name] === 'number')).map(line => line.name);
        if (!lines.length) return;
        subtotalRows.push(rows.length);
        rows.push([section, ...byYear.map(row => sum(row, lines))]);
        lines.forEach(line => rows.push([`    ${line}`, ...byYear.map(row => row[line] ?? null)]));
      });
      const allLines = SPENDING_LINES.map(line => line.name);
      return {
        name,
        subtitle,
        columns: [{ header: 'Category', width: 36 }, ...spendingYears.map(year => ({ header: formatSchoolYear(year), width: 15, format: DOLLARS }))],
        rows,
        subtotalRows,
        totalRow: ['All Spending', ...byYear.map(row => sum(row, allLines))],
      };
    };

    const perPupilAdjusted = latestYear ? adjustSeriesForInflation(toSeries(finance.perPupil, row => row.total), latestYear) : [];
    const spendingSeries = toSeries(finance.rollups, row => row.total);
    const spendingAdjustedSeries = latestYear ? adjustSeriesForInflation(spendingSeries, latestYear) : [];
    const studentSeries = toSeries(enrollment.adm, row => row.total);
    const revenueTotal = (row: YearRow) => REVENUE_SOURCES.reduce((sum, source) => sum + (row[source.key] ?? 0), 0);

    const sheets: ExcelSheet[] = [
      {
        name: 'Key Figures',
        columns: [
          { header: 'Figure', width: 24 },
          { header: 'School Year', width: 12 },
          { header: 'Value', width: 12 },
          { header: 'Change', format: PERCENT },
          { header: 'After Inflation', width: 16, format: PERCENT },
          { header: 'Since', width: 12 },
        ],
        rows: [
          tileRow('Cost per Student', toSeries(finance.perPupil, row => row.total), formatDollars, true),
          tileRow('Total Spending', spendingSeries, value => formatDollarsShort(value), true),
          tileRow('Revenue Raised Locally', localShares, value => formatPercent(value), false),
        ],
      },
      breakdownSheet('Spending Breakdown By Year', 'Districts\' reported spending by category, less bond principal and transfers between funds', spendingLines),
      ...(spendingLines.length
        ? [breakdownSheet('Spending Breakdown, Adjusted', `In ${dollarsYear.toLowerCase()}`, adjustRowsForInflation(spendingLines, spendingLines[spendingLines.length - 1].year))]
        : []),
      {
        name: 'Change in Spending',
        title: studentsVsSpending.baseYear ? `Change in Spending Since ${formatSchoolYear(studentsVsSpending.baseYear)}` : 'Change in Spending',
        subtitle: `Total spending, as spent and in ${dollarsYear.toLowerCase()}, and students (average daily membership)`,
        columns: [
          yearColumn,
          { header: 'Total Spending', width: 16, format: DOLLARS },
          { header: `In ${dollarsYear}`, width: 22, format: DOLLARS },
          { header: '# of Students', width: 14, format: COUNT },
          { header: 'Total Spending, % Change', width: 16, format: PERCENT, wrap: true },
          { header: 'After Inflation, % Change', width: 16, format: PERCENT, wrap: true },
          { header: '# of Students, % Change', width: 16, format: PERCENT, wrap: true },
        ],
        rows: studentsVsSpending.rows.map(row => [
          formatSchoolYear(row.year),
          valueIn(spendingSeries, row.year),
          valueIn(spendingAdjustedSeries, row.year),
          valueIn(studentSeries, row.year),
          asFraction(row.spending),
          asFraction(row.realSpending),
          asFraction(row.students),
        ]),
      },
      {
        name: 'Cost per Student',
        subtitle: 'Less tuition and transportation, per student',
        columns: [
          yearColumn,
          ...LEVELS.map(level => ({ header: level.name, width: 14, format: DOLLARS })),
          { header: `All Grades, In ${dollarsYear}`, width: 24, format: DOLLARS },
        ],
        rows: [...finance.perPupil].sort((a, b) => a.year - b.year).map(row => [
          formatSchoolYear(row.year),
          ...LEVELS.map(level => row[level.key] ?? null),
          valueIn(perPupilAdjusted, row.year),
        ]),
      },
      {
        name: 'Where School Spending Goes',
        subtitle: 'Percentage of district spending, less bond principal and transfers between funds',
        columns: [yearColumn, ...SPENDING_GROUPS.map(group => ({ header: group.name, width: 16, format: PERCENT }))],
        rows: spendingGroupShares.map(row => [formatSchoolYear(row.year), ...SPENDING_GROUPS.map(group => asFraction(row[group.key]))]),
      },
      {
        name: 'Revenue By Source',
        subtitle: 'District revenue, as received',
        columns: [
          yearColumn,
          ...REVENUE_SOURCES.map(source => ({ header: source.name, width: 16, format: DOLLARS })),
          { header: 'Total', width: 16, format: DOLLARS },
        ],
        rows: revenue.map(row => [formatSchoolYear(row.year), ...REVENUE_SOURCES.map(source => row[source.key] ?? null), revenueTotal(row)]),
      },
      {
        name: 'Where School Revenue Comes From',
        subtitle: 'Percentage of district revenue',
        columns: [yearColumn, ...REVENUE_SOURCES.map(source => ({ header: source.name, width: 16, format: PERCENT }))],
        rows: revenueShares.map(row => [formatSchoolYear(row.year), ...REVENUE_SOURCES.map(source => asFraction(row[source.key]))]),
      },
      notesSheet('Financials for New Hampshire', [
        'Sources: NH Department of Education DOE-25 district annual financial reports (spending by category and revenue), the statewide expenditure summary (total spending) and cost per pupil reports; students are average daily membership.',
        'Total spending is NH DOE\'s total expenditures for elementary and secondary education. The spending breakdown is districts\' reported spending by line, less bond principal and transfers between funds, so its total differs slightly from total spending.',
        'Cost per student is NH DOE\'s cost per pupil: current spending less tuition and transportation, divided by average daily membership.',
        'Revenue and spending come from different state reports, so the totals don\'t match. Revenue includes borrowing (bond sales) and money moved between a district\'s own funds, shown as borrowing and transfers. Local revenue is mostly property taxes.',
        `Figures in ${dollarsYear.toLowerCase()} are adjusted with the consumer price index (CPI-U, U.S. city average).`,
      ]),
    ];
    return downloadWorkbook('nh-financials.xlsx', sheets);
  };

  return (
    <StatePage
      displayName={PAGE.displayName}
      onDownload={downloadExcel}
      status={status}
      onRetry={retry}
      errorMessage="Statewide financial data could not be loaded."
      intro="What New Hampshire school districts spend, per student and in total, and where the money comes from."
      takeaway={keyFigures.takeaway}
      keyFigures={<KeyFigures figures={keyFigures.figures} centerLastTile />}
      keyFiguresBesideIntro
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <ChartRow>
          <StateTable
            title="Spending Breakdown By Year"
            control={(
              <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 1 }}>
                {/* Like the Staff page's salary chart button */}
                <ToggleButton
                  value="adjusted"
                  size="small"
                  selected={spendingAdjusted}
                  onChange={() => setSpendingAdjusted(adjusted => !adjusted)}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Adj. For Inflation
                </ToggleButton>
                {spendingCompare.year !== null && (
                  <CompareYearPicker years={spendingCompare.years} year={spendingCompare.year} onChange={spendingCompare.setYear} label="Compare spending with" />
                )}
              </Box>
            )}
            columns={comparisonColumns<SpendingRow>(
              'Category',
              spendingTable.year,
              spendingCompare.year,
              row => (isMobile && SPENDING_PHONE_NAMES[row.type]) || row.type,
              value => formatDollarsShort(value)
            )}
            rows={spendingTable.rows}
            totalRow={spendingTable.total}
            sectionOf={row => row.section}
            // Each category's totals, opening to its lines
            sectionSummary={(section, lines) => {
              const count = lines.reduce((sum, line) => sum + line.count, 0);
              const before = lines.some(line => line.before !== null) ? lines.reduce((sum, line) => sum + (line.before ?? 0), 0) : null;
              return { type: section, section, count, before, change: percentChange(count, before) };
            }}
            note={isMobile ? undefined : "Districts' reported spending by category, less bond principal and transfers between funds."}
          />
          <TrendChart
            title={studentsVsSpending.baseYear ? `Change in Spending Since ${formatSchoolYear(studentsVsSpending.baseYear)}` : 'Change in Spending'}
            showViewToggle={false}
            data={studentsVsSpending.rows}
            series={[
              { key: 'spending', name: 'Total Spending', phoneName: 'Total Spend', color: SERIES_COLORS[1] },
              { key: 'realSpending', name: 'Total Spending, After Inflation', shortName: 'After Inflation', phoneName: 'After Inflation', color: ENTITY_COLORS.adjusted },
              { key: 'students', name: '# of Students', phoneName: '# Students', color: CONTEXT_COLOR },
            ]}
            format={value => formatSignedPercent(value)}
            axis="span"
          />
        </ChartRow>

        <Divider />

        <ChartRow>
          <TrendChart
            title="Cost per Student"
            subtitle="Less Tuition and Transportation, per Student"
            showViewToggle={false}
            control={(
              <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 1 }}>
                {/* Like the Staff page's salary chart button */}
                <ToggleButton
                  value="adjusted"
                  size="small"
                  selected={adjustForInflation}
                  onChange={() => dispatch(toggleInflationAdjustment())}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Adj. For Inflation
                </ToggleButton>
                <ChartSelect value={costView} options={COST_VIEWS} onChange={setCostView} label="Show cost per student" />
              </Box>
            )}
            data={perPupil.rows}
            series={perPupil.series}
            format={formatDollars}
            axisFormat={formatCompactDollars}
            // Starts just under the lowest cost, without a note saying so
            axis="span"
            axisIncludes={perPupil.axis}
          />
          <TrendChart
            title="Where School Spending Goes"
            subtitle="Percentage of District Spending"
            showViewToggle={false}
            control={<ChartSelect value={spendingGroup} options={SPENDING_GROUP_OPTIONS} onChange={setSpendingGroup} label="Show spending category" />}
            data={spendingGroupShares}
            // Each category in its own color
            series={SPENDING_GROUPS.flatMap((group, index) => (group.key === spendingGroup ? [{ key: group.key, name: group.name, color: SERIES_COLORS[index] }] : []))}
            format={value => formatPercent(value, 1)}
            axisFormat={value => formatPercent(value)}
            axis="span"
          />
        </ChartRow>

        <Divider />

        <ChartRow>
          <StateTable
            title="Revenue By Source"
            control={(
              <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 1 }}>
                <ToggleButton
                  value="adjusted"
                  size="small"
                  selected={revenueAdjusted}
                  onChange={() => setRevenueAdjusted(adjusted => !adjusted)}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Adj. For Inflation
                </ToggleButton>
                {revenueCompare.year !== null && (
                  <CompareYearPicker years={revenueCompare.years} year={revenueCompare.year} onChange={revenueCompare.setYear} label="Compare revenue with" />
                )}
              </Box>
            )}
            columns={comparisonColumns('Source', revenueTable.year, revenueCompare.year, undefined, value => formatDollarsShort(value))}
            rows={revenueTable.rows}
            totalRow={revenueTable.total}
          />
          <TrendChart
            title="Where School Revenue Comes From"
            subtitle="Percentage of District Revenue"
            kind="share"
            showViewToggle={false}
            data={revenueShares}
            series={REVENUE_SOURCES.map(source => ({ key: source.key, name: source.name, phoneName: source.phoneName }))}
            format={value => formatPercent(value, 1)}
            axisFormat={value => formatPercent(value)}
            note={`Local revenue is mostly property taxes by each town.${stateShareText ? ` ${stateShareText}` : ''}`}
          />
        </ChartRow>

        <Note title="National Comparisons Coming Soon">
          This page will show how New Hampshire&apos;s school funding and spending compare with the nation and with other states.
        </Note>
      </Box>
    </StatePage>
  );
};

export default StateFinancials;
