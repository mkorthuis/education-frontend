import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Box, CircularProgress, Link, Typography, useMediaQuery, useTheme } from '@mui/material';
import { GroupLabel, MetricTile, NavCard, NavCardGrid, Note, TileGroup } from '@/components/ds';
import LoadErrorAlert from '@/components/ui/LoadErrorAlert';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import { useAppSelector } from '@/store/hooks';
import {
  isCharterSchool,
  selectCurrentDistrict,
  selectCurrentSchool,
  selectCurrentSchools,
  selectCurrentTowns,
  selectLocationError,
} from '@/store/slices/locationSlice';
import { RootState } from '@/store/store';
import { formatGradesDisplay, schoolTown } from '@/utils/formatting';
import { districtTitle, DISTRICT_PAGE_DESCRIPTIONS } from '@/features/district/utils/labels';
import {
  isPageAvailable,
  KeyFiguresLoading,
  OverviewGrid,
  OverviewSection,
  OverviewTitle,
  PageCards,
  pagePath,
  PHONE_SPACING,
  SchoolCards,
} from '@/features/entity/overview/OverviewParts';
import { SchoolKeyFigures, useSchoolKeyFigures } from '../hooks/useSchoolKeyFigures';
import { schoolTileGroups } from '../utils/keyFigures';
import { CHARTER_LAW_URL, CHARTER_SCHOOL_LABEL, SCHOOL_PAGE_DESCRIPTIONS } from '../utils/labels';

// A school's overview, on the pattern of the district overview: its name, its district and grades,
// cards to its pages and to the district's other schools, and key figures with the district's and
// the state's beside them. A public charter school belongs to no district: it says what a charter
// school is instead, and compares its figures with the state's only.

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
  const groups = schoolTileGroups(figures, { compareDistrict, compareDistrictGraduation });
  if (groups.length === 0) {
    return <Typography variant="body1" sx={{ mb: 4 }}>This school has no figures to show yet.</Typography>;
  }
  return (
    <>
      {groups.map((group, index) => (
        <TileGroup key={index} title={group.title} sx={PHONE_SPACING.section}>
          {group.tiles.map(({ key, page, ...tile }) => <MetricTile key={key} {...tile} to={pagePath(SCHOOL_PAGES[page], schoolId)} />)}
        </TileGroup>
      ))}
    </>
  );
};

/**
 * The line under the title: the town the school is in, and from tablets up its district (a link to
 * it), grades and type. Phones show the town alone; the district is the back link above the title.
 * A charter school has no district: phones too say it's a charter school. Nothing when there's
 * nothing to show.
 */
const schoolFacts = (school: School, district: District, towns: Town[], phone: boolean): React.ReactNode => {
  const town = schoolTown(school, towns);
  const grades = formatGradesDisplay(school);
  const charter = isCharterSchool(school);
  const facts: React.ReactNode[] = [
    town && `Located in ${town}`,
    charter && CHARTER_SCHOOL_LABEL,
    !phone && !charter && district && <Link component={RouterLink} to={`/district/${district.id}`}>{districtTitle(district.name)}</Link>,
    !phone && grades && `Grades ${grades}`,
    !phone && !charter && school.school_type?.name,
  ].filter(Boolean);
  if (facts.length === 0) return undefined;
  return facts.map((fact, index) => <React.Fragment key={index}>{index > 0 && ' · '}{fact}</React.Fragment>);
};

/** What a charter school is and who can go, from the state's charter school law */
const CharterSchoolNote: React.FC = () => (
  <Box sx={PHONE_SPACING.section}>
    <Note title="About Charter Schools">
      Charter schools are free public schools run by their own boards, not by a school district. Any New Hampshire
      student can apply. Students who live in the district where the school is located get first preference, and a
      lottery decides when more students apply than there are seats. A student&apos;s home district stays responsible
      for special education.{' '}
      <Link href={CHARTER_LAW_URL} target="_blank" rel="noopener noreferrer">The state&apos;s charter school law (RSA 194-B)</Link>
    </Note>
  </Box>
);

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
  // A charter school's "district" is its own board, which may run other schools under the charter
  const charter = isCharterSchool(school);

  const pages = Object.values(SCHOOL_PAGES).filter(page => page.id !== SCHOOL_PAGES.overview.id);
  const hasGraduation = isPageAvailable(SCHOOL_PAGES.outcomes, school);
  // The district's figures are compared only where they aren't just this school's: its test scores
  // when it has other schools, its graduation when it has another high school. A charter school's
  // are compared with the state's alone.
  const compareDistrict = !charter && hasOthers;
  const compareDistrictGraduation = !charter && otherSchools.some(other => isPageAvailable(SCHOOL_PAGES.outcomes, other));
  const { status, retry, figures } = useSchoolKeyFigures(school.id, charter ? null : district?.id ?? null, { hasGraduation, compareDistrict, compareDistrictGraduation });

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
          {charter && <CharterSchoolNote />}
          {/* Spending, staffing and EFAs are reported for the whole district: cards to the district's
              pages for them, under their own label */}
          {district && !charter && (
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
          <OverviewSection id="schools-heading" title={charter ? 'Other Schools Under This Charter' : 'Other Schools in the District'}>
            <SchoolCards schools={otherSchools} label={charter ? `Other schools under ${district.name}'s charter` : `Other schools in ${districtTitle(district.name)}`} />
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
