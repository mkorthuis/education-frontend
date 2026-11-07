import React, { useMemo } from 'react';
import { Box, Divider } from '@mui/material';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import StatePage from '../components/StatePage';
import StateTable from '../components/StateTable';
import ChartRow from '../components/ChartRow';
import TrendChart from '../components/TrendChart';
import KeyFigures, { KeyFigure } from '../components/KeyFigures';
import { useStateLoads } from '../hooks/useStateLoads';
import { useStateOutcomeData } from '../hooks/useStatewideData';
import { changeSince, formatCount, formatPercent, graduationRates, latestPoint, postGraduationShares, PRELIMINARY, REMOTE_BAND, sortByYear, toSeries } from '../utils/stateMetrics';
import { PLAN_LABELS, plainLabel } from '../utils/labels';
import { tileDelta } from '../utils/phrases';

const PAGE = PAGE_REGISTRY.state.outcomes;
const TREND_YEARS = 10;
const classYear = (year: number) => String(year);
// Titles name the class in full; tiles show the class year ("2025") and say "Preliminary" in
// their note when it is
const classOf = (year: number) => `Class of ${year}${year === PRELIMINARY.graduationClass ? ' (Preliminary)' : ''}`;
const preliminaryClass = (year: number) => (year === PRELIMINARY.graduationClass ? 'Preliminary' : undefined);

// Plans charted as lines; the table lists every plan
const CHARTED_PLANS = ['4 Year College', 'Less 4 Year College', 'Employed', 'Armed Forces'].map(key => ({
  key,
  name: PLAN_LABELS[key],
  shortName: key === 'Less 4 Year College' ? 'Two-Year or Shorter' : undefined,
}));

