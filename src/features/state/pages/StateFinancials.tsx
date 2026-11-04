import React, { useMemo } from 'react';
import { Box, Divider, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectAdjustForInflation, toggleInflationAdjustment } from '@/store/slices/financeSlice';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import StatePage from '../components/StatePage';
import StateTable from '../components/StateTable';
import TrendChart from '../components/TrendChart';
import { useStateLoads } from '../hooks/useStateLoads';
import { useStateEnrollmentData, useStateFinanceData } from '../hooks/useStatewideData';
import {
  adjustSeriesForInflation,
  formatDollars,
  formatPercent,
  formatSchoolYear,
  latestPoint,
  mergeSeries,
  percentChangeSeries,
  REVENUE_SOURCES,
  revenueBySource,
  toSeries,
  YearValue,
} from '../utils/stateMetrics';

const PAGE = PAGE_REGISTRY.state.financials;

const LEVELS = [
  { key: 'total', name: 'All grades' },
  { key: 'elementary', name: 'Elementary' },
  { key: 'middle', name: 'Middle' },
  { key: 'high', name: 'High' },
] as const;

const formatBillions = (value: number) => `$${(value / 1e9).toFixed(2)}B`;
const formatSignedPercent = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(0)}%`;

// In the latest year's dollars when the inflation toggle is on
const toDollars = (series: YearValue[], adjust: boolean, latestYear: number | null) =>
  adjust && latestYear ? adjustSeriesForInflation(series, latestYear) : series;

const StateFinancials: React.FC = () => {
  const dispatch = useAppDispatch();
  const adjustForInflation = useAppSelector(selectAdjustForInflation);
  const finance = useStateFinanceData();
  const enrollment = useStateEnrollmentData();
  const { status, retry } = useStateLoads([...finance.loads, ...finance.revenueLoads, ...enrollment.loads]);

  const latestYear = useMemo(() => latestPoint(toSeries(finance.perPupil, row => row.total))?.year ?? null, [finance.perPupil]);

  const perPupil = useMemo(() => {
    const byLevel: Record<string, YearValue[]> = {};
    LEVELS.forEach(level => { byLevel[level.key] = toDollars(toSeries(finance.perPupil, row => row[level.key]), adjustForInflation, latestYear); });
    return mergeSeries(byLevel);
  }, [finance.perPupil, adjustForInflation, latestYear]);

  const spending = useMemo(
    () => toDollars(toSeries(finance.rollups, row => row.total), adjustForInflation, latestYear),
    [finance.rollups, adjustForInflation, latestYear]
  );

  // Students and spending as percent change from the first year both cover, on one axis
  const studentsVsSpending = useMemo(() => {
    const students = toSeries(enrollment.adm, row => row.total);
    const nominal = toSeries(finance.rollups, row => row.total);
    const firstYear = Math.max(students[0]?.year ?? 0, nominal[0]?.year ?? 0);
    if (!firstYear || !latestYear) return { rows: [], firstYear };
    return {
      firstYear,
      rows: mergeSeries({
        students: percentChangeSeries(students, firstYear),
        spending: percentChangeSeries(nominal, firstYear),
        realSpending: percentChangeSeries(adjustSeriesForInflation(nominal, latestYear), firstYear),
      }),
    };
  }, [enrollment.adm, finance.rollups, latestYear]);

  const revenue = useMemo(() => revenueBySource(finance.revenue, finance.revenueEntryTypes), [finance.revenue, finance.revenueEntryTypes]);
  const revenueShares = useMemo(() => revenue.map(row => {
    const total = REVENUE_SOURCES.reduce((sum, source) => sum + (row[source.key] ?? 0), 0);
    const shares: Record<string, number | null> = {};
    REVENUE_SOURCES.forEach(source => { shares[source.key] = total ? ((row[source.key] ?? 0) / total) * 100 : null; });
    return { year: row.year, ...shares };
  }), [revenue]);
  const latestRevenue = revenue[revenue.length - 1];
  const latestRevenueTotal = latestRevenue ? REVENUE_SOURCES.reduce((sum, source) => sum + (latestRevenue[source.key] ?? 0), 0) : 0;

  const dollarNote = adjustForInflation && latestYear
    ? `Adjusted for inflation to ${formatSchoolYear(latestYear)} dollars (Consumer Price Index).`
    : 'Not adjusted for inflation. Use Adjust For Inflation above to compare in today\'s dollars.';

  return (
    <StatePage
      displayName={PAGE.displayName}
      status={status}
      onRetry={retry}
      errorMessage="Statewide financial data could not be loaded."
      intro="What New Hampshire school districts spend, per student and in total, and where the money comes from."
      source="NH Department of Education, DOE-25 district financial reports and cost per pupil reports"
    >
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <ToggleButtonGroup
          value={adjustForInflation}
          exclusive
          onChange={() => dispatch(toggleInflationAdjustment())}
          size="small"
          sx={{
            '& .MuiToggleButton-root': { color: 'rgba(0, 0, 0, 0.87)', fontWeight: 500, minWidth: '140px' },
            '& .MuiToggleButton-root.Mui-selected': {
              bgcolor: 'rgba(0, 0, 0, 0.08)',
              color: 'rgba(0, 0, 0, 0.87)',
              '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.12)' },
            },
          }}
        >
          <ToggleButton value={true}>Adjust For Inflation</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <TrendChart
          title="Cost Per Student by School Level"
          subtitle="(Current spending, less tuition and transportation, per student)"
          data={perPupil}
          series={LEVELS.map(level => ({ key: level.key, name: level.name }))}
          format={formatDollars}
          axisFormat={value => `$${Math.round(value / 1000)}K`}
          note={dollarNote}
          csvName={`nh-cost-per-student${adjustForInflation ? '-inflation-adjusted' : ''}`}
        />

        <Divider />

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, '& > *': { flex: 1, minWidth: 0 } }}>
          <TrendChart
            title="Total School District Spending"
            subtitle="(All funds, statewide)"
            data={spending.map(point => ({ year: point.year, total: point.value }))}
            series={[{ key: 'total', name: 'Total spending' }]}
            format={formatBillions}
            note={dollarNote}
            csvName={`nh-total-spending${adjustForInflation ? '-inflation-adjusted' : ''}`}
          />
          <TrendChart
            title="Students and Spending Since the First Year"
            subtitle={studentsVsSpending.firstYear ? `(Percent change from ${formatSchoolYear(studentsVsSpending.firstYear)})` : undefined}
            data={studentsVsSpending.rows}
            series={[
              { key: 'students', name: 'Students' },
              { key: 'spending', name: 'Spending' },
              { key: 'realSpending', name: 'Spending, after inflation' },
            ]}
            format={formatSignedPercent}
            yDomain={['auto', 'auto']}
            note="Shows whether spending and enrollment moved together. Students are average daily membership."
            csvName="nh-students-vs-spending"
          />
        </Box>

        <Divider />

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, '& > *': { flex: 1, minWidth: 0 } }}>
          <TrendChart
            title="Where School Revenue Comes From"
            subtitle="(Percentage of district revenue)"
            data={revenueShares}
            series={REVENUE_SOURCES.map(source => ({ key: source.key, name: source.name }))}
            format={value => formatPercent(value, 1)}
            axisFormat={value => formatPercent(value)}
            yDomain={[0, 100]}
            note="Local revenue is mostly property taxes raised by each town."
            csvName="nh-revenue-by-source"
          />
          <Box>
            <StateTable
              title={latestRevenue ? `Revenue by Source, ${formatSchoolYear(latestRevenue.year)}` : 'Revenue by Source'}
              columns={[
                { key: 'name', label: 'Source' },
                { key: 'amount', label: 'Amount', align: 'right', format: row => formatDollars(row.amount) },
                { key: 'share', label: 'Share', align: 'right', format: row => formatPercent(row.share, 1) },
              ]}
              rows={latestRevenue ? REVENUE_SOURCES.map(source => ({
                name: source.name,
                amount: latestRevenue[source.key] ?? 0,
                share: latestRevenueTotal ? ((latestRevenue[source.key] ?? 0) / latestRevenueTotal) * 100 : null,
              })) : []}
              csvName={`nh-revenue-by-source-${latestRevenue?.year ?? ''}`}
            />
            {latestRevenue && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Total: {formatDollars(latestRevenueTotal)}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </StatePage>
  );
};

export default StateFinancials;
