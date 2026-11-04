import React, { useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Accordion, AccordionDetails, AccordionSummary, Box, Card, CardActionArea, CardContent, Divider, Link, Paper, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import StatePage from '../components/StatePage';
import OverviewTile from '../components/OverviewTile';
import DistrictPicker from '../components/DistrictPicker';
import { READING_WIDTH } from '../components/chartText';
import { useStateLoads } from '../hooks/useStateLoads';
import {
  useStateAssessmentData,
  useStateEfaData,
  useStateEnrollmentData,
  useStateFinanceData,
  useStateOutcomeData,
  useStateSafetyData,
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
  shareOfEnrollment,
  studentsPerTeacher,
  toSeries,
  YearValue,
} from '../utils/stateMetrics';
import { capitalize, realPercentChange, shortYear, tileDelta } from '../utils/phrases';

/** "$4.14B", short enough to leave room for the change and trend line on the tile */
const formatBillionsShort = (value: number) => `$${(value / 1e9).toFixed(2)}B`;

const TREND_YEARS = 10;
// The current state test (the NH SAS) began in 2017-18; earlier scores aren't comparable
const CURRENT_TEST_FIRST_YEAR = 2018;
const STATE_PAGES = PAGE_REGISTRY.state;

const PAGE_DESCRIPTIONS: Record<string, string> = {
  academic: 'Test scores by subject, grade and student group',
  outcomes: 'Graduation and dropout rates, and graduates\' plans',
  financials: 'Cost per student, total spending and where the money comes from',
  safety: 'Truancy, bullying, restraint and serious incidents',
  staff: 'Teacher pay, staffing levels and class size',
  enrollment: 'Students by year, school level and grade',
  efa: 'EFA students and estimated state cost',
};

const GLOSSARY: { term: string; definition: string }[] = [
  { term: 'Students (average daily membership)', definition: 'The average number of students enrolled on each school day over the year. Cost per student is based on it.' },
  { term: 'Teachers (full-time equivalent)', definition: 'Teachers counted by time worked: a full-time teacher counts as 1 and a half-time teacher as 0.5.' },
  { term: 'Proficient', definition: 'Scored at level 3 or 4 of 4 on the state test, meaning the student met or exceeded the grade-level standard.' },
  { term: 'Cost per student', definition: 'Day-to-day school spending (not building projects or debt), less tuition and transportation, divided by average daily membership.' },
  { term: 'Four-year graduation rate', definition: 'The share of students who started grade 9 together (adjusted for students moving in and out) who earned a regular diploma within four years.' },
  { term: 'Truant', definition: 'Ten or more half-days of unexcused absence in a school year.' },
  { term: 'Education Freedom Account (EFA)', definition: 'State education aid that families can spend on private school tuition, homeschooling and other approved costs instead of attending public school.' },
  { term: 'Preliminary', definition: 'The state\'s first count for the latest year; it can change when the state finalizes it.' },
];

const lastYears = (series: YearValue[]) => {
  const latest = latestPoint(series);
  return latest ? series.filter(point => point.year > latest.year - TREND_YEARS - 1) : series;
};


const tileGrid = {
  display: 'grid',
  gap: { xs: 1, sm: 2 },
  gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
};

const Band: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Box component="section" sx={{ mb: 4 }}>
    <Typography variant="h6" component="h2" sx={{ fontSize: '1.125rem', fontWeight: 600, mb: 1.5 }}>{title}</Typography>
    <Box sx={tileGrid}>{children}</Box>
  </Box>
);

