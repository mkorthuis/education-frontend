import React from 'react';
import { Alert, Box, CircularProgress, GlobalStyles, Skeleton, Typography, useMediaQuery, useTheme } from '@mui/material';
import { MetricTile, NavCard, NavCardGrid, SectionHeading, TileGroup, visuallyHidden } from '@/components/ds';
import SectionTitle from '@/components/ui/SectionTitle';
import LoadErrorAlert from '@/components/ui/LoadErrorAlert';
import { PAGE_REGISTRY, PageEntry } from '@/routes/pageRegistry';
import { useAppSelector } from '@/store/hooks';
import {
  selectCurrentDistrict,
  selectCurrentTowns,
  selectCurrentSchools,
  selectCurrentSau,
  selectLocationError,
} from '@/store/slices/locationSlice';
import { RootState } from '@/store/store';
import { radius } from '@/theme/tokens';
import { formatGradesDisplay } from '@/utils/formatting';
import {
  Change,
  describeChange,
  formatCount,
  formatDollars,
  formatPercent,
  latestPoint,
  tileChange,
  tileTrend,
  valueIn,
  YearValue,
} from '@/features/state/utils/stateMetrics';
import { capitalize, formatThousands, realPercentChange, shortYear, tileDelta } from '@/features/state/utils/phrases';
import { DistrictKeyFigures, SubjectFigures, useDistrictKeyFigures } from '../hooks/useDistrictKeyFigures';
import { districtFacts, districtPhoneTitle, districtTitle, DISTRICT_PAGE_DESCRIPTIONS } from '../utils/labels';

// A district's overview, on the pattern of the statewide overview: its name and what it is, cards to
// its pages and its schools, and key figures with the state's beside them.

const DISTRICT_PAGES = PAGE_REGISTRY.district;

// Phones: tighter than the shared components' spacing, so more of the page fits on a screen
const PHONE_SPACING = {
  heading: { mt: { xs: 0.5, sm: 2 }, mb: { xs: 1.5, sm: 2 } },
  section: { mb: { xs: 2.5, sm: 4 } },
};

// From this share of graduates with unknown plans (6% statewide in 2025), the college tile says so:
// the share planning college counts them among all graduates
const PLANS_UNKNOWN_NOTE = 10;

// Whether the district's own location data is loading. Not every location request: the overview's
// test scores load the grade list, which would otherwise swap the page for a spinner mid-load.
const selectDistrictLoading = (state: RootState) => {
  const { district, schools, towns, sau } = state.location.loadingStates;
  return district || schools || towns || sau;
};

type District = NonNullable<ReturnType<typeof selectCurrentDistrict>>;
type School = ReturnType<typeof selectCurrentSchools>[number];
type Town = ReturnType<typeof selectCurrentTowns>[number];

/** A page's address for this district, without its optional parts: /district/111/academic */
const pagePath = (page: PageEntry, districtId: number) =>
  page.urlPatterns[0].replace(':id', String(districtId)).replace(/(\/:[^/]+\?)+$/, '');

const pageKey = (page: PageEntry) => page.id.split('.')[1];

/** The state's figure for the district's year, for a tile's grey note */
const statewide = (series: YearValue[], year: number, format: (value: number) => string) => {
  const value = valueIn(series, year);
  return value === null ? undefined : `Statewide ${format(value)}`;
};

/** A tile's note, one fact a line: "Statewide $22,699", "Up 31% after inflation" */
const noteLines = (...lines: (string | undefined)[]) => {
  const kept = lines.filter((line): line is string => Boolean(line));
  return kept.length ? kept : undefined;
};

/** A dollar tile's note: the state's figure and, as on the statewide tiles, the change after inflation */
const dollarNote = (state: string | undefined, change: Change | null) =>
  noteLines(state, change ? `${capitalize(describeChange(realPercentChange(change)))} after inflation` : undefined);

/** Lowest grade first, so the schools run from elementary to high school */
const firstGrade = (school: School) => Math.min(...(school.grades ?? []).map(grade => grade.id), Number.MAX_SAFE_INTEGER);

const subjectTile = (label: string, subject: SubjectFigures, stateSeries: YearValue[], to: string) => {
  const latest = latestPoint(subject.drawn);
  if (!latest) return null;
  // Where the state reports only "<10%" or ">90%", the tile says so and shows no change
  const bound = subject.bounds.get(latest.year);
  return (
    <MetricTile
      key={label}
      label={label}
      value={bound ?? formatPercent(latest.value)}
      period={shortYear(latest.year)}
      delta={bound ? undefined : tileDelta(tileChange(subject.exact), { unit: 'points', higherIsBetter: true })}
      detail={statewide(stateSeries, latest.year, value => formatPercent(value))}
      trend={subject.drawn}
      to={to}
      linkLabel="test scores"
    />
  );
};

/** Grey tiles where the figures will be, so the page doesn't jump when they arrive */
const KeyFiguresLoading: React.FC = () => (
  <Box aria-busy="true">
    <Box component="span" sx={visuallyHidden}>Loading key figures</Box>
    {['Students and Spending', 'Results'].map(group => (
      <TileGroup key={group} title={group} sx={PHONE_SPACING.section}>
        {[0, 1, 2, 3].map(tile => <Skeleton key={tile} variant="rounded" animation="wave" sx={{ height: { xs: 112, sm: 160 }, borderRadius: radius.card }} />)}
      </TileGroup>
    ))}
  </Box>
);

