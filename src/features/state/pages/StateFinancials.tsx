import React, { useMemo } from 'react';
import { Box, Divider, FormControlLabel, Switch, Typography } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectAdjustForInflation, toggleInflationAdjustment } from '@/store/slices/financeSlice';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import StatePage from '../components/StatePage';
import StateTable from '../components/StateTable';
import TrendChart, { CONTEXT_COLOR, ENTITY_COLORS, SERIES_COLORS } from '../components/TrendChart';
import KeyFigures, { KeyFigure } from '../components/KeyFigures';
import { useStateLoads } from '../hooks/useStateLoads';
import { useStateEnrollmentData, useStateFinanceData } from '../hooks/useStatewideData';
import {
  adjustSeriesForInflation,
  changeSince,
  describeChange,
  formatCompactDollars,
  formatDollars,
  formatDollarsInWords,
  formatPercent,
  formatSchoolYear,
  formatSignedPercent,
  latestPoint,
  mergeSeries,
  percentChangeSeries,
  REVENUE_SOURCES,
  revenueBySource,
  toSeries,
  YearRow,
  YearValue,
} from '../utils/stateMetrics';
import { changeText, realChangeText, realPercentChange } from '../utils/phrases';

const PAGE = PAGE_REGISTRY.state.financials;
const TREND_YEARS = 10;

const LEVELS = [
  { key: 'total', name: 'All grades', color: ENTITY_COLORS.total },
  { key: 'elementary', name: 'Elementary', color: ENTITY_COLORS.elementary },
  { key: 'middle', name: 'Middle', color: ENTITY_COLORS.middle },
  { key: 'high', name: 'High', color: ENTITY_COLORS.high },
] as const;

// In the latest year's dollars when the inflation switch is on
const toDollars = (series: YearValue[], adjust: boolean, latestYear: number | null) =>
  adjust && latestYear ? adjustSeriesForInflation(series, latestYear) : series;

const valuesOf = (rows: Record<string, number | null>[], keys: string[]) =>
  rows.flatMap(row => keys.map(key => row[key])).filter((value): value is number => typeof value === 'number');

