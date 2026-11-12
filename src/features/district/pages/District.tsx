import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Box, CircularProgress, Link, Typography, useMediaQuery, useTheme } from '@mui/material';
import { GroupLabel, MetricTile, TileGroup } from '@/components/ds';
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
import { useCharterSchoolsIn } from '../hooks/useCharterSchoolsIn';
import { DistrictKeyFigures, useDistrictKeyFigures } from '../hooks/useDistrictKeyFigures';
import { DISTRICT_TILE_GROUPS, districtTileGroups } from '../utils/keyFigures';
import { districtFacts, districtPhoneTitle, districtTitle, DISTRICT_PAGE_DESCRIPTIONS, listNames } from '../utils/labels';

// A district's overview, on the pattern of the statewide overview: its name and what it is, cards to
// its pages and its schools (and any public charter schools in its towns), and key figures with the
// state's beside them.

const DISTRICT_PAGES = PAGE_REGISTRY.district;
const GROUPS = DISTRICT_TILE_GROUPS;

// Whether the district's own location data is loading. Not every location request: the overview's
// test scores load the grade list, which would otherwise swap the page for a spinner mid-load.
const selectDistrictLoading = (state: RootState) => {
  const { district, schools, towns, sau } = state.location.loadingStates;
  return district || schools || towns || sau;
};

type District = NonNullable<ReturnType<typeof selectCurrentDistrict>>;
type School = ReturnType<typeof selectCurrentSchools>[number];
type Town = ReturnType<typeof selectCurrentTowns>[number];

const KeyFigures: React.FC<{ figures: DistrictKeyFigures; districtId: number; towns: Town[] }> = ({ figures, districtId, towns }) => {
  const groups = districtTileGroups(figures, towns);
  if (groups.length === 0) {
    return <Typography variant="body1" sx={{ mb: 4 }}>This district has no figures to show yet.</Typography>;
  }
  return (
    <>
      {groups.map(group => (
        <TileGroup key={group.title} title={group.title} sx={PHONE_SPACING.section}>
          {group.tiles.map(({ key, page, ...tile }) => <MetricTile key={key} {...tile} to={pagePath(DISTRICT_PAGES[page], districtId)} />)}
        </TileGroup>
      ))}
    </>
  );
};

/**
 * The public charter schools in the district's towns, after its own schools: not the district's, so
 * under their own label, saying whose they are, with a link to every charter school.
 */
const CharterSchools: React.FC<{ schools: School[]; towns: Town[] }> = ({ schools, towns }) => {
  const places = listNames(towns.filter(town => schools.some(school => school.town_id === town.id)).map(town => town.name));
  return (
    <>
      <GroupLabel>Public Charter Schools in {places}</GroupLabel>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Free public schools run by their own boards, not by the district. Any New Hampshire student can apply.{' '}
        <Link component={RouterLink} to="/schools?type=charter">All charter schools</Link>
      </Typography>
      <SchoolCards schools={schools} label={`Public charter schools in ${places}`} />
    </>
  );
};

const DistrictOverview: React.FC<{ district: District; towns: Town[]; schools: School[]; sauId: number }> = ({ district, towns, schools, sauId }) => {
  const title = districtTitle(district.name);
  const hasSchools = schools.length > 0;
  const charters = useCharterSchoolsIn(towns);
  // The schools column: the district's schools, the charter schools in its towns, or both
  const showSchools = hasSchools || charters.length > 0;
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
      <OverviewGrid twoColumns={showSchools}>
        <OverviewSection id="pages-heading" title="Explore District Data">
          {/* Two across beside the schools; four across when there are no schools beside them */}
          <PageCards
            pages={pages}
            place={withSchools}
            id={district.id}
            descriptions={DISTRICT_PAGE_DESCRIPTIONS}
            unavailableLine={hasSchools ? 'Not available: no grade 12' : 'Not available: runs no schools'}
            label={`${title} pages`}
            wideColumns={showSchools ? 2 : 4}
          />
        </OverviewSection>

        {showSchools && (
          <OverviewSection id="schools-heading" title="Schools">
            {hasSchools && <SchoolCards schools={schools} label={`Schools in ${title}`} />}
            {charters.length > 0 && <CharterSchools schools={charters} towns={towns} />}
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