const KeyFigures: React.FC<{ figures: DistrictKeyFigures; districtId: number; towns: Town[] }> = ({ figures, districtId, towns }) => {
  const to = (key: keyof typeof DISTRICT_PAGES) => pagePath(DISTRICT_PAGES[key], districtId);
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
  const plansUnknown = latest.college ? valueIn(figures.plansUnknown, latest.college.year) : null;
  const unknownNote = plansUnknown !== null && plansUnknown >= PLANS_UNKNOWN_NOTE ? `Plans unknown for ${formatPercent(plansUnknown)}` : undefined;
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
    subjectTile('Proficient in Math', figures.math, figures.state.math, to('academic')),
    subjectTile('Proficient in Reading', figures.reading, figures.state.reading, to('academic')),
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
        detail={noteLines(statewide(figures.state.college, latest.college.year, value => formatPercent(value)), unknownNote)}
        shortDetail={unknownNote ? `${formatPercent(plansUnknown)} unknown` : undefined}
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
      {studentsAndSpending.length > 0 && <TileGroup title="Students and Spending" sx={PHONE_SPACING.section}>{studentsAndSpending}</TileGroup>}
      {results.length > 0 && <TileGroup title="Results" sx={PHONE_SPACING.section}>{results}</TileGroup>}
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

  // The district's pages, as its tabs show them: a page it has no data for (no schools, or no high
  // school) is greyed out, with the tab's reason as its tooltip
  const withSchools = { ...district, schools };
  const pages = Object.values(DISTRICT_PAGES).filter(page => page.id !== DISTRICT_PAGES.overview.id);
  const isAvailable = (page: PageEntry) => (typeof page.enabled === 'function' ? page.enabled(withSchools) : page.enabled);
  const reasonFor = (page: PageEntry) => (typeof page.tooltip === 'function' ? page.tooltip(withSchools) : page.tooltip) || undefined;
  // In place of a greyed card's description, so the reason shows without hovering (phones can't)
  const unavailableLine = hasSchools ? 'Not available: no grade 12' : 'Not available: runs no schools';
  const hasGraduation = isAvailable(DISTRICT_PAGES.outcomes);

  const { status, retry, figures } = useDistrictKeyFigures(district.id, { hasSchools, hasGraduation });

  return (
    <>
      {/* Keeps keyboard focus and in-page jumps clear of the fixed header and section tabs */}
      <GlobalStyles styles={{ html: { scrollPaddingTop: 128 } }} />
      <SectionTitle
        displayName={isPhone ? districtPhoneTitle(district.name, sauId) : title}
        entityName=""
        component="h1"
        showEntityOnPhone={false}
        // The towns line sits right under the title, on phones too
        sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, mb: 0.5 }}
      />
      {facts.length > 0 && (
        <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, mb: { xs: 2, sm: 3 } }}>{facts.join(' · ')}</Typography>
      )}

      {/* Wide screens: the page links on the left and the schools on the right, then the key figures
          across the page. Phones and tablets stack them in the same order. */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: hasSchools ? 'repeat(2, minmax(0, 1fr))' : 'minmax(0, 1fr)' },
          columnGap: 4,
          alignItems: 'start',
        }}
      >
        <Box component="section" aria-labelledby="pages-heading" sx={{ minWidth: 0 }}>
          <SectionHeading sx={PHONE_SPACING.heading} id="pages-heading">Explore District Data</SectionHeading>
          {/* Two across beside the schools; four across when there are no schools beside them */}
          <NavCardGrid label={`${title} pages`} wideColumns={hasSchools ? 2 : 4} sx={PHONE_SPACING.section}>
            {pages.map(page => {
              const available = isAvailable(page);
              return (
                <NavCard
                  key={page.id}
                  title={page.displayName}
                  description={available ? DISTRICT_PAGE_DESCRIPTIONS[pageKey(page)] : unavailableLine}
                  to={pagePath(page, district.id)}
                  disabled={!available}
                  disabledReason={available ? undefined : reasonFor(page)}
                />
              );
            })}
          </NavCardGrid>
        </Box>

        {hasSchools && (
          <Box component="section" aria-labelledby="schools-heading" sx={{ minWidth: 0 }}>
            <SectionHeading sx={PHONE_SPACING.heading} id="schools-heading">Schools</SectionHeading>
            {/* Cards the height of the page links beside them: the name at the left (wrapping if long),
                its grades at the right; youngest grades first */}
            <NavCardGrid label={`Schools in ${title}`} wideColumns={2} sx={PHONE_SPACING.section}>
              {[...schools]
                .sort((a, b) => firstGrade(a) - firstGrade(b) || a.name.localeCompare(b.name))
                .map(school => {
                  const grades = formatGradesDisplay(school);
                  return <NavCard key={school.id} inline title={school.name} description={grades || undefined} to={`/school/${school.id}`} />;
                })}
            </NavCardGrid>
          </Box>
        )}

        {/* Each tile: the figure and its year, the change since 2014-15 (green where the change is good,
            red where it's bad), a trend line, and the state's figure for the same year */}
        <Box component="section" aria-labelledby="key-figures-heading" sx={{ gridColumn: '1 / -1', minWidth: 0 }}>
          <SectionHeading sx={PHONE_SPACING.heading} id="key-figures-heading">Key District Figures</SectionHeading>
          {status === 'loading' && <KeyFiguresLoading />}
          {status === 'failed' && <LoadErrorAlert message="This district's key figures could not be loaded." onRetry={retry} />}
          {status === 'ready' && <KeyFigures figures={figures} districtId={district.id} towns={towns} />}
        </Box>
      </Box>
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
