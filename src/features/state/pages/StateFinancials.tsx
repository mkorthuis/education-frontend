import React, { useMemo, useState } from 'react';
import { Box, Divider, ToggleButton, useMediaQuery, useTheme } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectAdjustForInflation, toggleInflationAdjustment } from '@/store/slices/financeSlice';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import StatePage from '../components/StatePage';
import StateTable from '../components/StateTable';
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
  YearRow,
  YearValue,
} from '../utils/stateMetrics';
import { formatDollarsShort, formatThousands, realChangeText, realPercentChange, shortYear, tileDelta } from '../utils/phrases';

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
    const changed = (change: number) => `${change > 0 ? 'increased' : 'decreased'} ${Math.abs(Math.round(change))}%`;
    const supportLines = SPENDING_LINES.filter(line => line.section === 'Support Services').map(line => line.name);
    const supportChange = changeSince(
      spendingLines.map(row => ({ year: row.year, value: supportLines.reduce((sum, line) => sum + (row[line] ?? 0), 0) })),
      TREND_YEARS
    );
    if (supportChange) {
      takeaway.push(`Spending on support services ${changed(supportChange.percentChange)} since ${formatSchoolYear(supportChange.from.year)}.`);
    }
    const stateShareChange = changeSince(toSeries(revenueShares, row => row.state), TREND_YEARS);
    if (stateShareChange) {
      takeaway.push(`Meanwhile, the state's share of school funding ${changed(stateShareChange.percentChange)}.`);
    }
    return { figures, takeaway };
  }, [finance.perPupil, finance.rollups, enrollment.adm, localShare, latestRevenue, revenueShares, spendingLines]);

  return (
    <StatePage
      displayName={PAGE.displayName}
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
      </Box>
    </StatePage>
  );
};

export default StateFinancials;
