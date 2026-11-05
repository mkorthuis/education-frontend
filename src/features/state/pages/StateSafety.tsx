import React, { useMemo } from 'react';
import { Box, Divider } from '@mui/material';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import StatePage from '../components/StatePage';
import StateTable from '../components/StateTable';
import TrendChart from '../components/TrendChart';
import KeyFigures, { KeyFigure } from '../components/KeyFigures';
import { useStateLoads } from '../hooks/useStateLoads';
import { useStateSafetyData } from '../hooks/useStatewideData';
import {
  changeSince,
  formatCompact,
  formatCount,
  formatPercent,
  formatSchoolYear,
  latestPoint,
  mergeSeries,
  REMOTE_SCHOOL_YEAR,
  shareOfEnrollment,
  toSeries,
} from '../utils/stateMetrics';
import { INCIDENT_LABELS, plainLabel } from '../utils/labels';
import { shortYear, tileDelta } from '../utils/phrases';

const PAGE = PAGE_REGISTRY.state.safety;
const TREND_YEARS = 10;
const INCIDENT_YEARS = 5;
// A year-over-year jump this large gets a note, since the state's data doesn't explain it
const JUMP_RATIO = 1.8;
const REMOTE_BAND = [{ from: REMOTE_SCHOOL_YEAR - 1, to: REMOTE_SCHOOL_YEAR, label: 'COVID' }];
const COVID_NOTE = 'The shaded years include 2020-21, when many schools were remote or hybrid.';

type IncidentRow = { type: string; section: string; total: number } & Record<string, number | string>;

