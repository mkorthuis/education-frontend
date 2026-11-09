import React from 'react';
import { Alert, Box, CircularProgress, Typography, useMediaQuery, useTheme } from '@mui/material';
import { MetricTile, TileGroup } from '@/components/ds';
import LoadErrorAlert from '@/components/ui/LoadErrorAlert';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import { useAppSelector } from '@/store/hooks';
import {
  selectCurrentDistrict,
  selectCurrentTowns,
  selectCurrentSchools,
  selectCurrentSau,
  selectLocationError,
} from '@/store/slices/locationSlice';
import { RootState } from '@/store/store';
import {
  Change,
  describeChange,
  formatCount,
  formatDollars,
  formatPercent,
  latestPoint,
  tileChange,
  tileTrend,
} from '@/features/state/utils/stateMetrics';
import { capitalize, formatThousands, realPercentChange, shortYear, tileDelta } from '@/features/state/utils/phrases';
import {
  comparison,
  isPageAvailable,
  KeyFiguresLoading,
  noteLines,
  OverviewGrid,
  OverviewSection,
  OverviewTitle,
  PageCards,
  pagePath,
  PHONE_SPACING,
  plansUnknownNote,
  SchoolCards,
  subjectTile,
} from '@/features/entity/overview/OverviewParts';
import { DistrictKeyFigures, useDistrictKeyFigures } from '../hooks/useDistrictKeyFigures';
import { districtFacts, districtPhoneTitle, districtTitle, DISTRICT_PAGE_DESCRIPTIONS } from '../utils/labels';

// A district's overview, on the pattern of the statewide overview: its name and what it is, cards to
// its pages and its schools, and key figures with the state's beside them.

const DISTRICT_PAGES = PAGE_REGISTRY.district;
const GROUPS = ['Students and Spending', 'Results'];

// Whether the district's own location data is loading. Not every location request: the overview's
// test scores load the grade list, which would otherwise swap the page for a spinner mid-load.
const selectDistrictLoading = (state: RootState) => {
  const { district, schools, towns, sau } = state.location.loadingStates;
  return district || schools || towns || sau;
};

type District = NonNullable<ReturnType<typeof selectCurrentDistrict>>;
type School = ReturnType<typeof selectCurrentSchools>[number];
type Town = ReturnType<typeof selectCurrentTowns>[number];

/** A dollar tile's note: the state's figure and, as on the statewide tiles, the change after inflation */
const dollarNote = (state: string | undefined, change: Change | null) =>
  noteLines(state, change ? `${capitalize(describeChange(realPercentChange(change)))} after inflation` : undefined);

