import React, { useMemo } from 'react';
import { Box, Divider } from '@mui/material';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import StatePage from '../components/StatePage';
import StateTable from '../components/StateTable';
import TrendChart from '../components/TrendChart';
import KeyFigures, { KeyFigure } from '../components/KeyFigures';
import { useStateLoads } from '../hooks/useStateLoads';
import { useStateOutcomeData } from '../hooks/useStatewideData';
import { changeSince, formatCount, formatPercent, graduationRates, latestPoint, postGraduationShares, PRELIMINARY, REMOTE_SCHOOL_YEAR, sortByYear, toSeries } from '../utils/stateMetrics';
import { PLAN_LABELS, plainLabel } from '../utils/labels';
import { tileDelta } from '../utils/phrases';

const PAGE = PAGE_REGISTRY.state.outcomes;
const TREND_YEARS = 10;
const classYear = (year: number) => String(year);
// Titles name the class in full; tiles show the class year ("2025") and say "Preliminary" in
// their note when it is
const classOf = (year: number) => `Class of ${year}${year === PRELIMINARY.graduationClass ? ' (preliminary)' : ''}`;
const preliminaryClass = (year: number) => (year === PRELIMINARY.graduationClass ? 'Preliminary' : undefined);

// Plans charted as lines; the table lists every plan
const CHARTED_PLANS = ['4 Year College', 'Less 4 Year College', 'Employed', 'Armed Forces'].map(key => ({
  key,
  name: PLAN_LABELS[key],
  shortName: key === 'Less 4 Year College' ? 'Two-year or shorter' : undefined,
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
        delta: tileDelta(change, { unit: 'points', classYears: true, higherIsBetter: true }),
        detail: preliminaryClass(latest.year),
      });
      figures.push({
        label: 'Dropped Out',
        value: formatPercent(latestRates.droppedOut, 1),
        period: String(latest.year),
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
      keyFigures={<KeyFigures takeaway={keyFigures.takeaway} figures={keyFigures.figures} />}
      districtSection="outcomes"
      notCovered="Graduation rates by student group (such as students with disabilities or English learners), what graduates actually do after high school (college enrollment, jobs, apprenticeships, staying in New Hampshire), career and technical education (CTE), and students who stay in high school past four years aren't on the site yet."
      source="NH Department of Education, graduation cohort, dropout and post-graduation plans reports"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, '& > *': { flex: 1, minWidth: 0 } }}>
          <TrendChart
            title="Four-year graduation rate"
            subtitle="Percentage of each class that started grade 9 together"
            data={rates}
            series={[{ key: 'graduated', name: 'Graduated' }]}
            format={value => formatPercent(value, 1)}
            axisFormat={value => formatPercent(value)}
            yDomain={[60, 100]}
            note={`The vertical axis starts at 60%. ${preliminaryNote}`}
            csvName="nh-graduation-rate"
            csvUnit="% of class"
            yearLabel={classYear}
            yearHeader="Class of"
          />
          <TrendChart
            title="Left without a diploma"
            subtitle="Percentage of each class"
            data={rates}
            series={[{ key: 'droppedOut', name: 'Dropped out' }, { key: 'hiset', name: 'Earned a HiSET instead' }]}
            format={value => formatPercent(value, 1)}
            axisFormat={value => formatPercent(value)}
            note="The HiSET is a high school equivalency test. Students still in school after four years, or who moved away, aren't in either line."
            csvName="nh-dropout-hiset"
            csvUnit="% of class"
            yearLabel={classYear}
            yearHeader="Class of"
          />
        </Box>

        <Divider />

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, '& > *': { flex: 1, minWidth: 0 } }}>
          <TrendChart
            title="Graduates' plans after high school"
            subtitle="Percentage of graduates"
            data={shares}
            series={CHARTED_PLANS}
            format={value => formatPercent(value, 1)}
            axisFormat={value => formatPercent(value)}
            note="Plans graduates report at the end of senior year, not confirmed enrollment or employment. Shares include graduates whose plans are unknown."
            csvName="nh-post-graduation-plans"
            csvUnit="% of graduates"
            yearLabel={classYear}
            yearHeader="Class of"
          />
          <StateTable
            title={latestPlansYear ? `Plans of the ${classOf(latestPlansYear)}` : 'Plans of the latest class'}
            columns={[
              { key: 'plan', label: 'Plan' },
              { key: 'graduates', label: 'Graduates', align: 'right', format: row => formatCount(row.graduates) },
              { key: 'share', label: 'Share', align: 'right', format: row => formatPercent(row.share, 1) },
            ]}
            rows={latestPlans}
            totalRow={latestPlans.length ? { plan: 'All graduates', graduates: latestPlansTotal, share: 100 } : undefined}
            csvName={`nh-post-graduation-plans-${latestPlansYear ?? ''}`}
          />
        </Box>

        <Divider />

        <TrendChart
          title="Annual dropout rate"
          subtitle="Share of all high school students (grades 9-12) who dropped out during the school year"
          data={dropoutRates}
          series={[{ key: 'annual', name: 'Dropped out that year' }]}
          tableSeries={[{ key: 'fourYear', name: 'Four-year estimate' }]}
          format={value => formatPercent(value, 1)}
          axisFormat={value => formatPercent(value)}
          bands={[{ from: REMOTE_SCHOOL_YEAR - 1, to: REMOTE_SCHOOL_YEAR, label: 'COVID' }]}
          note="The shaded years include 2020-21, when many schools were remote or hybrid. This rate counts every high school student each year, so it's lower than the share of a class that drops out over four years (above). The table view also has the state's four-year estimate: the chance a student drops out at some point in grades 9-12 at that year's rates."
          csvName="nh-dropout-rate"
          csvUnit="%"
        />
      </Box>
    </StatePage>
  );
};

export default StateOutcomes;
