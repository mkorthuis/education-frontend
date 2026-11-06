import React, { useMemo } from 'react';
import { Box, Divider } from '@mui/material';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import StatePage from '../components/StatePage';
import { keepYearsTogether } from '../components/chartText';
import StateTable from '../components/StateTable';
import { CompareYearPicker, useCompareYear } from '../components/CompareYear';
import TrendChart from '../components/TrendChart';
import { COUNT, downloadWorkbook, ExcelSheet, PERCENT } from '../utils/excel';
import KeyFigures, { KeyFigure } from '../components/KeyFigures';
import { useStateLoads } from '../hooks/useStateLoads';
import { useStateSafetyData } from '../hooks/useStatewideData';
import {
  changeSince,
  formatCompact,
  formatCount,
  formatPercent,
  formatSchoolYear,
  formatSignedPercent,
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
const REMOTE_BAND = [{ from: REMOTE_SCHOOL_YEAR - 1, to: REMOTE_SCHOOL_YEAR, label: 'COVID' }];

/** The table's group for an incident type */
const incidentSection = (label: string) => (label.startsWith('Firearm') ? 'Firearms' : 'Other Serious Incidents');

type IncidentRow = { type: string; section: string; count: number; before: number | null; change: number | null };

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

  // Firearm incidents and all other serious incidents each year: the sums of the table's two groups
  const incidentRows = useMemo(() => {
    const years = [...new Set(incidents.map(row => row.year))].sort((a, b) => a - b);
    const sum = (year: number, section: string) => incidents
      .filter(row => row.year === year && incidentSection(plainLabel(INCIDENT_LABELS, row.safety_type.name)) === section)
      .reduce((total, row) => total + row.count, 0);
    return years.map(year => ({ year, firearms: sum(year, 'Firearms'), other: sum(year, 'Other Serious Incidents') }));
  }, [incidents]);

  // Serious incidents: the latest year by type next to a year the reader picks, like the Staff page's tables
  const incidentCompare = useCompareYear(incidents.map(row => row.year));
  const incidentTable = useMemo(() => {
    const latestYear = incidents.length ? Math.max(...incidents.map(row => row.year)) : null;
    const compareYear = incidentCompare.year;
    const percentChange = (now: number, then: number | null) => (then ? ((now - then) / then) * 100 : null);
    const count = (type: string, year: number) =>
      incidents.filter(row => row.safety_type.name === type && row.year === year).reduce((sum, row) => sum + row.count, 0);
    const types = [...new Set(incidents.map(row => row.safety_type.name))];
    const rows: IncidentRow[] = types.map(type => {
      const label = plainLabel(INCIDENT_LABELS, type);
      const now = latestYear ? count(type, latestYear) : 0;
      const before = compareYear !== null ? count(type, compareYear) : null;
      return { type: label, section: incidentSection(label), count: now, before, change: percentChange(now, before) };
    });
    rows.sort((a, b) => (a.section === b.section ? b.count - a.count || (b.before ?? 0) - (a.before ?? 0) : a.section === 'Firearms' ? -1 : 1));
    const now = rows.reduce((sum, row) => sum + row.count, 0);
    const before = compareYear !== null ? rows.reduce((sum, row) => sum + (row.before ?? 0), 0) : null;
    const total: IncidentRow = { type: 'All Serious Incidents', section: '', count: now, before, change: percentChange(now, before) };
    return { latestYear, rows, total: rows.length ? total : undefined };
  }, [incidents, incidentCompare.year]);

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
      if (change) {
        const ratio = change.from.value ? latestShare.value / change.from.value : 1;
        const trend = ratio >= 1.8 && ratio < 2.5 ? 'about doubled'
          : ratio >= 2.5 && ratio < 3.5 ? 'about tripled'
            : latestShare.value > change.from.value ? 'risen' : latestShare.value < change.from.value ? 'fallen' : 'held steady';
        takeaway.push(`Truancy has ${trend} since ${formatSchoolYear(change.from.year)}: ${formatPercent(latestShare.value, 1)} of students (${formatCount(count)}) `
          + `missed 10 or more half-days without an excuse in ${formatSchoolYear(latestShare.year)}, ${latestShare.value >= change.from.value ? 'up' : 'down'} from ${formatPercent(change.from.value, 1)}.`);
      }
    }
    if (latestBullying && typeof latestBullying.reported === 'number') {
      figures.push({
        label: 'Bullying Reports',
        value: formatCount(latestBullying.reported),
        period: shortYear(latestBullying.year),
        delta: tileDelta(changeSince(toSeries(bullyingRows, row => row.reported), TREND_YEARS), { unit: 'percent', higherIsBetter: false }),
      });
    }
    if (latestRestraints && typeof latestRestraints.restraints === 'number') {
      figures.push({
        label: 'Restraints',
        value: formatCount(latestRestraints.restraints),
        period: shortYear(latestRestraints.year),
        delta: tileDelta(changeSince(toSeries(restraintRows, row => row.restraints), TREND_YEARS), { unit: 'percent', higherIsBetter: false }),
      });
    }
    // Bullying reports, restraints and seclusions sorted into down and up over the same ten years
    const trends = [
      { name: 'bullying reports', series: toSeries(bullyingRows, row => row.reported) },
      { name: 'restraints', series: toSeries(restraintRows, row => row.restraints) },
      { name: 'seclusions', series: toSeries(restraintRows, row => row.seclusions) },
    ].flatMap(({ name, series }) => {
      const change = changeSince(series, TREND_YEARS);
      return change ? [{ name, percent: Math.round(change.percentChange) }] : [];
    });
    const down = trends.filter(trend => trend.percent < 0).map(trend => trend.name);
    const up = trends.filter(trend => trend.percent > 0).map(trend => `${trend.name} are up ${trend.percent}%`);
    const list = (items: string[]) => (items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}` : items[0] ?? '');
    const sentence = down.length && up.length ? `${list(down)} are down, but ${list(up)}.`
      : down.length ? `${list(down)} are all down.`
        : up.length ? `${list(up)}.` : '';
    if (sentence) takeaway.push(sentence.charAt(0).toUpperCase() + sentence.slice(1));
    return { figures, takeaway };
  }, [truancyRows, bullyingRows, restraintRows]);

  // Everything on the page as one workbook: a sheet per chart or table, and the notes the page leaves out
  const downloadExcel = () => {
    const valueIn = (series: { year: number; value: number }[], year: number) => series.find(point => point.year === year)?.value ?? null;
    const number = (value: number | string | null | undefined) => (typeof value === 'number' ? value : null);
    const tileRow = (figure: string, series: { year: number; value: number }[], text: (value: number) => string, points = false): (string | number | null)[] => {
      const latest = latestPoint(series);
      const change = changeSince(series, TREND_YEARS);
      const changeText = change
        ? points ? `${change.change >= 0 ? '+' : '−'}${Math.abs(change.change).toFixed(1)} percentage points` : formatSignedPercent(change.percentChange)
        : null;
      return [figure, latest ? formatSchoolYear(latest.year) : null, latest ? text(latest.value) : null, changeText, change ? formatSchoolYear(change.from.year) : null];
    };
    const incidentYears = [...new Set(incidents.map(row => row.year))].sort((a, b) => a - b);
    const incidentTypes = [...new Set(incidents.map(row => row.safety_type.name))]
      .map(type => ({ type, label: plainLabel(INCIDENT_LABELS, type) }))
      .sort((a, b) => (incidentSection(a.label) === incidentSection(b.label) ? a.label.localeCompare(b.label) : incidentSection(a.label) === 'Firearms' ? -1 : 1));
    const incidentCount = (type: string, year: number) =>
      incidents.filter(row => row.safety_type.name === type && row.year === year).reduce((sum, row) => sum + row.count, 0);
    const sheets: ExcelSheet[] = [
      {
        name: 'Key Figures',
        columns: [
          { header: 'Figure', width: 26 },
          { header: 'School Year', width: 12 },
          { header: 'Value', width: 12 },
          { header: 'Change', width: 26 },
          { header: 'Since', width: 12 },
        ],
        rows: [
          tileRow('Students Who Were Truant', toSeries(truancyRows, row => row.share), value => formatPercent(value, 1), true),
          tileRow('Bullying Reports', toSeries(bullyingRows, row => row.reported), formatCount),
          tileRow('Restraints', toSeries(restraintRows, row => row.restraints), formatCount),
        ],
      },
      {
        name: 'Truancy',
        title: 'Share of Students Who Were Truant',
        subtitle: 'Students with 10 or more half-days of unexcused absence, as a percentage of enrollment',
        columns: [
          { header: 'School Year', width: 12 },
          { header: 'Truant Students', width: 16, format: COUNT },
          { header: 'Enrollment', width: 14, format: COUNT },
          { header: '% Truant', format: PERCENT },
        ],
        rows: truancyRows.map(row => [
          formatSchoolYear(row.year),
          number(row.students),
          valueIn(enrolled, row.year),
          typeof row.share === 'number' ? row.share / 100 : null,
        ]),
      },
      {
        name: 'Bullying Reports',
        subtitle: 'Bullying of any kind',
        columns: [
          { header: 'School Year', width: 12 },
          { header: 'Reported', format: COUNT },
          { header: 'Confirmed By Investigation', width: 26, format: COUNT },
          { header: 'Reported per 1,000 Students', width: 26, format: '0.0' },
        ],
        rows: bullyingRows.map(row => [formatSchoolYear(row.year), number(row.reported), number(row.confirmed), number(row.reportedPer1000)]),
      },
      {
        name: 'Restraints and Seclusions',
        subtitle: 'Times school staff physically held or isolated a student',
        columns: [
          { header: 'School Year', width: 12 },
          { header: 'Restraints', format: COUNT },
          { header: 'Seclusions', format: COUNT },
          { header: 'Restraints per 1,000 Students', width: 28, format: '0.0' },
          { header: 'Seclusions per 1,000 Students', width: 28, format: '0.0' },
        ],
        rows: restraintRows.map(row => [
          formatSchoolYear(row.year), number(row.restraints), number(row.seclusions), number(row.restraintsPer1000), number(row.seclusionsPer1000),
        ]),
      },
      {
        name: 'Serious Incidents By Year',
        title: 'Serious Safety Incidents By Year',
        subtitle: 'Firearms and other serious incidents schools reported statewide',
        columns: [
          { header: 'School Year', width: 12 },
          { header: 'Firearms', format: COUNT },
          { header: 'Other Serious Incidents', width: 24, format: COUNT },
          { header: 'All Serious Incidents', width: 22, format: COUNT },
        ],
        rows: incidentRows.map(row => [formatSchoolYear(row.year), row.firearms, row.other, row.firearms + row.other]),
      },
      {
        name: 'Serious Incidents By Type',
        title: 'Serious Safety Incidents By Type',
        subtitle: 'Incidents schools reported statewide, each school year',
        columns: [
          { header: 'Incident', width: 30 },
          { header: 'Group', width: 22 },
          ...incidentYears.map(year => ({ header: formatSchoolYear(year), width: 10, format: COUNT })),
        ],
        rows: incidentTypes.map(({ type, label }) => [label, incidentSection(label), ...incidentYears.map(year => incidentCount(type, year))]),
        totalRow: ['All Serious Incidents', '', ...incidentYears.map(year => incidentTypes.reduce((sum, { type }) => sum + incidentCount(type, year), 0))],
      },
      {
        name: 'Notes',
        title: 'About This Data',
        subtitle: 'Safety for New Hampshire',
        columns: [{ header: 'Notes', width: 100, wrap: true }],
        rows: [[[
          `From NH Education Facts (${window.location.href}), downloaded ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.`,
          'Source: NH Department of Education, School Safety Data Collection and truancy reports, which schools file at the end of each school year.',
          'Truant students had 10 or more half-days of unexcused absence; the share is of enrollment. Truancy counts only unexcused absences, not chronic absenteeism.',
          'Rates per 1,000 students use the enrollment the state reports with its safety data.',
          'State law allows restraint and seclusion only when a student\'s behavior poses a substantial and imminent risk of serious bodily harm.',
          'Many schools were remote or hybrid in 2020-21, so that year\'s counts are low.',
          'Serious incidents are firearms incidents (handguns, rifles or shotguns, more than one type, possession or sale, and other) and other serious incidents (first-degree assault, arson, aggravated sexual assault and robbery).',
        ].join('\n\n')]],
      },
    ];
    return downloadWorkbook('nh-safety.xlsx', sheets);
  };

  return (
    <StatePage
      displayName={PAGE.displayName}
      status={status}
      onRetry={retry}
      errorMessage="Statewide safety data could not be loaded."
      intro={(
        <>
          What New Hampshire's public schools report to the state each year about truancy, bullying, restraint and seclusion, and serious incidents such as assaults and firearms.
          {/* The takeaway as a second paragraph, so the tiles sit beside the text on wide screens */}
          {keyFigures.takeaway.length > 0 && (
            <Box component="span" sx={{ display: 'block', mt: 2 }}>{keepYearsTogether(keyFigures.takeaway.join(' '))}</Box>
          )}
        </>
      )}
      keyFigures={<KeyFigures figures={keyFigures.figures} centerLastTile />}
      keyFiguresBesideIntro
      onDownload={downloadExcel}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <TrendChart
          title="Share of Students Who Were Truant"
          // Phones: a short title and subtitle
          shortTitle="% Students Truant"
          subtitle="Students With 10 or More Half-Days of Unexcused Absence, as a Percentage of Enrollment"
          shortSubtitle="10+ Half Days Unexcused"
          data={truancyRows}
          series={[{ key: 'share', name: 'Truant Students (%)' }]}
          tableSeries={[{ key: 'students', name: 'Truant Students', format: formatCount }]}
          format={value => formatPercent(value, 1)}
          axisFormat={value => formatPercent(value)}
          bands={REMOTE_BAND}
        />

        <Divider />

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, '& > *': { flex: 1, minWidth: 0 } }}>
          <TrendChart
            title="Bullying Reports"
            subtitle="Bullying of Any Kind"
            data={bullyingRows}
            series={[{ key: 'reported', name: 'Reported' }, { key: 'confirmed', name: 'Confirmed By Investigation', shortName: 'Confirmed' }]}
            tableSeries={[{ key: 'reportedPer1000', name: 'Reported per 1,000 Students', format: value => value.toFixed(1), hideOnPhone: true }]}
            format={formatCount}
            axisFormat={value => formatCompact(value)}
            bands={REMOTE_BAND}
          />
          <TrendChart
            title="Restraints and Seclusions"
            subtitle="Times School Staff Physically Held or Isolated a Student"
            data={restraintRows}
            series={[{ key: 'restraints', name: 'Restraints' }, { key: 'seclusions', name: 'Seclusions' }]}
            tableSeries={[
              { key: 'restraintsPer1000', name: 'Restraints per 1,000 Students', format: value => value.toFixed(1), hideOnPhone: true },
              { key: 'seclusionsPer1000', name: 'Seclusions per 1,000 Students', format: value => value.toFixed(1), hideOnPhone: true },
            ]}
            format={formatCount}
            axisFormat={value => formatCompact(value)}
            bands={REMOTE_BAND}
            note="State law allows restraint and seclusion only when a student's behavior poses a substantial and imminent risk of serious bodily harm."
          />
        </Box>

        <Divider />

        {/* The yearly totals beside the table of incident types on desktop */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, '& > *': { flex: 1, minWidth: 0 } }}>
          <TrendChart
            title="Serious Safety Incidents By Year"
          shortTitle="Serious Incidents By Year"
            subtitle="Firearms and Other Serious Incidents"
            data={incidentRows}
            series={[{ key: 'firearms', name: 'Firearms' }, { key: 'other', name: 'Other Serious Incidents', shortName: 'Other' }]}
            format={formatCount}
            axisFormat={value => formatCompact(value)}
            bands={REMOTE_BAND}
          />
          <StateTable
            title="Serious Safety Incidents"
            shortTitle="Serious Incidents"
            subtitle="Incidents Schools Reported Statewide"
            shortSubtitle="Incidents Reported"
            control={incidentCompare.year !== null && (
              <CompareYearPicker years={incidentCompare.years} year={incidentCompare.year} onChange={incidentCompare.setYear} label="Compare incidents with" />
            )}
            columns={[
              { key: 'type', label: 'Incident' },
              ...(incidentTable.latestYear ? [{
                key: 'count',
                label: formatSchoolYear(incidentTable.latestYear),
                shortLabel: shortYear(incidentTable.latestYear),
                align: 'right' as const,
                format: (row: IncidentRow) => formatCount(row.count),
              }] : []),
              ...(incidentCompare.year !== null ? [{
                key: 'before',
                label: formatSchoolYear(incidentCompare.year),
                shortLabel: shortYear(incidentCompare.year),
                align: 'right' as const,
                format: (row: IncidentRow) => (row.before === null ? '—' : formatCount(row.before)),
              }] : []),
              { key: 'change', label: '% Change', shortLabel: 'Change', align: 'right' as const, format: (row: IncidentRow) => formatSignedPercent(row.change) },
            ]}
            rows={incidentTable.rows}
            totalRow={incidentTable.total}
            sectionOf={row => row.section}
          />
        </Box>
      </Box>
    </StatePage>
  );
};

export default StateSafety;
