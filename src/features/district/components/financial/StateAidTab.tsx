import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Divider } from '@mui/material';
import { useAppSelector } from '@/store/hooks';
import { selectAdjustForInflation, selectFinancialReports } from '@/store/slices/financeSlice';
import { Note } from '@/components/ds';
import ChartSelect from '@/features/state/components/ChartSelect';
import { ChartHeader } from '@/features/state/components/chartText';
import { formatSchoolYear } from '@/features/state/utils/stateMetrics';
import { shortYear } from '@/features/state/utils/phrases';
import { FISCAL_YEAR } from '@/utils/environment';
import { projectInflation } from '@/utils/calculations';
import { DistrictStateAid, residentStudents, restateRow, stateAidRows } from '../../utils/stateAid';
import StateAidSummary from './StateAidSummary';
import AdequacyAidSection from './AdequacyAidSection';
import AidChangeSection from './AidChangeSection';
import SpecialEducationAidCalculation from './SpecialEducationAidCalculation';
import OtherStateAid from './OtherStateAid';
import StateAidChart from './StateAidChart';

// The State Aid tab tells it in order: how much the state provided in the year (all the state revenue in the
// district's financial report, in four parts) and every year's trend beside it; then how the adequacy aid is
// figured, as one equation in its own numbers (what an adequate education costs, plus the cushions, less the
// property tax the town raises and keeps, is the grant); why the grant changed since last year; who paid for
// its high-cost students' special education; and the other aid, a line each. The DOE's full calculations are
// folded under each part. The year is in the URL (?year=2025), so the Revenues tab can link to the year it
// shows; without one, the fiscal year the site shows (or the latest, if it has no aid that year). With Adjust
// For Inflation, the years' chart is in the site's fiscal year's dollars; the year's own figures stay as the
// DOE and the district reported them.

// The site's fiscal year, whose dollars the years' chart is in with Adjust For Inflation
const DOLLARS_YEAR = parseInt(FISCAL_YEAR);

interface StateAidTabProps {
  districtName: string;
  aid: DistrictStateAid;
}

const StateAidTab: React.FC<StateAidTabProps> = ({ districtName, aid }) => {
  const adjustForInflation = useAppSelector(selectAdjustForInflation);
  const reports = useAppSelector(selectFinancialReports);
  const [searchParams, setSearchParams] = useSearchParams();

  const latest = aid.years[aid.years.length - 1];
  const fallback = aid.years.find(entry => entry.fiscal_year === DOLLARS_YEAR) ?? latest;
  const asked = Number(searchParams.get('year'));
  const year = aid.years.find(entry => entry.fiscal_year === asked) ?? fallback;
  const chooseYear = (fiscalYear: number) => {
    const params = new URLSearchParams(searchParams);
    if (fiscalYear === fallback?.fiscal_year) params.delete('year');
    else params.set('year', String(fiscalYear));
    setSearchParams(params, { replace: true });
  };

  const rows = useMemo(() => stateAidRows(aid, reports), [aid, reports]);
  const students = useMemo(() => residentStudents(aid.years), [aid.years]);
  // The years' chart, with Adjust For Inflation, in the site's fiscal year's dollars
  const chartRows = useMemo(
    () => (adjustForInflation ? rows.map(entry => restateRow(entry, projectInflation(1, entry.year, DOLLARS_YEAR))) : rows),
    [adjustForInflation, rows],
  );

  if (aid.status === 'loading') {
    return <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress aria-label="Loading state aid" /></Box>;
  }
  const row = rows.find(entry => entry.year === year?.fiscal_year);
  if (aid.status === 'unavailable' || !year || !row) {
    return <Note title="State Aid Isn't Available">The state aid calculation couldn't be loaded. Please try again later.</Note>;
  }

  const previousReport = reports[year.fiscal_year - 1];

  // Wide screens, two columns: the years' chart on the left, in view as the right scrolls (below the fixed app
  // bar and section tabs), and the year's aid and how it's figured on the right. Narrower, one column: the
  // chart, the year's aid, then how it's figured.
  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 2fr) minmax(0, 3fr)' },
      gridTemplateAreas: { xs: '"chart" "summary" "details"', lg: '"chart summary" "chart details"' },
      gridTemplateRows: { lg: 'auto 1fr' },
      columnGap: 5,
      // On phones, tighter around the dividers
      rowGap: { xs: 2, sm: 4 },
    }}>
      <Box component="section" aria-labelledby="state-aid-title" sx={{ gridArea: 'summary' }}>
        {/* Bold, as the sections below are titled, with the year's picker beside it */}
        <ChartHeader
          titleId="state-aid-title"
          title={`State Aid in ${shortYear(year.fiscal_year)}`}
          actions={(
            <ChartSelect
              label="School year"
              value={year.fiscal_year}
              options={[...aid.years].reverse().map(entry => ({ value: entry.fiscal_year, label: shortYear(entry.fiscal_year) }))}
              onChange={chooseYear}
            />
          )}
        />
        <StateAidSummary districtName={districtName} row={row} students={students?.get(year.fiscal_year) ?? null} />
      </Box>

      <Box sx={{ gridArea: 'chart', alignSelf: 'start', position: { lg: 'sticky' }, top: { lg: 120 } }}>
        <StateAidChart rows={chartRows} inCurrentDollars={adjustForInflation} students={students} selectedYear={year.fiscal_year} />
        <Divider sx={{ display: { lg: 'none' }, mt: { xs: 2, sm: 4 } }} />
      </Box>

      <Box sx={{
        gridArea: 'details',
        display: 'flex',
        flexDirection: 'column',
        gap: { xs: 2, sm: 4 },
        // On phones, sections with no divider between them keep their room
        '& > section + section': { mt: { xs: 2, sm: 0 } },
      }}>
        <Divider />
        <AdequacyAidSection districtName={districtName} year={year} formula={aid.formulas[year.fiscal_year]} />
        <AidChangeSection districtName={districtName} years={aid.years} year={year} formulas={aid.formulas} />

        <Divider />
        <SpecialEducationAidCalculation
          districtName={districtName}
          schoolYear={year.school_year}
          row={row}
          aidYear={aid.spedYears.find(entry => entry.fiscal_year === year.fiscal_year)}
          district={aid.sped.find(entry => entry.fiscal_year === year.fiscal_year)}
          firstYear={aid.spedYears[0]?.fiscal_year}
        />

        <Divider />
        <OtherStateAid
          districtName={districtName}
          schoolYear={year.school_year}
          row={row}
          report={reports[year.fiscal_year]}
          previous={previousReport ? { report: previousReport, schoolYear: formatSchoolYear(year.fiscal_year - 1) } : null}
        />
      </Box>
    </Box>
  );
};

export default StateAidTab;
