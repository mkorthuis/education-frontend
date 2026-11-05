import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import { GroupLabel, MetricTile, NavCard, NavCardGrid, SectionHeading } from '@/components/ds';
import StatePage from '../components/StatePage';
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
  graduationRates,
  latestPoint,
  postGraduationShares,
  proficiencyBySubject,
  studentsPerTeacher,
  toSeries,
  YearValue,
} from '../utils/stateMetrics';
import { capitalize, formatDollarsShort, formatThousands, realPercentChange, shortYear, tileDelta } from '../utils/phrases';


const TREND_YEARS = 10;
// The current state test (the NH SAS) began in 2017-18; earlier scores aren't comparable
const CURRENT_TEST_FIRST_YEAR = 2018;
const STATE_PAGES = PAGE_REGISTRY.state;

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

// A group of tiles under the Key Statewide Figures heading
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
    <GroupLabel>{title}</GroupLabel>
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
      {/* Links to each statewide page first; the page title already says "Explore Statewide Data" */}
      <NavCardGrid>
        {Object.values(STATE_PAGES)
          .filter(page => page.id !== STATE_PAGES.overview.id)
          .map(page => (
            <NavCard key={page.id} title={page.displayName} description={PAGE_DESCRIPTIONS[page.id.split('.')[1]]} to={page.urlPatterns[0]} />
          ))}
      </NavCardGrid>


      {/* Each tile: the figure and its year, the change since the comparison year (green where the
          change is good, red where it's bad: rises in spending and cost per student are red, rises
          in everything else green), and a trend line. Only the dollar tiles (after inflation) and
          the district and school counts carry a grey note. */}
      <SectionHeading>Key Statewide Figures</SectionHeading>

      {/* Where four tiles fit across, Schools and Financials sit side by side, each 2 x 2 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, columnGap: 3, rowGap: 0 }}>
      <Band title="Schools" half>
        {latest.students && (
          <MetricTile
            label="Students"
            value={formatCount(latest.students.value)}
            shortValue={formatThousands(latest.students.value)}
            period={shortYear(latest.students.year)}
            delta={tileDelta(changes.students, { unit: 'percent', higherIsBetter: true })}
            trend={lastYears(figures.students)}
            to={STATE_PAGES.enrollment.urlPatterns[0]}
            linkLabel="enrollment"
          />
        )}
        {latest.teachers && (
          <MetricTile
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
          <MetricTile
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
          <MetricTile
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
          <MetricTile
            label="Cost per Student"
            value={formatDollars(latest.perPupil.value)}
            shortValue={`$${formatThousands(latest.perPupil.value)}`}
            period={shortYear(latest.perPupil.year)}
            delta={tileDelta(changes.perPupil, { unit: 'percent', higherIsBetter: false })}
            detail={changes.perPupil ? `${capitalize(describeChange(realPercentChange(changes.perPupil)))} after inflation` : undefined}
            trend={lastYears(figures.perPupil)}
            to={STATE_PAGES.financials.urlPatterns[0]}
            linkLabel="spending"
          />
        )}
        {latest.spending && (
          <MetricTile
            label="Total School District Spending"
            shortLabel="Total Spending"
            value={formatDollarsShort(latest.spending.value)}
            shortValue={formatDollarsShort(latest.spending.value, 1)}
            period={shortYear(latest.spending.year)}
            delta={tileDelta(changes.spending, { unit: 'percent', higherIsBetter: false })}
            detail={changes.spending ? `${capitalize(describeChange(realPercentChange(changes.spending)))} after inflation` : undefined}
            trend={lastYears(figures.spending)}
            to={STATE_PAGES.financials.urlPatterns[0]}
            linkLabel="spending"
          />
        )}
        {latest.salary && (
          <MetricTile
            label="Average Teacher Salary"
            shortLabel="Avg Teacher Salary"
            value={formatDollars(latest.salary.value)}
            shortValue={`$${formatThousands(latest.salary.value)}`}
            period={shortYear(latest.salary.year)}
            delta={tileDelta(changes.salary, { unit: 'percent', higherIsBetter: true })}
            detail={changes.salary ? `${capitalize(describeChange(realPercentChange(changes.salary)))} after inflation` : undefined}
            trend={lastYears(figures.salary)}
            to={STATE_PAGES.staff.urlPatterns[0]}
            linkLabel="teacher pay"
          />
        )}
        {latest.efaStudents && (
          <MetricTile
            label="Education Freedom Accounts"
            shortLabel="EFA's"
            value={formatCount(latest.efaStudents.value)}
            shortValue={formatThousands(latest.efaStudents.value, 1)}
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
          <MetricTile
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
          <MetricTile
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
          <MetricTile
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
          <MetricTile
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
    </StatePage>
  );
};

export default StateOverview;
