import React, { useMemo } from 'react';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import { MetricTile, NavCard, NavCardGrid, SectionHeading, TileGroup, TileGroupPair } from '@/components/ds';
import type { TileModel } from '@/features/entity/overview/tileModels';
import StatePage from '../components/StatePage';
import { useStateLoads } from '../hooks/useStateLoads';
import { useSchoolCounts } from '../hooks/useSchoolCounts';
import {
  useStateAssessmentData,
  useStateEfaData,
  useStateEnrollmentByTypeData,
  useStateEnrollmentData,
  useStateFinanceData,
  useStateOutcomeData,
  useStateStaffData,
} from '../hooks/useStatewideData';
import { stateKeyFigures, stateTileGroups } from '../utils/keyFigures';
import { STATE_PAGE_DESCRIPTIONS } from '../utils/labels';


const STATE_PAGES = PAGE_REGISTRY.state;

const StateOverview: React.FC = () => {
  const enrollment = useStateEnrollmentData();
  const finance = useStateFinanceData();
  const staff = useStateStaffData();
  const outcomes = useStateOutcomeData();
  const assessment = useStateAssessmentData();
  const efa = useStateEfaData();
  const publicEnrollment = useStateEnrollmentByTypeData();
  // How many districts and schools, by year; their tiles appear once the counts load
  const schoolCounts = useSchoolCounts();

  const { status, retry } = useStateLoads([
    ...enrollment.loads,
    ...finance.loads,
    ...staff.loads,
    ...outcomes.loads,
    ...assessment.loads,
    ...efa.loads,
    ...publicEnrollment.loads,
  ]);

  const figures = useMemo(() => stateKeyFigures({
    enrollmentByType: publicEnrollment.byType,
    perPupil: finance.perPupil,
    rollups: finance.rollups,
    staff: staff.staff,
    salary: staff.salary,
    assessments: assessment.assessments,
    cohorts: outcomes.cohorts,
    plans: outcomes.postGraduation,
    efaEntries: efa.entries,
    efaEntryTypes: efa.entryTypes,
    schoolCounts,
  }), [publicEnrollment.byType, finance.perPupil, finance.rollups, staff.staff, staff.salary, assessment.assessments, outcomes.cohorts, outcomes.postGraduation, efa.entries, efa.entryTypes, schoolCounts]);
  const [schools, financials, results] = stateTileGroups(figures);
  // A tile links to its statewide page, or to the list of districts or schools
  const tile = ({ key, page, ...props }: TileModel) => (
    <MetricTile key={key} {...props} to={(STATE_PAGES[page] ?? PAGE_REGISTRY.general[page]).urlPatterns[0]} />
  );

  return (
    <StatePage
      displayName={STATE_PAGES.overview.displayName}
      entityName=""
      status={status}
      onRetry={retry}
      errorMessage="Statewide data could not be loaded."
      // The page link cards below go to the same pages as the phone section links
    >
      {/* Links to each statewide page first; the page title already says "Explore Statewide Data" */}
      <NavCardGrid>
        {Object.values(STATE_PAGES)
          .filter(page => page.id !== STATE_PAGES.overview.id)
          .map(page => (
            <NavCard key={page.id} title={page.displayName} description={STATE_PAGE_DESCRIPTIONS[page.id.split('.')[1]]} to={page.urlPatterns[0]} />
          ))}
      </NavCardGrid>


      {/* Each tile: the figure and its year, the change since the comparison year (green where the
          change is good, red where it's bad: rises in spending and cost per student are red, rises
          in everything else green), and a trend line. Only the dollar tiles (after inflation) and
          the district and school counts carry a grey note. */}
      <SectionHeading>Key Statewide Figures</SectionHeading>

      {/* Where four tiles fit across, Schools and Financials sit side by side, each 2 x 2 */}
      <TileGroupPair>
        <TileGroup title={schools.title} half>{schools.tiles.map(tile)}</TileGroup>
        <TileGroup title={financials.title} half>{financials.tiles.map(tile)}</TileGroup>
      </TileGroupPair>

      <TileGroup title={results.title}>{results.tiles.map(tile)}</TileGroup>
    </StatePage>
  );
};

export default StateOverview;