const StateOutcomes: React.FC = () => {
  const { loads, detailLoads, cohorts, postGraduation, earlyExit } = useStateOutcomeData();
  const { status, retry } = useStateLoads([...loads, ...detailLoads]);

  const rates = useMemo(() => graduationRates(cohorts), [cohorts]);
  const shares = useMemo(() => postGraduationShares(postGraduation), [postGraduation]);
  const dropoutRates = useMemo(
    () => sortByYear(earlyExit).map(row => ({ year: row.year, annual: row.annual_dropout_percentage * 100, fourYear: row.four_year_dropout_percentage * 100 })),
    [earlyExit]
  );

  const latestPlansYear = postGraduation.length ? Math.max(...postGraduation.map(row => row.year)) : null;
  const latestPlans = useMemo(() => {
    const rows = postGraduation.filter(row => row.year === latestPlansYear);
    const total = rows.reduce((sum, row) => sum + row.value, 0);
    return [...rows]
      .sort((a, b) => b.value - a.value)
      .map(row => ({ plan: plainLabel(PLAN_LABELS, row.post_graduation_type.name), graduates: row.value, share: total ? (row.value / total) * 100 : null }));
  }, [postGraduation, latestPlansYear]);
  const latestPlansTotal = latestPlans.reduce((sum, row) => sum + row.graduates, 0);

  const keyFigures = useMemo(() => {
    const graduated = toSeries(rates, row => row.graduated);
    const latest = latestPoint(graduated);
    const latestRates = rates.find(row => row.year === latest?.year);
    const college = latestPoint(toSeries(shares, row => row.college));
    const figures: KeyFigure[] = [];
    const takeaway: string[] = [];
    if (latest && latestRates) {
      const change = changeSince(graduated, TREND_YEARS);
      figures.push({
        label: 'Four-Year Graduation Rate',
        shortLabel: 'Graduation Rate',
        value: formatPercent(latest.value, 1),
        period: String(latest.year),
        // The change relative to the rate then, like the other State pages' tiles
        delta: tileDelta(change, { unit: 'percent', classYears: true, higherIsBetter: true }),
        detail: preliminaryClass(latest.year),
      });
      figures.push({
        label: 'Dropped Out',
        value: formatPercent(latestRates.droppedOut, 1),
        period: String(latest.year),
        delta: tileDelta(changeSince(toSeries(rates, row => row.droppedOut), TREND_YEARS), { unit: 'percent', classYears: true, higherIsBetter: false }),
        detail: [preliminaryClass(latest.year), `${formatPercent(latestRates.hiset, 1)} earned a HiSET instead`].filter(Boolean).join('. '),
      });
      takeaway.push(`${formatPercent(latest.value, 1)} of the class of ${latest.year} graduated in four years; ${formatPercent(latestRates.droppedOut, 1)} dropped out.`);
    }
    if (college) {
      figures.push({
        label: 'Planning to Attend College',
        shortLabel: 'Planning College',
        value: formatPercent(college.value),
        period: String(college.year),
        delta: tileDelta(changeSince(toSeries(shares, row => row.college), TREND_YEARS), { unit: 'percent', classYears: true }),
        detail: [preliminaryClass(college.year), 'Two- and four-year colleges'].filter(Boolean).join('. '),
      });
      takeaway.push(`${formatPercent(college.value)} of graduates said they planned to go to college.`);
    }
    return { figures, takeaway };
  }, [rates, shares]);

  const preliminaryNote = `Class of ${PRELIMINARY.graduationClass} figures are preliminary.`;

  return (
    <StatePage
      displayName={PAGE.displayName}
      status={status}
      onRetry={retry}
      errorMessage="Statewide graduation data could not be loaded."
      intro="How many students finish high school in four years, and what graduates say they plan to do next."
      takeaway={keyFigures.takeaway}
      keyFigures={<KeyFigures figures={keyFigures.figures} centerLastTile />}
      keyFiguresBesideIntro
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <ChartRow>
          <TrendChart
            title="Four-Year Graduation Rate"
            subtitle="Percentage of Each Class That Started Grade 9 Together"
            data={rates}
            series={[{ key: 'graduated', name: 'Graduated' }]}
            format={value => formatPercent(value, 1)}
            axisFormat={value => formatPercent(value)}
            yDomain={[60, 100]}
            note={`The vertical axis starts at 60%. ${preliminaryNote}`}
            yearLabel={classYear}
            yearHeader="Class of"
          />
          <TrendChart
            title="Left Without a Diploma"
            subtitle="Percentage of Each Class"
            data={rates}
            series={[{ key: 'droppedOut', name: 'Dropped Out' }, { key: 'hiset', name: 'Earned a HiSET Instead' }]}
            format={value => formatPercent(value, 1)}
            axisFormat={value => formatPercent(value)}
            note="The HiSET is a high school equivalency test. Students still in school after four years, or who moved away, aren't in either line."
            yearLabel={classYear}
            yearHeader="Class of"
          />
        </ChartRow>

        <Divider />

        <ChartRow>
          <TrendChart
            title="Graduates' Plans After High School"
            subtitle="Percentage of Graduates"
            data={shares}
            series={CHARTED_PLANS}
            format={value => formatPercent(value, 1)}
            axisFormat={value => formatPercent(value)}
            note="Plans graduates report at the end of senior year, not confirmed enrollment or employment. Shares include graduates whose plans are unknown."
            yearLabel={classYear}
            yearHeader="Class of"
          />
          <StateTable
            title={latestPlansYear ? `Plans of the ${classOf(latestPlansYear)}` : 'Plans of the Latest Class'}
            columns={[
              { key: 'plan', label: 'Plan' },
              { key: 'graduates', label: 'Graduates', align: 'right', format: row => formatCount(row.graduates) },
              { key: 'share', label: 'Share', align: 'right', format: row => formatPercent(row.share, 1) },
            ]}
            rows={latestPlans}
            totalRow={latestPlans.length ? { plan: 'All Graduates', graduates: latestPlansTotal, share: 100 } : undefined}
          />
        </ChartRow>

        <Divider />

        <TrendChart
          title="Annual Dropout Rate"
          subtitle="Share of All High School Students (Grades 9-12) Who Dropped Out During the School Year"
          data={dropoutRates}
          series={[{ key: 'annual', name: 'Dropped Out That Year' }]}
          tableSeries={[{ key: 'fourYear', name: 'Four-Year Estimate' }]}
          format={value => formatPercent(value, 1)}
          axisFormat={value => formatPercent(value)}
          bands={REMOTE_BAND}
          note="The shaded years include 2020-21, when many schools were remote or hybrid. This rate counts every high school student each year, so it's lower than the share of a class that drops out over four years (above). The table view also has the state's four-year estimate: the chance a student drops out at some point in grades 9-12 at that year's rates."
        />
      </Box>
    </StatePage>
  );
};

export default StateOutcomes;