const StateFinancials: React.FC = () => {
  const dispatch = useAppDispatch();
  const adjustForInflation = useAppSelector(selectAdjustForInflation);
  const finance = useStateFinanceData();
  const enrollment = useStateEnrollmentData();
  const { status, retry } = useStateLoads([...finance.loads, ...finance.revenueLoads, ...enrollment.loads]);

  const latestYear = useMemo(() => latestPoint(toSeries(finance.perPupil, row => row.total))?.year ?? null, [finance.perPupil]);
  const dollarsYear = latestYear ? formatSchoolYear(latestYear) : '';

  // Both versions of each dollar chart, so its axis can cover both and stay put when the switch changes
  const perPupil = useMemo(() => {
    const build = (adjust: boolean) => mergeSeries(Object.fromEntries(LEVELS.map(level => [
      level.key, toDollars(toSeries(finance.perPupil, row => row[level.key]), adjust, latestYear),
    ])));
    const nominal = build(false);
    const adjusted = build(true);
    return { rows: adjustForInflation ? adjusted : nominal, axis: valuesOf([...nominal, ...adjusted], LEVELS.map(level => level.key)) };
  }, [finance.perPupil, adjustForInflation, latestYear]);

  const spending = useMemo(() => {
    const nominal = toSeries(finance.rollups, row => row.total);
    const adjusted = toDollars(nominal, true, latestYear);
    return {
      rows: (adjustForInflation ? adjusted : nominal).map(point => ({ year: point.year, total: point.value })),
      axis: [...nominal, ...adjusted].map(point => point.value),
    };
  }, [finance.rollups, adjustForInflation, latestYear]);

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

  const revenue = useMemo(() => revenueBySource(finance.revenue, finance.revenueEntryTypes), [finance.revenue, finance.revenueEntryTypes]);
  const revenueShares = useMemo(() => revenue.map(row => {
    const total = REVENUE_SOURCES.reduce((sum, source) => sum + (row[source.key] ?? 0), 0);
    const shares: Record<string, number | null> = {};
    REVENUE_SOURCES.forEach(source => { shares[source.key] = total ? ((row[source.key] ?? 0) / total) * 100 : null; });
    return { year: row.year, ...shares } as YearRow;
  }), [revenue]);
  const latestRevenue = revenue[revenue.length - 1];
  const latestRevenueTotal = latestRevenue ? REVENUE_SOURCES.reduce((sum, source) => sum + (latestRevenue[source.key] ?? 0), 0) : 0;
  // How the state's share has moved, which is hard to read off stacked columns
  const stateShareText = useMemo(() => {
    const first = revenueShares[0];
    const last = revenueShares[revenueShares.length - 1];
    if (!first || !last || first === last || typeof first.state !== 'number' || typeof last.state !== 'number') return '';
    return `The state's share went from ${formatPercent(first.state, 1)} in ${formatSchoolYear(first.year)} to ${formatPercent(last.state, 1)} in ${formatSchoolYear(last.year)}.`;
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
        label: 'Cost per student',
        value: formatDollars(latestPerPupil.value),
        period: formatSchoolYear(latestPerPupil.year),
        change: changeText(perPupilChange),
        detail: realChangeText(perPupilChange),
      });
    }
    if (latestSpending) {
      figures.push({
        label: 'Total spending',
        value: formatDollarsInWords(latestSpending.value),
        period: formatSchoolYear(latestSpending.year),
        change: changeText(spendingChange),
        detail: realChangeText(spendingChange),
      });
    }
    if (localShare !== null && latestRevenue) {
      figures.push({
        label: 'Revenue raised locally',
        value: formatPercent(localShare),
        period: formatSchoolYear(latestRevenue.year),
        detail: 'Mostly town property taxes',
      });
    }
    if (spendingChange && studentChange && studentChange.from.year === spendingChange.from.year) {
      takeaway.push(`From ${formatSchoolYear(spendingChange.from.year)} to ${formatSchoolYear(spendingChange.to.year)}, the number of students went ${describeChange(studentChange.percentChange)}`
        + ` while total spending went ${describeChange(spendingChange.percentChange)} (${describeChange(realPercentChange(spendingChange))} after inflation).`);
    }
    if (latestPerPupil) {
      takeaway.push(`Schools spent ${formatDollars(latestPerPupil.value)} per student in ${formatSchoolYear(latestPerPupil.year)}.`);
    }
    return { figures, takeaway };
  }, [finance.perPupil, finance.rollups, enrollment.adm, localShare, latestRevenue]);

  const dollarNote = adjustForInflation && latestYear
    ? `In ${dollarsYear} dollars (adjusted for inflation with the Consumer Price Index).`
    : 'Dollars as spent each year, not adjusted for inflation.';

  return (
    <StatePage
      displayName={PAGE.displayName}
      status={status}
      onRetry={retry}
      errorMessage="Statewide financial data could not be loaded."
      intro="What New Hampshire school districts spend, per student and in total, and where the money comes from."
      keyFigures={<KeyFigures takeaway={keyFigures.takeaway} figures={keyFigures.figures} />}
      districtSection="financials"
      notCovered="Statewide spending by category (such as instruction, administration and transportation) isn't on these pages yet; each district's Financials page breaks down its own spending. Tuition paid between towns and each town's school property tax rate aren't on the site yet."
      source="NH Department of Education, DOE-25 district financial reports and cost per pupil reports"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <TrendChart
          title={studentsVsSpending.baseYear ? `Students and spending since ${formatSchoolYear(studentsVsSpending.baseYear)}` : 'Students and spending'}
          subtitle={studentsVsSpending.baseYear ? `Percent change from ${formatSchoolYear(studentsVsSpending.baseYear)}` : undefined}
          data={studentsVsSpending.rows}
          series={[
            { key: 'students', name: 'Students', color: CONTEXT_COLOR },
            { key: 'spending', name: 'Total spending', color: SERIES_COLORS[1] },
            { key: 'realSpending', name: 'Total spending, after inflation', shortName: 'After inflation', color: ENTITY_COLORS.adjusted },
          ]}
          format={value => formatSignedPercent(value)}
          axis="span"
          note="Shows whether spending kept pace with the number of students. Students are average daily membership."
          csvName="nh-students-vs-spending"
          csvUnit={studentsVsSpending.baseYear ? `% change from ${formatSchoolYear(studentsVsSpending.baseYear)}` : '% change'}
        />

        <Divider />

        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 2 }}>
          <FormControlLabel
            control={<Switch checked={adjustForInflation} onChange={() => dispatch(toggleInflationAdjustment())} />}
            label={<Typography sx={{ fontWeight: 500 }}>Show in today's dollars (adjusted for inflation)</Typography>}
          />
          <Typography variant="body2" color="text.secondary">
            {adjustForInflation ? `On: in ${dollarsYear} dollars.` : 'Off: dollars as spent.'} Applies to the two charts below.
          </Typography>
        </Box>

        <TrendChart
          title="Cost per student by school level"
          subtitle="Day-to-day spending, less tuition and transportation, per student"
          data={perPupil.rows}
          series={[...LEVELS]}
          format={formatDollars}
          axisFormat={formatCompactDollars}
          axis="fit"
          axisIncludes={perPupil.axis}
          note={dollarNote}
          csvName={`nh-cost-per-student${adjustForInflation ? '-inflation-adjusted' : ''}`}
          csvUnit={adjustForInflation ? `${dollarsYear} dollars` : 'dollars as spent'}
        />

        <TrendChart
          title="Total school district spending"
          subtitle="All funds, statewide"
          data={spending.rows}
          series={[{ key: 'total', name: 'Total spending' }]}
          format={value => formatDollarsInWords(value)}
          axisFormat={formatCompactDollars}
          axisIncludes={spending.axis}
          note={dollarNote}
          csvName={`nh-total-spending${adjustForInflation ? '-inflation-adjusted' : ''}`}
          csvUnit={adjustForInflation ? `${dollarsYear} dollars` : 'dollars as spent'}
        />

        <Divider />

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, '& > *': { flex: 1, minWidth: 0 } }}>
          <TrendChart
            title="Where school revenue comes from"
            subtitle="Percentage of district revenue"
            kind="share"
            data={revenueShares}
            series={REVENUE_SOURCES.map(source => ({ key: source.key, name: source.name }))}
            format={value => formatPercent(value, 1)}
            axisFormat={value => formatPercent(value)}
            note={`Local revenue is mostly property taxes raised by each town.${stateShareText ? ` ${stateShareText}` : ''}`}
            csvName="nh-revenue-by-source"
            csvUnit="% of revenue"
          />
          <StateTable
            title={latestRevenue ? `Revenue by source, ${formatSchoolYear(latestRevenue.year)}` : 'Revenue by source'}
            columns={[
              { key: 'name', label: 'Source' },
              { key: 'amount', label: 'Amount', align: 'right', format: row => formatDollarsInWords(row.amount) },
              { key: 'share', label: 'Share', align: 'right', format: row => formatPercent(row.share, 1) },
            ]}
            rows={latestRevenue ? REVENUE_SOURCES.map(source => ({
              name: source.name as string,
              amount: latestRevenue[source.key] ?? 0,
              share: latestRevenueTotal ? ((latestRevenue[source.key] ?? 0) / latestRevenueTotal) * 100 : null,
            })) : []}
            totalRow={latestRevenue ? { name: 'Total', amount: latestRevenueTotal, share: 100 } : undefined}
            note="Revenue and spending come from different state reports, so the totals don't match. Revenue includes borrowing (bond sales) and money moved between a district's own funds, shown as borrowing and transfers."
            csvName={`nh-revenue-by-source-${latestRevenue?.year ?? ''}`}
          />
        </Box>
      </Box>
    </StatePage>
  );
};

export default StateFinancials;
