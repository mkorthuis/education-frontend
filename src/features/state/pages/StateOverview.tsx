import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, Divider, Paper, Stack, Typography } from '@mui/material';
import { calculateInflationAdjustedAmount } from '@/utils/calculations';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import StatePage from '../components/StatePage';
import StatTile from '../components/StatTile';
import { useStateLoads } from '../hooks/useStateLoads';
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
  Change,
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
  proficiencyBySubject,
  studentsPerTeacher,
  toSeries,
  YearValue,
} from '../utils/stateMetrics';

const TREND_YEARS = 10;
const STATE_PAGES = PAGE_REGISTRY.state;

const navigationButtonStyle = {
  backgroundColor: 'grey.100',
  borderColor: 'divider',
  color: 'text.primary',
  '&:hover': { backgroundColor: 'grey.300' },
};

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** "Down 12% since 2014-15" */
const changeText = (change: Change | null) =>
  change ? `${capitalize(describeChange(change.percentChange))} since ${formatSchoolYear(change.from.year)}` : undefined;

/** Change in percentage points, for rates: "Up 2 points since the class of 2015" */
const pointChangeText = (change: Change | null, since: string) => {
  if (!change) return undefined;
  const points = Math.round(change.change);
  if (points === 0) return `Unchanged since ${since}`;
  return `${points > 0 ? 'Up' : 'Down'} ${Math.abs(points)} point${Math.abs(points) === 1 ? '' : 's'} since ${since}`;
};

/** Percent change once the earlier amount is restated in the later year's dollars. */
const realPercentChange = (change: Change) => {
  const adjustedFrom = calculateInflationAdjustedAmount(change.from.value, change.from.year, change.to.year);
  return ((change.to.value - adjustedFrom) / adjustedFrom) * 100;
};

const lastYears = (series: YearValue[]) => {
  const latest = latestPoint(series);
  return latest ? series.filter(point => point.year > latest.year - TREND_YEARS - 1) : series;
};

