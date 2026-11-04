import React, { useMemo } from 'react';
import { Box, Divider } from '@mui/material';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import StatePage from '../components/StatePage';
import StateTable from '../components/StateTable';
import TrendChart from '../components/TrendChart';
import { useStateLoads } from '../hooks/useStateLoads';
import { useStateOutcomeData } from '../hooks/useStatewideData';
import { formatCount, formatPercent, graduationRates, postGraduationShares, sortByYear } from '../utils/stateMetrics';

const PAGE = PAGE_REGISTRY.state.outcomes;
const classYear = (year: number) => String(year);

// Plans charted as lines; the table lists every plan
const CHARTED_PLANS = [
  { key: '4 Year College', name: 'Four-year college' },
  { key: 'Less 4 Year College', name: 'Two-year college or less' },
  { key: 'Employed', name: 'Working' },
  { key: 'Armed Forces', name: 'Military' },
];

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
      .map(row => ({ plan: row.post_graduation_type.description || row.post_graduation_type.name, graduates: row.value, share: total ? (row.value / total) * 100 : null }));
  }, [postGraduation, latestPlansYear]);

  return (
    <StatePage
      displayName={PAGE.displayName}
      status={status}
      onRetry={retry}
      errorMessage="Statewide graduation data could not be loaded."
      intro="How many students finish high school in four years, and what graduates say they plan to do next."
      source="NH Department of Education, graduation cohort, dropout and post-graduation plans reports"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, '& > *': { flex: 1, minWidth: 0 } }}>
          <TrendChart
            title="Four-Year Graduation Rate"
            subtitle="(Percentage of each class that started grade 9 together)"
            data={rates}
            series={[{ key: 'graduated', name: 'Graduated' }]}
            format={value => formatPercent(value, 1)}
            axisFormat={value => formatPercent(value)}
            yDomain={[60, 100]}
            csvName="nh-graduation-rate"
            yearLabel={classYear}
            yearHeader="Class of"
          />
          <TrendChart
            title="Left Without a Diploma"
            subtitle="(Percentage of each class)"
            data={rates}
            series={[{ key: 'droppedOut', name: 'Dropped out' }, { key: 'hiset', name: 'Earned a HiSET instead' }]}
            format={value => formatPercent(value, 1)}
            axisFormat={value => formatPercent(value)}
            note="The HiSET is a high school equivalency test. Students still in school after four years, or who moved away, aren't in either line."
            csvName="nh-dropout-hiset"
            yearLabel={classYear}
            yearHeader="Class of"
          />
        </Box>

        <Divider />

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, '& > *': { flex: 1, minWidth: 0 } }}>
          <TrendChart
            title="Graduates' Plans After High School"
            subtitle="(Percentage of graduates)"
            data={shares}
            series={CHARTED_PLANS}
            format={value => formatPercent(value, 1)}
            axisFormat={value => formatPercent(value)}
            note="Plans graduates report at the end of senior year, not confirmed enrollment or employment."
            csvName="nh-post-graduation-plans"
            yearLabel={classYear}
            yearHeader="Class of"
          />
          <StateTable
            title={latestPlansYear ? `Plans of the Class of ${latestPlansYear}` : 'Plans of the Latest Class'}
            columns={[
              { key: 'plan', label: 'Plan' },
              { key: 'graduates', label: 'Graduates', align: 'right', format: row => formatCount(row.graduates) },
              { key: 'share', label: 'Share', align: 'right', format: row => formatPercent(row.share, 1) },
            ]}
            rows={latestPlans}
            csvName={`nh-post-graduation-plans-${latestPlansYear ?? ''}`}
          />
        </Box>

        <Divider />

        <TrendChart
          title="High School Dropout Rate"
          subtitle="(Grades 9-12)"
          data={dropoutRates}
          series={[{ key: 'annual', name: 'In one year' }, { key: 'fourYear', name: 'Over four years' }]}
          format={value => formatPercent(value, 1)}
          axisFormat={value => formatPercent(value)}
          note="One-year rate: share of high school students who dropped out during the year. Four-year rate: the chance a student drops out at some point in grades 9-12 at that year's rates."
          csvName="nh-dropout-rate"
        />
      </Box>
    </StatePage>
  );
};

export default StateOutcomes;
