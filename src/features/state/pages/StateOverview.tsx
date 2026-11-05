import React, { useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Card, CardActionArea, CardContent, Divider, Link, Paper, Typography } from '@mui/material';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import SectionTitle from '@/components/ui/SectionTitle';
import StatePage from '../components/StatePage';
import OverviewTile from '../components/OverviewTile';
import DistrictPicker from '../components/DistrictPicker';
import { useStateLoads } from '../hooks/useStateLoads';
import { useSchoolCounts } from '../hooks/useSchoolCounts';
import {
  useStateAssessmentData,
  useStateEfaData,
  useStateEnrollmentData,
  useStateFinanceData,
  useStateOutcomeData,
  useStateStaffData,
} from '../hooks/useStatewideData';
import {
  ALL_STUDENTS_SUBGROUP_ID,
  changeSince,
  describeChange,
  efaTotals,
  formatCount,
  formatDollars,
  formatPercent,
  formatSchoolYear,
  graduationRates,
  latestPoint,
  postGraduationShares,
  PRELIMINARY,
  proficiencyBySubject,
  studentsPerTeacher,
  toSeries,
  YearValue,
} from '../utils/stateMetrics';
import { capitalize, realPercentChange, shortYear, tileDelta } from '../utils/phrases';

/** "$4.14B", short enough to leave room for the change and trend line on the tile */
const formatBillionsShort = (value: number, decimals = 2) => `$${(value / 1e9).toFixed(decimals)}B`;
// Phone tiles' values in thousands: 149,403 reads "149K"; with one decimal, 12,500 reads "12.5K"
const formatThousandsShort = (value: number, decimals = 0) => `${(value / 1000).toFixed(decimals).replace(/\.0$/, '')}K`;

const TREND_YEARS = 10;
// The current state test (the NH SAS) began in 2017-18; earlier scores aren't comparable
const CURRENT_TEST_FIRST_YEAR = 2018;
const STATE_PAGES = PAGE_REGISTRY.state;

// The page links share the district and school summary pages' link style (light grey, a thin
// border, darker grey on hover), with their titles in link blue except on phones
const pageLinkCardStyle = {
  border: '1px solid',
  borderColor: 'divider',
  backgroundColor: 'grey.100',
  color: 'text.primary',
  transition: 'background-color 120ms',
  '&:hover, &:focus-within': { backgroundColor: 'grey.300' },
};

const PAGE_DESCRIPTIONS: Record<string, string> = {
  academic: 'Test scores by subject, grade and student group',
  outcomes: 'Graduation, dropouts and graduates\' plans',
  financials: 'Cost per student, total spending and revenue',
  safety: 'Truancy, bullying, restraint and serious incidents',
  staff: 'Teacher pay, staffing levels and class size',
  enrollment: 'Students by year, school level and grade',
  efa: 'EFA students and estimated state cost',
};

const lastYears = (series: YearValue[]) => {
  const latest = latestPoint(series);
  return latest ? series.filter(point => point.year > latest.year - TREND_YEARS - 1) : series;
};


// Two tiles across on phones and tablets. Where four fit across (lg and up), a full-width group
// is four across and a half-width group (two side by side) is 2 x 2. The two half-width groups
// share their rows with each other (CSS subgrid), so the four tiles across a row are one height.
const tileGrid = (half: boolean) => ({
  display: 'grid',
  gap: { xs: 1, sm: 2 },
  gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', lg: half ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))' },
  ...(half && { gridRow: { lg: 'span 2' }, gridTemplateRows: { lg: 'subgrid' } }),
});

// A group of tiles under the Key Figures heading
const Band: React.FC<{ title: string; half?: boolean; children: React.ReactNode }> = ({ title, half = false, children }) => (
  <Box
    component="section"
    // Groups are set apart by space and their label, not outlines: the tiles are the only boxes
    sx={{
      mb: 4,
      minWidth: 0,
      // Label in the shared grid's first row, tiles in the next two
      ...(half && { display: { lg: 'grid' }, gridRow: { lg: 'span 3' }, gridTemplateRows: { lg: 'subgrid' }, rowGap: { lg: 0 } }),
    }}
  >
    <Typography
      component="h3"
      sx={{ fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'text.secondary', mb: 1.25 }}
    >
      {title}
    </Typography>
    <Box sx={tileGrid(half)}>{children}</Box>
  </Box>
);