const StateOverview: React.FC = () => {
  const enrollment = useStateEnrollmentData();
  const finance = useStateFinanceData();
  const staff = useStateStaffData();
  const outcomes = useStateOutcomeData();
  const assessment = useStateAssessmentData();
  const efa = useStateEfaData();

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
    const math = toSeries(proficiency, row => row.math);
    const reading = toSeries(proficiency, row => row.reading);
    const graduation = toSeries(graduationRates(outcomes.cohorts), row => row.graduated);
    const college = toSeries(postGraduationShares(outcomes.postGraduation), row => row.college);
    const efaYears = efaTotals(efa.entries, efa.entryTypes);
    return {
      students, perPupil, spending, teachers, salary, ratio, math, reading, graduation, college,
      efaStudents: toSeries(efaYears, row => row.students),
      efaCost: toSeries(efaYears, row => row.estimatedCost),
    };
  }, [enrollment.adm, finance.perPupil, finance.rollups, staff.staff, staff.salary, assessment.assessments, outcomes.cohorts, outcomes.postGraduation, efa.entries, efa.entryTypes]);

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
  };
  const changes = {
    students: changeSince(figures.students, TREND_YEARS),
    perPupil: changeSince(figures.perPupil, TREND_YEARS),
    spending: changeSince(figures.spending, TREND_YEARS),
    teachers: changeSince(figures.teachers, TREND_YEARS),
    salary: changeSince(figures.salary, TREND_YEARS),
    // Since the current test (the NH SAS) began in 2018
    math: changeSince(figures.math.filter(point => point.year >= 2018), TREND_YEARS),
    reading: changeSince(figures.reading.filter(point => point.year >= 2018), TREND_YEARS),
    graduation: changeSince(figures.graduation, TREND_YEARS),
    college: changeSince(figures.college, TREND_YEARS),
  };
  const efaCost = figures.efaCost.find(point => point.year === latest.efaStudents?.year && point.value > 0);

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
    summary.push(`${formatPercent(latest.graduation.value, 1)} of the class of ${latest.graduation.year} graduated in four years`
      + (latest.college && latest.college.year === latest.graduation.year ? `, and ${formatPercent(latest.college.value)} of graduates planned to go to college.` : '.'));
  }
  if (latest.efaStudents) {
    summary.push(`${formatCount(latest.efaStudents.value)} students have Education Freedom Accounts for ${formatSchoolYear(latest.efaStudents.year)}.`);
  }

  return (
    <StatePage
      displayName={STATE_PAGES.overview.displayName}
      status={status}
      onRetry={retry}
      errorMessage="Statewide data could not be loaded."
      intro="Figures for all of New Hampshire's public schools together. These are the state averages that every district and school page compares against."
      source="NH Department of Education (enrollment, finances, staffing, assessments, graduation and EFA reports)"
    >
      {summary.length > 0 && (
        <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider', maxWidth: 900 }}>
          <Typography variant="h6" component="h2" gutterBottom>In brief</Typography>
          <Box component="ul" sx={{ m: 0, pl: 3 }}>
            {summary.map(sentence => (
              <Typography component="li" variant="body1" key={sentence} sx={{ mb: 0.5 }}>{sentence}</Typography>
            ))}
          </Box>
        </Paper>
      )}

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          mb: 4,
        }}
      >
        {latest.students && (
          <StatTile
            label="Students (average daily membership)"
            value={formatCount(latest.students.value)}
            period={formatSchoolYear(latest.students.year)}
            change={changeText(changes.students)}
            trend={lastYears(figures.students)}
            to={STATE_PAGES.enrollment.urlPatterns[0]}
          />
        )}
        {latest.perPupil && (
          <StatTile
            label="Cost per student"
            value={formatDollars(latest.perPupil.value)}
            period={formatSchoolYear(latest.perPupil.year)}
            change={changeText(changes.perPupil)}
            detail={changes.perPupil ? `${capitalize(describeChange(realPercentChange(changes.perPupil)))} after inflation` : undefined}
            trend={lastYears(figures.perPupil)}
            to={STATE_PAGES.financials.urlPatterns[0]}
          />
        )}
        {latest.spending && (
          <StatTile
            label="Total school district spending"
            value={`$${(latest.spending.value / 1e9).toFixed(2)} billion`}
            period={formatSchoolYear(latest.spending.year)}
            change={changeText(changes.spending)}
            trend={lastYears(figures.spending)}
            to={STATE_PAGES.financials.urlPatterns[0]}
          />
        )}
        {latest.salary && (
          <StatTile
            label="Average teacher salary"
            value={formatDollars(latest.salary.value)}
            period={formatSchoolYear(latest.salary.year)}
            change={changeText(changes.salary)}
            detail={changes.salary ? `${capitalize(describeChange(realPercentChange(changes.salary)))} after inflation` : undefined}
            trend={lastYears(figures.salary)}
            to={STATE_PAGES.staff.urlPatterns[0]}
          />
        )}
        {latest.teachers && (
          <StatTile
            label="Teachers (full-time equivalent)"
            value={formatCount(latest.teachers.value)}
            period={formatSchoolYear(latest.teachers.year)}
            change={changeText(changes.teachers)}
            detail={latest.ratio ? `${latest.ratio.value.toFixed(1)} students per teacher in ${formatSchoolYear(latest.ratio.year)}` : undefined}
            trend={lastYears(figures.teachers)}
            to={STATE_PAGES.staff.urlPatterns[0]}
          />
        )}
        {latest.math && (
          <StatTile
            label="Proficient in math"
            value={formatPercent(latest.math.value)}
            period={formatSchoolYear(latest.math.year)}
            change={pointChangeText(changes.math, changes.math ? formatSchoolYear(changes.math.from.year) : '')}
            detail="All tested grades"
            trend={figures.math.filter(point => point.year >= 2018)}
            to={STATE_PAGES.academic.urlPatterns[0]}
          />
        )}
        {latest.reading && (
          <StatTile
            label="Proficient in reading"
            value={formatPercent(latest.reading.value)}
            period={formatSchoolYear(latest.reading.year)}
            change={pointChangeText(changes.reading, changes.reading ? formatSchoolYear(changes.reading.from.year) : '')}
            detail="All tested grades"
            trend={figures.reading.filter(point => point.year >= 2018)}
            to={STATE_PAGES.academic.urlPatterns[0]}
          />
        )}
        {latest.graduation && (
          <StatTile
            label="Four-year graduation rate"
            value={formatPercent(latest.graduation.value, 1)}
            period={`Class of ${latest.graduation.year}`}
            change={pointChangeText(changes.graduation, changes.graduation ? `the class of ${changes.graduation.from.year}` : '')}
            trend={lastYears(figures.graduation)}
            to={STATE_PAGES.outcomes.urlPatterns[0]}
          />
        )}
        {latest.college && (
          <StatTile
            label="Graduates planning to attend college"
            value={formatPercent(latest.college.value)}
            period={`Class of ${latest.college.year}`}
            change={pointChangeText(changes.college, changes.college ? `the class of ${changes.college.from.year}` : '')}
            detail="Two- and four-year colleges"
            trend={lastYears(figures.college)}
            to={STATE_PAGES.outcomes.urlPatterns[0]}
          />
        )}
        {latest.efaStudents && (
          <StatTile
            label="Education Freedom Account students"
            value={formatCount(latest.efaStudents.value)}
            period={formatSchoolYear(latest.efaStudents.year)}
            detail={efaCost ? `About $${Math.round(efaCost.value / 1e6)} million in estimated state aid` : undefined}
            trend={figures.efaStudents}
            to={STATE_PAGES.efa.urlPatterns[0]}
          />
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Typography variant="h6" component="h2" gutterBottom>Explore statewide data</Typography>
      <Stack direction="column" spacing={2} sx={{ mb: 3, maxWidth: 900 }}>
        {Object.values(STATE_PAGES)
          .filter(page => page.id !== STATE_PAGES.overview.id)
          .map(page => (
            <Button
              key={page.id}
              variant="outlined"
              color="inherit"
              component={Link}
              to={page.urlPatterns[0]}
              fullWidth
              sx={navigationButtonStyle}
            >
              {page.displayName}
            </Button>
          ))}
      </Stack>
      <Typography variant="body1">
        To see how one district compares, <Link to="/districts">find your district</Link>.
      </Typography>
    </StatePage>
  );
};

export default StateOverview;