const StateSafety: React.FC = () => {
  const { loads, truancy, bullying, incidents, restraints, seclusions, enrollment } = useStateSafetyData();
  const { status, retry } = useStateLoads(loads);

  const truancyRows = useMemo(() => {
    const counts = toSeries(truancy, row => row.count);
    return mergeSeries({ share: shareOfEnrollment(counts, toSeries(enrollment, row => row.total_enrollment)), students: counts });
  }, [truancy, enrollment]);

  // Counts with a rate per 1,000 students alongside, so years and districts of different sizes compare
  const enrolled = useMemo(() => toSeries(enrollment, row => row.total_enrollment), [enrollment]);
  const per1000 = (counts: ReturnType<typeof toSeries>) =>
    shareOfEnrollment(counts, enrolled).map(point => ({ year: point.year, value: point.value * 10 }));

  const bullyingRows = useMemo(() => {
    const anyKind = bullying.filter(row => row.bullying_type.name === 'Bullying (of any kind)');
    const reported = toSeries(anyKind, row => row.reported);
    return mergeSeries({
      reported,
      confirmed: toSeries(anyKind, row => row.investigated_actual),
      reportedPer1000: per1000(reported),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bullying, enrolled]);

  const restraintRows = useMemo(() => {
    const restraintCounts = toSeries(restraints, row => row.generated);
    const seclusionCounts = toSeries(seclusions, row => row.generated);
    return mergeSeries({
      restraints: restraintCounts,
      seclusions: seclusionCounts,
      restraintsPer1000: per1000(restraintCounts),
      seclusionsPer1000: per1000(seclusionCounts),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restraints, seclusions, enrolled]);

  // Years where seclusions or restraints more than JUMP_RATIO times the year before
  const jumpNote = useMemo(() => {
    const jumps = (['restraints', 'seclusions'] as const).flatMap(key => restraintRows.slice(1).flatMap((row, index) => {
      const before = restraintRows[index][key];
      const after = row[key];
      return typeof before === 'number' && typeof after === 'number' && before > 0 && after / before >= JUMP_RATIO
        ? [`${key === 'restraints' ? 'Restraints' : 'Seclusions'} rose from ${formatCount(before)} in ${formatSchoolYear(restraintRows[index].year)} to ${formatCount(after)} in ${formatSchoolYear(row.year)}`]
        : [];
    })).filter(text => !text.includes(formatSchoolYear(REMOTE_SCHOOL_YEAR + 1)));
    return jumps.length ? `${jumps.join('; ')}; the state's data doesn't say why.` : '';
  }, [restraintRows]);

  // Serious incidents: one row per type, the last five years and a ten-year total
  const incidentTable = useMemo(() => {
    const allYears = [...new Set(incidents.map(row => row.year))].sort((a, b) => b - a);
    const years = allYears.slice(0, INCIDENT_YEARS);
    const totalYears = allYears.slice(0, TREND_YEARS);
    const types = [...new Set(incidents.map(row => row.safety_type.name))];
    const rows: IncidentRow[] = types.map(type => {
      const label = plainLabel(INCIDENT_LABELS, type);
      const count = (year: number) => incidents.filter(row => row.safety_type.name === type && row.year === year).reduce((sum, row) => sum + row.count, 0);
      const row: IncidentRow = {
        type: label,
        section: label.startsWith('Firearm') ? 'Firearms' : 'Other serious incidents',
        total: totalYears.reduce((sum, year) => sum + count(year), 0),
      };
      years.forEach(year => { row[String(year)] = count(year); });
      return row;
    });
    rows.sort((a, b) => (a.section === b.section ? b.total - a.total : a.section === 'Firearms' ? -1 : 1));
    return { years, totalYears, rows };
  }, [incidents]);

  const keyFigures = useMemo(() => {
    const share = toSeries(truancyRows, row => row.share);
    const latestShare = latestPoint(share);
    const latestBullying = bullyingRows[bullyingRows.length - 1];
    const latestRestraints = restraintRows[restraintRows.length - 1];
    const figures: KeyFigure[] = [];
    const takeaway: string[] = [];
    if (latestShare) {
      const change = changeSince(share, TREND_YEARS);
      figures.push({
        label: 'Students Who Were Truant',
        shortLabel: 'Truant',
        value: formatPercent(latestShare.value, 1),
        period: shortYear(latestShare.year),
        delta: tileDelta(change, { unit: 'points', higherIsBetter: false }),
      });
      const count = truancyRows.find(row => row.year === latestShare.year)?.students;
      takeaway.push(`In ${formatSchoolYear(latestShare.year)}, ${formatCount(count)} students (${formatPercent(latestShare.value, 1)}) had 10 or more half-days of unexcused absence.`);
    }
    if (latestBullying && typeof latestBullying.reported === 'number') {
      figures.push({
        label: 'Bullying Reports',
        value: formatCount(latestBullying.reported),
        period: shortYear(latestBullying.year),
        detail: [
          typeof latestBullying.reportedPer1000 === 'number' ? `${latestBullying.reportedPer1000.toFixed(1)} per 1,000 students` : null,
          typeof latestBullying.confirmed === 'number' ? `${formatCount(latestBullying.confirmed)} confirmed by investigation` : null,
        ].filter(Boolean).join('; ') || undefined,
      });
    }
    if (latestRestraints && typeof latestRestraints.restraints === 'number') {
      figures.push({
        label: 'Restraints',
        value: formatCount(latestRestraints.restraints),
        period: shortYear(latestRestraints.year),
        detail: [
          typeof latestRestraints.restraintsPer1000 === 'number' ? `${latestRestraints.restraintsPer1000.toFixed(1)} per 1,000 students` : null,
          typeof latestRestraints.seclusions === 'number' ? `${formatCount(latestRestraints.seclusions)} seclusions` : null,
        ].filter(Boolean).join('; ') || undefined,
      });
    }
    return { figures, takeaway };
  }, [truancyRows, bullyingRows, restraintRows]);

  return (
    <StatePage
      displayName={PAGE.displayName}
      status={status}
      onRetry={retry}
      errorMessage="Statewide safety data could not be loaded."
      intro="Truancy, bullying, restraint and seclusion, and serious incidents that schools report to the state at the end of each school year."
      keyFigures={<KeyFigures takeaway={keyFigures.takeaway} figures={keyFigures.figures} />}
      districtSection="safety"
      notCovered="Chronic absenteeism (missing 10% or more of school days for any reason) and counts by student group aren't on the site yet, and statewide suspensions aren't on these pages yet; each district's Safety page shows its suspensions. Truancy counts only unexcused absences."
      source="NH Department of Education, School Safety Data Collection and truancy reports"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <TrendChart
          title="Share of students who were truant"
          subtitle="Students with 10 or more half-days of unexcused absence, as a percentage of enrollment"
          data={truancyRows}
          series={[{ key: 'share', name: 'Truant students (%)' }]}
          tableSeries={[{ key: 'students', name: 'Truant students', format: formatCount }]}
          format={value => formatPercent(value, 1)}
          axisFormat={value => formatPercent(value)}
          bands={REMOTE_BAND}
          note={`${COVID_NOTE} The table view also lists the number of truant students.`}
          csvName="nh-truancy"
        />

        <Divider />

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, '& > *': { flex: 1, minWidth: 0 } }}>
          <TrendChart
            title="Bullying reports"
            subtitle="Bullying of any kind"
            data={bullyingRows}
            series={[{ key: 'reported', name: 'Reported' }, { key: 'confirmed', name: 'Confirmed by investigation', shortName: 'Confirmed' }]}
            tableSeries={[{ key: 'reportedPer1000', name: 'Reported per 1,000 students', format: value => value.toFixed(1) }]}
            format={formatCount}
            axisFormat={value => formatCompact(value)}
            bands={REMOTE_BAND}
            note={COVID_NOTE}
            csvName="nh-bullying"
            csvUnit="reports"
          />
          <TrendChart
            title="Restraints and seclusions"
            subtitle="Times school staff physically held or isolated a student"
            data={restraintRows}
            series={[{ key: 'restraints', name: 'Restraints' }, { key: 'seclusions', name: 'Seclusions' }]}
            tableSeries={[
              { key: 'restraintsPer1000', name: 'Restraints per 1,000 students', format: value => value.toFixed(1) },
              { key: 'seclusionsPer1000', name: 'Seclusions per 1,000 students', format: value => value.toFixed(1) },
            ]}
            format={formatCount}
            axisFormat={value => formatCompact(value)}
            bands={REMOTE_BAND}
            note={`State law allows restraint and seclusion only when a student's behavior poses a substantial and imminent risk of serious bodily harm. ${jumpNote}`.trim()}
            csvName="nh-restraint-seclusion"
            csvUnit="times"
          />
        </Box>

        <Divider />

        <StateTable
          title="Serious safety incidents"
          subtitle={`Incidents schools reported statewide, newest year first. The total covers ${incidentTable.totalYears.length} years.`}
          columns={[
            { key: 'type', label: 'Incident' },
            ...incidentTable.years.map(year => ({
              key: String(year),
              label: formatSchoolYear(year),
              align: 'right' as const,
              format: (row: IncidentRow) => formatCount(row[String(year)] as number),
            })),
            { key: 'total', label: `${incidentTable.totalYears.length}-year total`, align: 'right' as const, format: (row: IncidentRow) => formatCount(row.total) },
          ]}
          rows={incidentTable.rows}
          sectionOf={row => row.section}
          maxWidth={900}
          csvName="nh-serious-safety-incidents"
        />
      </Box>
    </StatePage>
  );
};

export default StateSafety;