const KeyFigures: React.FC<{ figures: DistrictKeyFigures; districtId: number; towns: Town[] }> = ({ figures, districtId, towns }) => {
  const to = (key: keyof typeof DISTRICT_PAGES) => pagePath(DISTRICT_PAGES[key], districtId);
  const statewide = (series: typeof figures.state.perPupil, year: number, format: (value: number) => string) =>
    comparison('Statewide', series, year, format);
  const latest = {
    students: latestPoint(figures.students),
    perPupil: latestPoint(figures.perPupil),
    salary: latestPoint(figures.salary),
    efaStudents: latestPoint(figures.efaStudents),
    graduation: latestPoint(figures.graduation),
    college: latestPoint(figures.college),
  };
  const changes = {
    students: tileChange(figures.students),
    perPupil: tileChange(figures.perPupil),
    salary: tileChange(figures.salary),
    efaStudents: tileChange(figures.efaStudents),
    graduation: tileChange(figures.graduation),
    college: tileChange(figures.college),
  };
  const unknownPlans = latest.college ? plansUnknownNote(figures.plansUnknown, latest.college.year) : undefined;
  const livingIn = towns.length === 1 ? `living in ${towns[0].name}` : `living in its ${towns.length} towns`;

  // Each tile only when the district has the figure
  const studentsAndSpending = [
    latest.students && (
      <MetricTile
        key="students"
        label="Students"
        value={formatCount(latest.students.value)}
        // Phones shorten only large counts: 12K, not 0.3K
        shortValue={latest.students.value >= 10000 ? formatThousands(latest.students.value) : undefined}
        period={shortYear(latest.students.year)}
        delta={tileDelta(changes.students, { unit: 'percent', higherIsBetter: true })}
        detail={`Public school students ${livingIn}`}
        shortDetail={capitalize(livingIn)}
        trend={tileTrend(figures.students)}
        to={to('enrollment')}
        linkLabel="enrollment"
      />
    ),
    latest.perPupil && (
      <MetricTile
        key="perPupil"
        label="Cost per Student"
        value={formatDollars(latest.perPupil.value)}
        shortValue={`$${formatThousands(latest.perPupil.value)}`}
        period={shortYear(latest.perPupil.year)}
        delta={tileDelta(changes.perPupil, { unit: 'percent', higherIsBetter: false })}
        detail={dollarNote(statewide(figures.state.perPupil, latest.perPupil.year, formatDollars), changes.perPupil)}
        shortDetail={statewide(figures.state.perPupil, latest.perPupil.year, value => `$${formatThousands(value)}`)}
        trend={tileTrend(figures.perPupil)}
        to={to('financials')}
        linkLabel="spending"
      />
    ),
    latest.salary && (
      <MetricTile
        key="salary"
        label="Average Teacher Salary"
        shortLabel="Avg Teacher Salary"
        value={formatDollars(latest.salary.value)}
        shortValue={`$${formatThousands(latest.salary.value)}`}
        period={shortYear(latest.salary.year)}
        delta={tileDelta(changes.salary, { unit: 'percent', higherIsBetter: true })}
        detail={dollarNote(statewide(figures.state.salary, latest.salary.year, formatDollars), changes.salary)}
        shortDetail={statewide(figures.state.salary, latest.salary.year, value => `$${formatThousands(value)}`)}
        trend={tileTrend(figures.salary)}
        to={to('staff')}
        linkLabel="teacher pay"
      />
    ),
    latest.efaStudents && (
      <MetricTile
        key="efa"
        label="Education Freedom Accounts"
        shortLabel="EFA's"
        value={formatCount(latest.efaStudents.value)}
        period={shortYear(latest.efaStudents.year)}
        delta={tileDelta(changes.efaStudents, { unit: 'percent', higherIsBetter: true })}
        detail={`Students ${livingIn}`}
        shortDetail={capitalize(livingIn)}
        trend={figures.efaStudents}
        to={to('efa')}
        linkLabel="EFAs"
      />
    ),
  ].filter(Boolean);

  const results = [
    subjectTile('Proficient in Math', figures.math, [{ label: 'Statewide', series: figures.state.math }], to('academic')),
    subjectTile('Proficient in Reading', figures.reading, [{ label: 'Statewide', series: figures.state.reading }], to('academic')),
    latest.graduation && (
      <MetricTile
        key="graduation"
        label="Four-Year Graduation Rate"
        shortLabel="Graduation Rate"
        value={formatPercent(latest.graduation.value, 1)}
        // By school year like the other tiles: the class of 2025 graduated in 24/25
        period={shortYear(latest.graduation.year)}
        delta={tileDelta(changes.graduation, { unit: 'points', higherIsBetter: true })}
        detail={statewide(figures.state.graduation, latest.graduation.year, value => formatPercent(value, 1))}
        trend={tileTrend(figures.graduation)}
        to={to('outcomes')}
        linkLabel="graduation"
      />
    ),
    latest.college && (
      <MetricTile
        key="college"
        label="Planning to Attend College"
        shortLabel="Planning College"
        value={formatPercent(latest.college.value)}
        period={shortYear(latest.college.year)}
        delta={tileDelta(changes.college, { unit: 'points', higherIsBetter: true })}
        detail={noteLines(statewide(figures.state.college, latest.college.year, value => formatPercent(value)), unknownPlans?.full)}
        shortDetail={unknownPlans?.short}
        trend={tileTrend(figures.college)}
        to={to('outcomes')}
        linkLabel="graduates' plans"
      />
    ),
  ].filter(Boolean);

  if (studentsAndSpending.length === 0 && results.length === 0) {
    return <Typography variant="body1" sx={{ mb: 4 }}>This district has no figures to show yet.</Typography>;
  }
  return (
    <>
      {studentsAndSpending.length > 0 && <TileGroup title={GROUPS[0]} sx={PHONE_SPACING.section}>{studentsAndSpending}</TileGroup>}
      {results.length > 0 && <TileGroup title={GROUPS[1]} sx={PHONE_SPACING.section}>{results}</TileGroup>}
    </>
  );
};