const StateOverview: React.FC = () => {
  const enrollment = useStateEnrollmentData();
  const finance = useStateFinanceData();
  const staff = useStateStaffData();
  const outcomes = useStateOutcomeData();
  const assessment = useStateAssessmentData();
  const efa = useStateEfaData();
  const safety = useStateSafetyData();

  const { status, retry } = useStateLoads([
    ...enrollment.loads,
    ...finance.loads,
    ...staff.loads,
    ...outcomes.loads,
    ...assessment.loads,
    ...efa.loads,
    ...safety.truancyLoads,
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
    const truancy = shareOfEnrollment(toSeries(safety.truancy, row => row.count), toSeries(safety.enrollment, row => row.total_enrollment));
    const efaYears = efaTotals(efa.entries, efa.entryTypes);
    return {
      students, perPupil, spending, teachers, salary, ratio, math, reading, graduation, college, truancy,
      efaStudents: toSeries(efaYears, row => row.students),
    };
  }, [enrollment.adm, finance.perPupil, finance.rollups, staff.staff, staff.salary, assessment.assessments, outcomes.cohorts, outcomes.postGraduation, safety.truancy, safety.enrollment, efa.entries, efa.entryTypes]);

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
    truancy: latestPoint(figures.truancy),
    efaStudents: latestPoint(figures.efaStudents),
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
    truancy: changeSince(figures.truancy, TREND_YEARS),
    efaStudents: changeSince(figures.efaStudents, TREND_YEARS),
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
      intro="Figures for all of New Hampshire's public schools together. These are the state averages that every district and school page compares against."
      source="NH Department of Education (enrollment, finances, staffing, assessments, graduation, safety and EFA reports)"
    >
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 7fr) minmax(0, 5fr)' }, alignItems: 'start', mb: 4 }}>
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

      {/* Tiles as designed on the "NH Statewide Dashboard" canvas: the figure and its year, the
          change since the comparison year as a green up or red down arrow, and a trend line. Only
          the dollar tiles (after inflation) and truancy (what counts as truant) carry a grey note. */}
      <Band title="Results">
        {latest.math && (
          <OverviewTile
            label="Proficient in math"
            value={formatPercent(latest.math.value)}
            period={shortYear(latest.math.year)}
            delta={tileDelta(changes.math, { unit: 'points' })}
            trend={figures.math}
            to={STATE_PAGES.academic.urlPatterns[0]}
            linkLabel="test scores"
          />
        )}
        {latest.reading && (
          <OverviewTile
            label="Proficient in reading"
            value={formatPercent(latest.reading.value)}
            period={shortYear(latest.reading.year)}
            delta={tileDelta(changes.reading, { unit: 'points' })}
            trend={figures.reading}
            to={STATE_PAGES.academic.urlPatterns[0]}
            linkLabel="test scores"
          />
        )}
        {latest.graduation && (
          <OverviewTile
            label="Four-year graduation rate"
            value={formatPercent(latest.graduation.value, 1)}
            period={String(latest.graduation.year)}
            delta={tileDelta(changes.graduation, { unit: 'points', classYears: true })}
            trend={lastYears(figures.graduation)}
            to={STATE_PAGES.outcomes.urlPatterns[0]}
            linkLabel="graduation"
          />
        )}
        {latest.college && (
          <OverviewTile
            label="Graduates planning to attend college"
            value={formatPercent(latest.college.value)}
            period={String(latest.college.year)}
            delta={tileDelta(changes.college, { unit: 'points', classYears: true })}
            trend={lastYears(figures.college)}
            to={STATE_PAGES.outcomes.urlPatterns[0]}
            linkLabel="graduates' plans"
          />
        )}
      </Band>

      <Band title="Money">
        {latest.perPupil && (
          <OverviewTile
            label="Cost per student"
            value={formatDollars(latest.perPupil.value)}
            period={shortYear(latest.perPupil.year)}
            delta={tileDelta(changes.perPupil, { unit: 'percent' })}
            detail={changes.perPupil ? `${capitalize(describeChange(realPercentChange(changes.perPupil)))} after inflation` : undefined}
            trend={lastYears(figures.perPupil)}
            to={STATE_PAGES.financials.urlPatterns[0]}
            linkLabel="spending"
          />
        )}
        {latest.spending && (
          <OverviewTile
            label="Total school district spending"
            value={formatBillionsShort(latest.spending.value)}
            period={shortYear(latest.spending.year)}
            delta={tileDelta(changes.spending, { unit: 'percent' })}
            detail={changes.spending ? `${capitalize(describeChange(realPercentChange(changes.spending)))} after inflation` : undefined}
            trend={lastYears(figures.spending)}
            to={STATE_PAGES.financials.urlPatterns[0]}
            linkLabel="spending"
          />
        )}
        {latest.salary && (
          <OverviewTile
            label="Average teacher salary"
            value={formatDollars(latest.salary.value)}
            period={shortYear(latest.salary.year)}
            delta={tileDelta(changes.salary, { unit: 'percent' })}
            detail={changes.salary ? `${capitalize(describeChange(realPercentChange(changes.salary)))} after inflation` : undefined}
            trend={lastYears(figures.salary)}
            to={STATE_PAGES.staff.urlPatterns[0]}
            linkLabel="teacher pay"
          />
        )}
        {latest.efaStudents && (
          <OverviewTile
            label="Education Freedom Account students"
            value={formatCount(latest.efaStudents.value)}
            period={shortYear(latest.efaStudents.year)}
            delta={tileDelta(changes.efaStudents, { unit: 'percent' })}
            trend={figures.efaStudents}
            to={STATE_PAGES.efa.urlPatterns[0]}
            linkLabel="EFAs"
          />
        )}
      </Band>

      <Band title="Students and staff">
        {latest.students && (
          <OverviewTile
            label="Students"
            value={formatCount(latest.students.value)}
            period={shortYear(latest.students.year)}
            delta={tileDelta(changes.students, { unit: 'percent' })}
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
            delta={tileDelta(changes.teachers, { unit: 'percent' })}
            trend={lastYears(figures.teachers)}
            to={STATE_PAGES.staff.urlPatterns[0]}
            linkLabel="staffing"
          />
        )}
        {latest.truancy && (
          <OverviewTile
            label="Students who were truant"
            value={formatPercent(latest.truancy.value, 1)}
            period={shortYear(latest.truancy.year)}
            delta={tileDelta(changes.truancy, { unit: 'points' })}
            detail="10 or more half-days of unexcused absence"
            trend={lastYears(figures.truancy)}
            to={STATE_PAGES.safety.urlPatterns[0]}
            linkLabel="attendance and safety"
          />
        )}
      </Band>

      <Divider sx={{ mb: 3 }} />

      <Typography variant="h6" component="h2" sx={{ fontSize: '1.125rem', fontWeight: 600, mb: 1.5 }}>Explore statewide data</Typography>
      <Box sx={{ display: 'grid', gap: { xs: 1, sm: 2 }, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }, mb: 4 }}>
        {Object.values(STATE_PAGES)
          .filter(page => page.id !== STATE_PAGES.overview.id)
          .map(page => (
            <Card key={page.id} elevation={0} sx={{ border: '1px solid', borderColor: 'grey.300', '&:hover, &:focus-within': { borderColor: 'primary.main' } }}>
              <CardActionArea component={RouterLink} to={page.urlPatterns[0]} sx={{ height: '100%', '& .MuiCardActionArea-focusHighlight': { opacity: 0 } }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography component="h3" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {page.displayName} <span aria-hidden>→</span>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">{PAGE_DESCRIPTIONS[page.id.split('.')[1]]}</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
      </Box>

      <Accordion
        elevation={0}
        disableGutters
        // The summary button sits inside the heading, not the other way round
        slotProps={{ heading: { component: 'h2' } }}
        sx={{ border: '1px solid', borderColor: 'grey.300', maxWidth: READING_WIDTH, '&:before': { display: 'none' } }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="state-glossary" id="state-glossary-header">
          <Typography component="span" sx={{ fontWeight: 600 }}>What these terms mean</Typography>
        </AccordionSummary>
        <AccordionDetails id="state-glossary">
          <Box component="dl" sx={{ m: 0 }}>
            {GLOSSARY.map(entry => (
              <Box key={entry.term} sx={{ mb: 1.5 }}>
                <Typography component="dt" variant="body2" sx={{ fontWeight: 600 }}>{entry.term}</Typography>
                <Typography component="dd" variant="body2" sx={{ m: 0 }}>{entry.definition}</Typography>
              </Box>
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>
    </StatePage>
  );
};

export default StateOverview;