const StateOverview: React.FC = () => {
  const enrollment = useStateEnrollmentData();
  const finance = useStateFinanceData();
  const staff = useStateStaffData();
  const outcomes = useStateOutcomeData();
  const assessment = useStateAssessmentData();
  const efa = useStateEfaData();
  // How many districts and schools, by year; their tiles appear once the counts load
  const schoolCounts = useSchoolCounts();

  const { status, retry } = useStateLoads([
    ...enrollment.loads,
    ...finance.loads,
    ...staff.loads,
    ...outcomes.loads,
    ...assessment.loads,
    ...efa.loads,
  ]);

  const figures = useMemo(() => {
    const students = toSeries(enrollment.adm, row => row.total);
    const perPupil = toSeries(finance.perPupil, row => row.total);
    const spending = toSeries(finance.rollups, row => row.total);
    const teachers = toSeries(staff.staff.filter(row => row.staff_type.name === 'Teacher'), row => row.value);
    const salary = toSeries(staff.salary, row => row.salary);
    const ratio = studentsPerTeacher(students, teachers);
    const proficiency = proficiencyBySubject(assessment.assessments, ALL_STUDENTS_SUBGROUP_ID);
    const math = toSeries(proficiency, row => row.math).filter(point => point.year >= CURRENT_TEST_FIRST_YEAR);
    const reading = toSeries(proficiency, row => row.reading).filter(point => point.year >= CURRENT_TEST_FIRST_YEAR);
    const graduation = toSeries(graduationRates(outcomes.cohorts), row => row.graduated);
    const college = toSeries(postGraduationShares(outcomes.postGraduation), row => row.college);
    const efaYears = efaTotals(efa.entries, efa.entryTypes);
    return {
      students, perPupil, spending, teachers, salary, ratio, math, reading, graduation, college,
      efaStudents: toSeries(efaYears, row => row.students),
      districts: toSeries(schoolCounts, row => row.districts),
      schools: toSeries(schoolCounts, row => row.schools),
    };
  }, [enrollment.adm, finance.perPupil, finance.rollups, staff.staff, staff.salary, assessment.assessments, outcomes.cohorts, outcomes.postGraduation, efa.entries, efa.entryTypes, schoolCounts]);

  const latest = {
    students: latestPoint(figures.students),
    perPupil: latestPoint(figures.perPupil),
    spending: latestPoint(figures.spending),
    teachers: latestPoint(figures.teachers),
    salary: latestPoint(figures.salary),
    ratio: latestPoint(figures.ratio),
    math: latestPoint(figures.math),
    reading: latestPoint(figures.reading),
    graduation: latestPoint(figures.graduation),
    college: latestPoint(figures.college),
    efaStudents: latestPoint(figures.efaStudents),
    districts: latestPoint(figures.districts),
    schools: latestPoint(figures.schools),
  };
  const changes = {
    students: changeSince(figures.students, TREND_YEARS),
    perPupil: changeSince(figures.perPupil, TREND_YEARS),
    spending: changeSince(figures.spending, TREND_YEARS),
    teachers: changeSince(figures.teachers, TREND_YEARS),
    salary: changeSince(figures.salary, TREND_YEARS),
    math: changeSince(figures.math, TREND_YEARS),
    reading: changeSince(figures.reading, TREND_YEARS),
    graduation: changeSince(figures.graduation, TREND_YEARS),
    college: changeSince(figures.college, TREND_YEARS),
    efaStudents: changeSince(figures.efaStudents, TREND_YEARS),
    districts: changeSince(figures.districts, TREND_YEARS),
    schools: changeSince(figures.schools, TREND_YEARS),
  };
  const efaPreliminary = latest.efaStudents?.year === PRELIMINARY.efaYear;

  // Plain-language summary, one sentence per figure we have
  const summary: string[] = [];
  if (latest.students) {
    summary.push(`${formatCount(latest.students.value)} students attended New Hampshire public schools in ${formatSchoolYear(latest.students.year)}`
      + (changes.students ? `, ${describeChange(changes.students.percentChange)} from ${formatSchoolYear(changes.students.from.year)}.` : '.'));
  }
  if (latest.perPupil) {
    summary.push(`Schools spent ${formatDollars(latest.perPupil.value)} per student in ${formatSchoolYear(latest.perPupil.year)}`
      + (changes.perPupil
        ? `, ${describeChange(changes.perPupil.percentChange)} from ${formatSchoolYear(changes.perPupil.from.year)} (${describeChange(realPercentChange(changes.perPupil))} after inflation).`
        : '.'));
  }
  if (latest.math && latest.reading && latest.math.year === latest.reading.year) {
    summary.push(`${formatPercent(latest.math.value)} of students tested proficient in math and ${formatPercent(latest.reading.value)} in reading in ${formatSchoolYear(latest.math.year)}.`);
  }
  if (latest.graduation) {
    summary.push(`${formatPercent(latest.graduation.value, 1)} of the class of ${latest.graduation.year}${latest.graduation.year === PRELIMINARY.graduationClass ? ' (preliminary)' : ''} graduated in four years`
      + (latest.college && latest.college.year === latest.graduation.year ? `, and ${formatPercent(latest.college.value)} of graduates planned to go to college.` : '.'));
  }
  if (latest.efaStudents) {
    summary.push(`${formatCount(latest.efaStudents.value)} students have Education Freedom Accounts for ${formatSchoolYear(latest.efaStudents.year)}`
      + (efaPreliminary ? ` (preliminary count as of ${PRELIMINARY.efaAsOf}).` : '.'));
  }

  return (
    <StatePage
      displayName={STATE_PAGES.overview.displayName}
      entityName=""
      status={status}
      onRetry={retry}
      errorMessage="Statewide data could not be loaded."
      // The page link cards below go to the same pages as the phone section links
      showSectionLinks={false}
    >
      {/* Links to each statewide page first; the page title already says "Explore Statewide Data".
          Phones get tighter boxes, so the key figures come up sooner. */}
      <Box sx={{ display: 'grid', gap: { xs: 0.75, sm: 2 }, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }, mb: 4 }}>
        {Object.values(STATE_PAGES)
          .filter(page => page.id !== STATE_PAGES.overview.id)
          .map(page => (
            <Card key={page.id} elevation={0} sx={pageLinkCardStyle}>
              <CardActionArea component={RouterLink} to={page.urlPatterns[0]} sx={{ height: '100%', '& .MuiCardActionArea-focusHighlight': { opacity: 0 } }}>
                <CardContent sx={{ px: { xs: 1.5, sm: 2 }, py: { xs: 1, sm: 2 }, '&:last-child': { pb: { xs: 1, sm: 2 } } }}>
                  <Typography
                    component="h3"
                    sx={{ fontWeight: 600, fontSize: { xs: '0.9375rem', sm: '1rem' }, lineHeight: { xs: '20px', sm: 1.5 }, color: 'text.primary' }}
                  >
                    {page.displayName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' }, lineHeight: { xs: '18px', sm: 1.43 } }}>
                    {PAGE_DESCRIPTIONS[page.id.split('.')[1]]}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
      </Box>


      {/* Tiles as designed on the "NH Statewide Dashboard" canvas: the figure and its year, the
          change since the comparison year (green where the change is good, red where it's bad:
          rises in spending and cost per student are red, rises in everything else green), and a
          trend line. Only
          the dollar tiles (after inflation) and the district and school counts carry a grey note. */}
      {/* One step below the page title, with the same rule beneath */}
      <Box sx={{ mt: 1 }}>
        <SectionTitle displayName="Key Figures" component="h2" sx={{ fontSize: { xs: '1.25rem', sm: '1.375rem' } }} />
      </Box>

      {/* Where four tiles fit across, Schools and Financials sit side by side, each 2 x 2 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, columnGap: 3, rowGap: 0 }}>
      <Band title="Schools" half>
        {latest.students && (
          <OverviewTile
            label="Students"
            value={formatCount(latest.students.value)}
            shortValue={formatThousandsShort(latest.students.value)}
            period={shortYear(latest.students.year)}
            delta={tileDelta(changes.students, { unit: 'percent', higherIsBetter: true })}
            trend={lastYears(figures.students)}
            to={STATE_PAGES.enrollment.urlPatterns[0]}
            linkLabel="enrollment"
          />
        )}
        {latest.teachers && (
          <OverviewTile
            label="Teachers"
            value={formatCount(latest.teachers.value)}
            period={shortYear(latest.teachers.year)}
            delta={tileDelta(changes.teachers, { unit: 'percent', higherIsBetter: true })}
            trend={lastYears(figures.teachers)}
            to={STATE_PAGES.staff.urlPatterns[0]}
            linkLabel="staffing"
          />
        )}
        {latest.districts && (
          <OverviewTile
            label="School Districts"
            value={formatCount(latest.districts.value)}
            period={shortYear(latest.districts.year)}
            delta={tileDelta(changes.districts, { unit: 'percent', higherIsBetter: true })}
            detail={`${formatCount(latest.districts.value)} run their own schools`}
            shortDetail={`${formatCount(latest.districts.value)} run schools`}
            trend={lastYears(figures.districts)}
            to="/districts"
            linkLabel="all districts"
          />
        )}
        {latest.schools && (
          <OverviewTile
            label="Public Schools"
            value={formatCount(latest.schools.value)}
            period={shortYear(latest.schools.year)}
            delta={tileDelta(changes.schools, { unit: 'percent', higherIsBetter: true })}
            detail="K-12, not counting charter schools"
            shortDetail="excl. charter"
            trend={lastYears(figures.schools)}
            to="/districts"
            linkLabel="all districts"
          />
        )}
      </Band>

      <Band title="Financials" half>
        {latest.perPupil && (
          <OverviewTile
            label="Cost per Student"
            value={formatDollars(latest.perPupil.value)}
            shortValue={`$${formatThousandsShort(latest.perPupil.value)}`}
            period={shortYear(latest.perPupil.year)}
            delta={tileDelta(changes.perPupil, { unit: 'percent', higherIsBetter: false })}
            detail={changes.perPupil ? `${capitalize(describeChange(realPercentChange(changes.perPupil)))} after inflation` : undefined}
            trend={lastYears(figures.perPupil)}
            to={STATE_PAGES.financials.urlPatterns[0]}
            linkLabel="spending"
          />
        )}
        {latest.spending && (
          <OverviewTile
            label="Total School District Spending"
            shortLabel="Total Spending"
            value={formatBillionsShort(latest.spending.value)}
            shortValue={formatBillionsShort(latest.spending.value, 1)}
            period={shortYear(latest.spending.year)}
            delta={tileDelta(changes.spending, { unit: 'percent', higherIsBetter: false })}
            detail={changes.spending ? `${capitalize(describeChange(realPercentChange(changes.spending)))} after inflation` : undefined}
            trend={lastYears(figures.spending)}
            to={STATE_PAGES.financials.urlPatterns[0]}
            linkLabel="spending"
          />
        )}
        {latest.salary && (
          <OverviewTile
            label="Average Teacher Salary"
            shortLabel="Avg Teacher Salary"
            value={formatDollars(latest.salary.value)}
            shortValue={`$${formatThousandsShort(latest.salary.value)}`}
            period={shortYear(latest.salary.year)}
            delta={tileDelta(changes.salary, { unit: 'percent', higherIsBetter: true })}
            detail={changes.salary ? `${capitalize(describeChange(realPercentChange(changes.salary)))} after inflation` : undefined}
            trend={lastYears(figures.salary)}
            to={STATE_PAGES.staff.urlPatterns[0]}
            linkLabel="teacher pay"
          />
        )}
        {latest.efaStudents && (
          <OverviewTile
            label="Education Freedom Accounts"
            shortLabel="EFA's"
            value={formatCount(latest.efaStudents.value)}
            shortValue={formatThousandsShort(latest.efaStudents.value, 1)}
            period={shortYear(latest.efaStudents.year)}
            delta={tileDelta(changes.efaStudents, { unit: 'percent', higherIsBetter: true })}
            trend={figures.efaStudents}
            to={STATE_PAGES.efa.urlPatterns[0]}
            linkLabel="EFAs"
          />
        )}
      </Band>

      </Box>

      <Band title="Results">
        {latest.math && (
          <OverviewTile
            label="Proficient in Math"
            value={formatPercent(latest.math.value)}
            period={shortYear(latest.math.year)}
            delta={tileDelta(changes.math, { unit: 'points', higherIsBetter: true })}
            trend={figures.math}
            to={STATE_PAGES.academic.urlPatterns[0]}
            linkLabel="test scores"
          />
        )}
        {latest.reading && (
          <OverviewTile
            label="Proficient in Reading"
            value={formatPercent(latest.reading.value)}
            period={shortYear(latest.reading.year)}
            delta={tileDelta(changes.reading, { unit: 'points', higherIsBetter: true })}
            trend={figures.reading}
            to={STATE_PAGES.academic.urlPatterns[0]}
            linkLabel="test scores"
          />
        )}
        {latest.graduation && (
          <OverviewTile
            label="Four-Year Graduation Rate"
            shortLabel="Graduation Rate"
            value={formatPercent(latest.graduation.value, 1)}
            period={String(latest.graduation.year)}
            delta={tileDelta(changes.graduation, { unit: 'points', classYears: true, higherIsBetter: true })}
            trend={lastYears(figures.graduation)}
            to={STATE_PAGES.outcomes.urlPatterns[0]}
            linkLabel="graduation"
          />
        )}
        {latest.college && (
          <OverviewTile
            label="Planning to Attend College"
            shortLabel="Planning College"
            value={formatPercent(latest.college.value)}
            period={String(latest.college.year)}
            delta={tileDelta(changes.college, { unit: 'points', classYears: true, higherIsBetter: true })}
            trend={lastYears(figures.college)}
            to={STATE_PAGES.outcomes.urlPatterns[0]}
            linkLabel="graduates' plans"
          />
        )}
      </Band>


      <Divider sx={{ mb: 3 }} />

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 7fr) minmax(0, 5fr)' }, alignItems: 'start', mb: 2 }}>
        {summary.length > 0 && (
          <Paper elevation={0} component="section" aria-labelledby="in-brief" sx={{ p: 2, border: '1px solid', borderColor: 'grey.300' }}>
            <Typography id="in-brief" variant="h6" component="h2" sx={{ fontSize: '1.125rem', fontWeight: 600, mb: 1 }}>In brief</Typography>
            <Box component="ul" sx={{ m: 0, pl: 3 }}>
              {summary.map(sentence => (
                <Typography component="li" variant="body1" key={sentence} sx={{ mb: 0.5 }}>{sentence}</Typography>
              ))}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Each figure is from the latest year available, so years differ by source.
            </Typography>
          </Paper>
        )}
        <Paper elevation={0} component="section" sx={{ p: 2, border: '1px solid', borderColor: 'grey.300' }}>
          <DistrictPicker label="See how your district compares" />
          <Typography variant="body2" sx={{ mt: -2 }}>
            Or <Link component={RouterLink} to="/districts">browse all districts</Link>.
          </Typography>
        </Paper>
      </Box>
    </StatePage>
  );
};

export default StateOverview;
