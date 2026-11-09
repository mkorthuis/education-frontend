import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Box, CircularProgress, Link, Typography, useMediaQuery, useTheme } from '@mui/material';
import { GroupLabel, MetricTile, NavCard, NavCardGrid, TileGroup } from '@/components/ds';
import LoadErrorAlert from '@/components/ui/LoadErrorAlert';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import { useAppSelector } from '@/store/hooks';
import {
  selectCurrentDistrict,
  selectCurrentSchool,
  selectCurrentSchools,
  selectCurrentTowns,
  selectLocationError,
} from '@/store/slices/locationSlice';
import { RootState } from '@/store/store';
import { formatGradesDisplay, schoolTown } from '@/utils/formatting';
import { formatCount, formatPercent, latestPoint, tileChange, tileTrend } from '@/features/state/utils/stateMetrics';
import { formatThousands, shortYear, tileDelta } from '@/features/state/utils/phrases';
import { districtTitle, DISTRICT_PAGE_DESCRIPTIONS } from '@/features/district/utils/labels';
import {
  comparison,
  Comparison,
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
import { SchoolKeyFigures, useSchoolKeyFigures } from '../hooks/useSchoolKeyFigures';
import { SCHOOL_PAGE_DESCRIPTIONS } from '../utils/labels';

// A school's overview, on the pattern of the district overview: its name, its district and grades,
// cards to its pages and to the district's other schools, and key figures with the district's and
// the state's beside them.

const SCHOOL_PAGES = PAGE_REGISTRY.school;
// The district's pages with data reported for the whole district, not each school
const DISTRICT_WIDE_PAGES = ['financials', 'staff', 'efa'] as const;

// Whether the location data the page shows is loading: the school, its district, the district's
// schools and towns. Not every location request: the overview's test scores load the grade list,
// which would otherwise swap the page for a spinner mid-load.
const selectSchoolLoading = (state: RootState) => {
  const { school, district, schools, towns } = state.location.loadingStates;
  return school || district || schools || towns;
};

type School = NonNullable<ReturnType<typeof selectCurrentSchool>>;
type District = ReturnType<typeof selectCurrentDistrict>;
type Town = ReturnType<typeof selectCurrentTowns>[number];

interface KeyFiguresProps {
  figures: SchoolKeyFigures;
  schoolId: number;
  /** Whether the district has other schools, so its test scores differ from this school's */
  compareDistrict: boolean;
  /** Whether it has another high school, so its graduation figures differ from this school's */
  compareDistrictGraduation: boolean;
}

const KeyFigures: React.FC<KeyFiguresProps> = ({ figures, schoolId, compareDistrict, compareDistrictGraduation }) => {
  const to = (key: keyof typeof SCHOOL_PAGES) => pagePath(SCHOOL_PAGES[key], schoolId);
  // The district's figure, where it isn't just this school's, and the state's, for each result
  const others = (key: keyof SchoolKeyFigures['state']): Comparison[] => {
    const graduation = key === 'graduation' || key === 'college';
    return [
      ...((graduation ? compareDistrictGraduation : compareDistrict) ? [{ label: 'District', series: figures.district[key] }] : []),
      { label: 'Statewide', series: figures.state[key] },
    ];
  };
  // Those places' figures for the year, as note lines: "District 41%", "Statewide 44%"
  const compared = (key: keyof SchoolKeyFigures['state'], year: number, format: (value: number) => string) =>
    others(key).map(other => comparison(other.label, other.series, year, format));
  const latest = {
    students: latestPoint(figures.students),
    graduation: latestPoint(figures.graduation),
    college: latestPoint(figures.college),
  };
  const unknownPlans = latest.college ? plansUnknownNote(figures.plansUnknown, latest.college.year) : undefined;

  // Each tile only when the school has the figure
  const tiles = [
    latest.students && (
      <MetricTile
        key="students"
        label="Students"
        value={formatCount(latest.students.value)}
        // Phones shorten only large counts: 12K, not 0.3K
        shortValue={latest.students.value >= 10000 ? formatThousands(latest.students.value) : undefined}
        period={shortYear(latest.students.year)}
        delta={tileDelta(tileChange(figures.students), { unit: 'percent', higherIsBetter: true })}
        trend={tileTrend(figures.students)}
        to={to('enrollment')}
        linkLabel="enrollment"
      />
    ),
    subjectTile('Proficient in Math', figures.math, others('math'), to('academic')),
    subjectTile('Proficient in Reading', figures.reading, others('reading'), to('academic')),
    subjectTile('Proficient in Science', figures.science, others('science'), to('academic')),
    latest.graduation && (
      <MetricTile
        key="graduation"
        label="Four-Year Graduation Rate"
        shortLabel="Graduation Rate"
        value={formatPercent(latest.graduation.value, 1)}
        // By school year like the other tiles: the class of 2025 graduated in 24/25
        period={shortYear(latest.graduation.year)}
        delta={tileDelta(tileChange(figures.graduation), { unit: 'points', higherIsBetter: true })}
        detail={noteLines(...compared('graduation', latest.graduation.year, value => formatPercent(value, 1)))}
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
        delta={tileDelta(tileChange(figures.college), { unit: 'points', higherIsBetter: true })}
        detail={noteLines(...compared('college', latest.college.year, value => formatPercent(value)), unknownPlans?.full)}
        shortDetail={unknownPlans?.short}
        trend={tileTrend(figures.college)}
        to={to('outcomes')}
        linkLabel="graduates' plans"
      />
    ),
  ].filter(Boolean);

  if (tiles.length === 0) {
    return <Typography variant="body1" sx={{ mb: 4 }}>This school has no figures to show yet.</Typography>;
  }
  return <TileGroup sx={PHONE_SPACING.section}>{tiles}</TileGroup>;
};

/**
 * The line under the title: the town the school is in, and from tablets up its district (a link to
 * it), grades and type. Phones show the town alone; the district is the back link above the title.
 * Nothing when there's nothing to show.
 */
const schoolFacts = (school: School, district: District, towns: Town[], phone: boolean): React.ReactNode => {
  const town = schoolTown(school, towns);
  const grades = formatGradesDisplay(school);
  const facts: React.ReactNode[] = [
    town && `Located in ${town}`,
    !phone && district && <Link component={RouterLink} to={`/district/${district.id}`}>{districtTitle(district.name)}</Link>,
    !phone && grades && `Grades ${grades}`,
    !phone && school.school_type?.name,
  ].filter(Boolean);
  if (facts.length === 0) return undefined;
  return facts.map((fact, index) => <React.Fragment key={index}>{index > 0 && ' · '}{fact}</React.Fragment>);
};

interface SchoolOverviewProps {
  school: School;
  district: District;
  schools: ReturnType<typeof selectCurrentSchools>;
  towns: Town[];
}

const SchoolOverview: React.FC<SchoolOverviewProps> = ({ school, district, schools, towns }) => {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const otherSchools = schools.filter(other => other.id !== school.id);
  const hasOthers = otherSchools.length > 0;

  const pages = Object.values(SCHOOL_PAGES).filter(page => page.id !== SCHOOL_PAGES.overview.id);
  const hasGraduation = isPageAvailable(SCHOOL_PAGES.outcomes, school);
  // The district's figures are compared only where they aren't just this school's: its test scores
  // when it has other schools, its graduation when it has another high school
  const compareDistrict = hasOthers;
  const compareDistrictGraduation = otherSchools.some(other => isPageAvailable(SCHOOL_PAGES.outcomes, other));
  const { status, retry, figures } = useSchoolKeyFigures(school.id, district?.id ?? null, { hasGraduation, compareDistrict, compareDistrictGraduation });

  return (
    <>
      <OverviewTitle title={school.name} facts={schoolFacts(school, district, towns, isPhone)} />
      <OverviewGrid twoColumns={hasOthers}>
        <OverviewSection id="pages-heading" title="Explore School Data">
          {/* Two across beside the other schools; four across when there are none beside them */}
          <PageCards
            pages={pages}
            place={school}
            id={school.id}
            descriptions={SCHOOL_PAGE_DESCRIPTIONS}
            unavailableLine="Not available: no grade 12"
            label={`${school.name} pages`}
            wideColumns={hasOthers ? 2 : 4}
          />
          {/* Spending, staffing and EFAs are reported for the whole district: cards to the district's
              pages for them, under their own label */}
          {district && (
            <>
              <GroupLabel>District-Wide Data</GroupLabel>
              <NavCardGrid label={`${districtTitle(district.name)} data for the whole district`} wideColumns={hasOthers ? 2 : 4} sx={PHONE_SPACING.section}>
                {DISTRICT_WIDE_PAGES.map(key => {
                  const page = PAGE_REGISTRY.district[key];
                  return <NavCard key={page.id} component="h4" title={page.displayName} description={DISTRICT_PAGE_DESCRIPTIONS[key]} to={pagePath(page, district.id)} />;
                })}
              </NavCardGrid>
            </>
          )}
        </OverviewSection>

        {hasOthers && district && (
          <OverviewSection id="schools-heading" title="Other Schools in the District">
            <SchoolCards schools={otherSchools} label={`Other schools in ${districtTitle(district.name)}`} />
          </OverviewSection>
        )}

        {/* Each tile: the figure and its year, the change since 2014-15 (green where the change is good,
            red where it's bad), a trend line, and the district's and state's figures for the same year */}
        <OverviewSection id="key-figures-heading" title="Key School Figures" wide>
          {status === 'loading' && <KeyFiguresLoading groups={[undefined]} />}
          {status === 'failed' && <LoadErrorAlert message="This school's key figures could not be loaded." onRetry={retry} />}
          {status === 'ready' && (
            <KeyFigures figures={figures} schoolId={school.id} compareDistrict={compareDistrict} compareDistrictGraduation={compareDistrictGraduation} />
          )}
        </OverviewSection>
      </OverviewGrid>
    </>
  );
};

/** The School page: its overview once the school's location data is loaded. */
const School: React.FC = () => {
  const school = useAppSelector(selectCurrentSchool);
  const towns = useAppSelector(selectCurrentTowns);
  const district = useAppSelector(selectCurrentDistrict);
  const schools = useAppSelector(selectCurrentSchools);
  const loading = useAppSelector(selectSchoolLoading);
  const error = useAppSelector(selectLocationError);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress aria-label="Loading the school" />
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
  if (!school) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning">No school information found.</Alert>
      </Box>
    );
  }
  return <SchoolOverview school={school} district={district} schools={schools} towns={towns} />;
};

export default School;