const DistrictOverview: React.FC<{ district: District; towns: Town[]; schools: School[]; sauId: number }> = ({ district, towns, schools, sauId }) => {
  const title = districtTitle(district.name);
  const hasSchools = schools.length > 0;
  // Phones: "Concord (SAU 8)" over the towns served; wider screens: "Concord School District" over
  // the SAU, towns, grades and schools
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const facts = districtFacts({ sauId, towns, grades: district.grades, schoolCount: schools.length, phone: isPhone });

  // The registry's rules for the district's pages look at its schools
  const withSchools = { ...district, schools };
  const pages = Object.values(DISTRICT_PAGES).filter(page => page.id !== DISTRICT_PAGES.overview.id);
  const hasGraduation = isPageAvailable(DISTRICT_PAGES.outcomes, withSchools);

  const { status, retry, figures } = useDistrictKeyFigures(district.id, { hasSchools, hasGraduation });

  return (
    <>
      <OverviewTitle title={isPhone ? districtPhoneTitle(district.name, sauId) : title} facts={facts.length > 0 ? facts.join(' · ') : undefined} />
      <OverviewGrid twoColumns={hasSchools}>
        <OverviewSection id="pages-heading" title="Explore District Data">
          {/* Two across beside the schools; four across when there are no schools beside them */}
          <PageCards
            pages={pages}
            place={withSchools}
            id={district.id}
            descriptions={DISTRICT_PAGE_DESCRIPTIONS}
            unavailableLine={hasSchools ? 'Not available: no grade 12' : 'Not available: runs no schools'}
            label={`${title} pages`}
            wideColumns={hasSchools ? 2 : 4}
          />
        </OverviewSection>

        {hasSchools && (
          <OverviewSection id="schools-heading" title="Schools">
            <SchoolCards schools={schools} label={`Schools in ${title}`} />
          </OverviewSection>
        )}

        {/* Each tile: the figure and its year, the change since 2014-15 (green where the change is good,
            red where it's bad), a trend line, and the state's figure for the same year */}
        <OverviewSection id="key-figures-heading" title="Key District Figures" wide>
          {status === 'loading' && <KeyFiguresLoading groups={GROUPS} />}
          {status === 'failed' && <LoadErrorAlert message="This district's key figures could not be loaded." onRetry={retry} />}
          {status === 'ready' && <KeyFigures figures={figures} districtId={district.id} towns={towns} />}
        </OverviewSection>
      </OverviewGrid>
    </>
  );
};

/** The District page: its overview once the district's location data is loaded. */
const District: React.FC = () => {
  const district = useAppSelector(selectCurrentDistrict);
  const towns = useAppSelector(selectCurrentTowns);
  const schools = useAppSelector(selectCurrentSchools);
  const sau = useAppSelector(selectCurrentSau);
  const loading = useAppSelector(selectDistrictLoading);
  const error = useAppSelector(selectLocationError);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress aria-label="Loading the district" />
      </Box>
    );
  }
  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  if (!district || !sau) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning">No district information found.</Alert>
      </Box>
    );
  }
  return <DistrictOverview district={district} towns={towns} schools={schools} sauId={sau.id} />;
};

export default District;
