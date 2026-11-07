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
import { changeSince, formatCount, formatPercent, formatSchoolYear, graduationRates, latestPoint, pivotByYear, postGraduationShares, REMOTE_BAND, sortByYear, toSeries, YearValue } from '../utils/stateMetrics';
import { asFraction, COUNT, downloadWorkbook, ExcelSheet, notesSheet, PERCENT } from '../utils/excel';
import { PLAN_LABELS, plainLabel } from '../utils/labels';
import { changedBy, tileDelta } from '../utils/phrases';

const PAGE = PAGE_REGISTRY.state.outcomes;
const TREND_YEARS = 10;
// A change under this percent (relative) reads as holding steady in the takeaway
const STEADY = 2;
const classYear = (year: number) => String(year);

// Shorter plan names for phones, in the chart's legend and the table
const PLAN_PHONE_NAMES: Record<string, string> = {
  [PLAN_LABELS['4 Year College']]: '4-Year College',
  [PLAN_LABELS['Less 4 Year College']]: '2-Year College',
  [PLAN_LABELS['Addl. High School']]: 'Postgraduate Year at HS',
};

// Plans charted as lines; the table lists every plan
const CHARTED_PLANS = ['4 Year College', 'Less 4 Year College', 'Employed', 'Armed Forces'].map(key => ({
  key,
  name: PLAN_LABELS[key],
  shortName: key === 'Less 4 Year College' ? 'Two-Year or Shorter' : undefined,
  // The legend's phone name for two-year college is shorter still than the table's
  phoneName: key === 'Less 4 Year College' ? '2-Year' : PLAN_PHONE_NAMES[PLAN_LABELS[key]],
}));

const StateOutcomes: React.FC = () => {
  const { loads, detailLoads, cohorts, postGraduation, earlyExit } = useStateOutcomeData();
  const { status, retry } = useStateLoads([...loads, ...detailLoads]);

  const rates = useMemo(() => graduationRates(cohorts), [cohorts]);
  const shares = useMemo(() => postGraduationShares(postGraduation), [postGraduation]);
  const dropoutRates = useMemo(
    () => sortByYear(earlyExit).map(row => ({ year: row.year, annual: row.annual_dropout_percentage * 100 })),
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
  const plansTitle = latestPlansYear ? `Plans of the Class of ${latestPlansYear}` : 'Plans of the Latest Class';

  const keyFigures = useMemo(() => {
    const graduated = toSeries(rates, row => row.graduated);
    const latest = latestPoint(graduated);
    const latestRates = rates.find(row => row.year === latest?.year);
    const gradChange = changeSince(graduated, TREND_YEARS);
    const college = latestPoint(toSeries(shares, row => row.college));
    const figures: KeyFigure[] = [];
    const takeaway: string[] = [];
    if (latest && latestRates) {
      figures.push({
        label: 'Four-Year Graduation Rate',
        shortLabel: 'Graduation Rate',
        value: formatPercent(latest.value, 1),
        period: String(latest.year),
        // The change relative to the rate then, like the other State pages' tiles
        delta: tileDelta(gradChange, { unit: 'percent', classYears: true, higherIsBetter: true }),
      });
      figures.push({
        label: 'Dropped Out',
        value: formatPercent(latestRates.droppedOut, 1),
        period: String(latest.year),
        delta: tileDelta(changeSince(toSeries(rates, row => row.droppedOut), TREND_YEARS), { unit: 'percent', classYears: true, higherIsBetter: false }),
        detail: `${formatPercent(latestRates.hiset, 1)} earned a HiSET instead`,
      });
    }
    if (college) {
      figures.push({
        label: 'Planning to Attend College',
        shortLabel: 'Planning College',
        value: formatPercent(college.value),
        period: String(college.year),
        delta: tileDelta(changeSince(toSeries(shares, row => row.college), TREND_YEARS), { unit: 'percent', classYears: true }),
        detail: 'Two- and four-year colleges',
      });
    }

    // Over the tiles' ten years, like the other State pages: "From the class of 2015 to 2025, the
    // graduation rate (88%) and the share of graduates planning a four-year college (50%) held steady.
    // Meanwhile, the share planning to work increased 35% while the share planning a two-year
    // college or shorter program decreased 27%."
    const planChange = (plan: string) => changeSince(toSeries(shares, row => row[plan]), TREND_YEARS);
    const changed = (percentChange: number) => changedBy(percentChange, STEADY);
    const fourYear = planChange('4 Year College');
    if (gradChange && fourYear) {
      const from = `From the class of ${gradChange.from.year} to ${gradChange.to.year}`;
      const rate = `the graduation rate (${formatPercent(gradChange.to.value)})`;
      const college = `the share of graduates planning a four-year college (${formatPercent(fourYear.to.value)})`;
      takeaway.push(Math.abs(gradChange.percentChange) < STEADY && Math.abs(fourYear.percentChange) < STEADY
        ? `${from}, ${rate} and ${college} held steady.`
        : `${from}, ${rate} ${changed(gradChange.percentChange)} and ${college} ${changed(fourYear.percentChange)}.`);
    }
    const working = planChange('Employed');
    const twoYear = planChange('Less 4 Year College');
    if (working && twoYear) {
      takeaway.push(`Meanwhile, the share planning to work ${changed(working.percentChange)} while the share planning a two-year college or shorter program ${changed(twoYear.percentChange)}.`);
    }
    return { figures, takeaway };
  }, [rates, shares]);

  // Everything on the page as one workbook: a sheet per chart or table, with the counts behind the
  // rates and the figures the page leaves out (each class's remainder, the four-year dropout estimate)
  const downloadExcel = () => {
    const tileRow = (figure: string, series: YearValue[], digits: number) => {
      const latest = latestPoint(series);
      const change = changeSince(series, TREND_YEARS);
      // The value rounded as the tile shows it
      return [figure, latest?.year ?? null, latest ? Number(latest.value.toFixed(digits)) / 100 : null, change ? change.percentChange / 100 : null, change?.from.year ?? null];
    };
    const plans = Object.keys(PLAN_LABELS).filter(plan => postGraduation.some(row => row.post_graduation_type.name === plan));
    const planCounts = pivotByYear(postGraduation, row => row.post_graduation_type.name, row => row.value);
    const sheets: ExcelSheet[] = [
      {
        name: 'Key Figures',
        columns: [
          { header: 'Figure', width: 28 },
          { header: 'Class of', width: 10 },
          { header: 'Value', format: PERCENT },
          { header: 'Change', format: PERCENT },
          { header: 'Since Class of', width: 14 },
        ],
        rows: [
          tileRow('Four-Year Graduation Rate', toSeries(rates, row => row.graduated), 1),
          tileRow('Dropped Out', toSeries(rates, row => row.droppedOut), 1),
          tileRow('Planning to Attend College', toSeries(shares, row => row.college), 0),
        ],
      },
      {
        name: 'Graduation By Class',
        title: 'Four-Year Graduation Rate and What Happened to Each Class',
        subtitle: 'Students who started grade 9 together, adjusted for transfers in and out, four years later',
        columns: [
          { header: 'Class of', width: 10 },
          { header: 'Students in Class', width: 14, format: COUNT },
          { header: 'Graduated', format: COUNT },
          { header: 'Earned a HiSET', width: 14, format: COUNT },
          { header: 'Dropped Out', format: COUNT },
          { header: 'Still in High School or Other', width: 18, format: COUNT },
          { header: 'Graduated (%)', width: 14, format: PERCENT },
          { header: 'Earned a HiSET (%)', width: 14, format: PERCENT },
          { header: 'Dropped Out (%)', width: 14, format: PERCENT },
          { header: 'Still in High School or Other (%)', width: 18, format: PERCENT },
        ],
        rows: sortByYear(cohorts).filter(cohort => cohort.cohort_size > 0).map(cohort => {
          const other = cohort.cohort_size - cohort.graduate - cohort.earned_hiset - cohort.dropped_out;
          return [
            cohort.year, cohort.cohort_size, cohort.graduate, cohort.earned_hiset, cohort.dropped_out, other,
            cohort.graduate / cohort.cohort_size, cohort.earned_hiset / cohort.cohort_size, cohort.dropped_out / cohort.cohort_size, other / cohort.cohort_size,
          ];
        }),
      },
      {
        name: plansTitle,
        columns: [
          { header: 'Plan', width: 36 },
          { header: 'Graduates', format: COUNT },
          { header: 'Share', format: PERCENT },
        ],
        rows: latestPlans.map(row => [row.plan, row.graduates, asFraction(row.share)]),
        totalRow: latestPlans.length ? ['All Graduates', latestPlansTotal, 1] : undefined,
      },
      {
        name: 'Plans Over Time',
        title: "Graduates' Plans After High School Over Time",
        subtitle: 'Percentage of graduates; reported by high school graduates, not confirmed',
        columns: [
          { header: 'Class of', width: 10 },
          ...plans.map(plan => ({ header: PLAN_LABELS[plan], width: 16, format: PERCENT })),
          { header: 'All Graduates', width: 14, format: COUNT },
        ],
        rows: planCounts.map(({ year, ...counts }) => {
          const total = plans.reduce((sum, plan) => sum + (counts[plan] ?? 0), 0);
          return [year, ...plans.map(plan => (total && typeof counts[plan] === 'number' ? (counts[plan] as number) / total : null)), total];
        }),
      },
      {
        name: 'Annual Dropout Rate',
        subtitle: 'Percentage of high school students (grades 9-12) who dropped out during the school year',
        columns: [
          { header: 'School Year', width: 12 },
          { header: 'Students (Grades 9-12)', width: 16, format: COUNT },
          { header: 'Dropped Out', format: COUNT },
          { header: 'Annual Dropout Rate', width: 14, format: PERCENT },
          { header: 'Four-Year Estimate', width: 14, format: PERCENT },
        ],
        rows: sortByYear(earlyExit).map(row => [
          formatSchoolYear(row.year), row.adjusted_fall_enrollment, row.dropped_out, row.annual_dropout_percentage, row.four_year_dropout_percentage,
        ]),
      },
      notesSheet('Graduation / College for New Hampshire', [
        'Sources: NH Department of Education graduation cohort, completers by category (post-graduation plans) and early exit (dropout) reports.',
        'A class is the students who started grade 9 together, adjusted for students transferring in and out; students who move away are taken out of the class. Graduated means a regular or adult high school diploma within four years. Earned a HiSET means they left and later earned a high school equivalency certificate. Dropped Out means they left without a diploma, aren\'t still enrolled and didn\'t earn a HiSET.',
        'Still in High School or Other is the rest of the class: students still enrolled in high school after four years, or who left with a non-standard diploma. The page doesn\'t show it; it\'s the class size less the other three.',
        'Plans are what graduates report at the end of senior year, not confirmed enrollment or employment. Shares are of all reported graduates, including those whose plans are unknown.',
        'The annual dropout rate counts every high school student each year, so it\'s lower than the share of a class that drops out over four years. The four-year estimate is the state\'s: the chance a student drops out at some point in grades 9-12 at that year\'s rates. 2020-21 was a year many schools were remote or hybrid.',
        'Key figure changes are relative to the figure ten classes earlier.',
      ]),
    ];
    return downloadWorkbook('nh-graduation.xlsx', sheets);
  };

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
      onDownload={downloadExcel}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <ChartRow>
          <TrendChart
            title="Four-Year Graduation Rate"
            showViewToggle={false}
            subtitle="Percentage of Each Class That Started Grade 9 Together"
            shortSubtitle="% of Each Class That Started Grade 9 Together"
            data={rates}
            series={[{ key: 'graduated', name: 'Graduated' }]}
            format={value => formatPercent(value, 1)}
            axisFormat={value => formatPercent(value)}
            yDomain={[60, 100]}
            yearLabel={classYear}
            yearHeader="Class of"
          />
          <StateTable
            title={plansTitle}
            columns={[
              { key: 'plan', label: 'Plan', shortFormat: row => PLAN_PHONE_NAMES[row.plan] ?? row.plan },
              { key: 'graduates', label: 'Graduates', align: 'right', format: row => formatCount(row.graduates) },
              { key: 'share', label: 'Share', align: 'right', format: row => formatPercent(row.share, 1) },
            ]}
            rows={latestPlans}
            totalRow={latestPlans.length ? { plan: 'All Graduates', graduates: latestPlansTotal, share: 100 } : undefined}
          />
        </ChartRow>

        <Divider />

        <ChartRow>
          <TrendChart
            title="Graduates' Plans After High School Over Time"
            shortTitle="Graduates' Plans Over Time"
            // Under the plot, so it lines up with the dropout chart beside it, which has no legend
            legendBelow
            showViewToggle={false}
            subtitle="Percentage of Graduates"
            data={shares}
            series={CHARTED_PLANS}
            format={value => formatPercent(value, 1)}
            axisFormat={value => formatPercent(value)}
            note="Reported by high school graduates. Not confirmed."
            yearLabel={classYear}
            yearHeader="Class of"
          />
          <TrendChart
            title="Annual Dropout Rate"
            showViewToggle={false}
            subtitle="Percentage of High School Students Dropped Out During School Year"
            data={dropoutRates}
            series={[{ key: 'annual', name: 'Dropped Out That Year' }]}
            format={value => formatPercent(value, 1)}
            axisFormat={value => formatPercent(value)}
            bands={REMOTE_BAND}
            note="This rate counts every high school student each year, so it's lower than the share of a class that drops out over four years."
          />
        </ChartRow>
      </Box>
    </StatePage>
  );
};

export default StateOutcomes;
