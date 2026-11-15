import React from 'react';
import { Box, Typography } from '@mui/material';
import { ChartHeader } from '@/features/state/components/chartText';
import { formatDollars } from '@/features/state/utils/stateMetrics';
import { shortYear } from '@/features/state/utils/phrases';
import type { ProcessedReport } from '@/store/slices/financeSlice';
import { estimateNote, NAMED_STATE_LINE_NAMES, NAMED_STATE_LINES, OTHER_LINE_NOTES, PROSE_WIDTH, StateAidRow, stateRevenueLines } from '../../utils/stateAid';
import CalculationTable, { CalcRow } from './CalculationTable';

// The rest of the district's state revenue, from its financial report (DOE-25): each state line besides the
// adequacy grant, SWEPT and special education aid, in a line each, so the State Aid tab's total is the state
// revenue the Revenues tab shows. A line the report had the year before and not this year is listed as ended
// (a building aid bond paid off). Where the report books one of the three named parts differently from the
// DOE's figure, the difference is a line here too.

/** The year's other state aid, line by line, the lines that ended, and any difference in how the report books the other three */
const otherAidRows = (row: StateAidRow, report: ProcessedReport, previous?: { report: ProcessedReport; schoolYear: string } | null): CalcRow[] => {
  const lines = stateRevenueLines(report);
  const reported = (name: string) => lines.find(line => line.name === name)?.value ?? 0;
  const others = lines.filter(line => !NAMED_STATE_LINE_NAMES.has(line.name) && Math.abs(line.value) >= 0.5);
  const ended = previous
    ? stateRevenueLines(previous.report).filter(line => !NAMED_STATE_LINE_NAMES.has(line.name) && line.value >= 0.5 && !others.some(other => other.name === line.name))
    : [];
  const booked = reported(NAMED_STATE_LINES.grant) + reported(NAMED_STATE_LINES.swept) + reported(NAMED_STATE_LINES.sped)
    - row.grant - row.swept - (row.sped ?? 0);

  return [
    ...others.map(line => ({ key: line.name, name: line.name, caption: OTHER_LINE_NOTES[line.name], value: formatDollars(line.value) })),
    ...ended.map(line => ({
      key: `ended-${line.name}`,
      name: line.name,
      caption: `Ended after ${previous!.schoolYear}, when it was ${formatDollars(line.value)}${OTHER_LINE_NOTES[line.name] ? `. ${OTHER_LINE_NOTES[line.name]}` : ''}`,
      value: formatDollars(0),
      emphasis: 'muted' as const,
    })),
    ...(Math.abs(booked) >= 0.5 ? [{
      key: 'booked_differently',
      name: 'Booked Differently in Its Report',
      // A caption, not a line that opens, so the table's words line up under its heading
      caption: 'Its adequacy aid, SWEPT and special education aid less the DOE\'s figures, such as aid booked in another year',
      value: formatDollars(booked),
    }] : []),
    {
      key: 'other',
      // Not "Other State Aid": the report has a line by that name
      name: 'All Other State Aid',
      value: formatDollars(row.other ?? 0),
      emphasis: 'subtotal' as const,
    },
  ];
};

interface OtherStateAidProps {
  districtName: string;
  schoolYear: string;
  row: StateAidRow;
  report?: ProcessedReport | null;
  previous?: { report: ProcessedReport; schoolYear: string } | null;
}

const OtherStateAid: React.FC<OtherStateAidProps> = ({ districtName, schoolYear, row, report, previous }) => (
  <Box component="section" aria-labelledby="other-state-aid-title">
    <ChartHeader
      titleId="other-state-aid-title"
      title="Other State Aid"
      subtitle={report ? `The Rest of the State Revenue in ${districtName}'s ${schoolYear} Financial Report` : undefined}
      // On phones: "Remaining 24/25 State Aid"
      shortSubtitle={report ? `Remaining ${shortYear(row.year)} State Aid` : undefined}
    />
    {report && row.other !== null ? (
      <CalculationTable rows={otherAidRows(row, report, previous)} label={`${districtName}'s other state aid, ${schoolYear}`} heading="Program" bars={false} />
    ) : (
      <Typography variant="body1" sx={PROSE_WIDTH}>
        Other state aid comes from {districtName}'s financial report for {schoolYear}, which isn't in yet.
        {row.estimates.other && ` ${estimateNote(row.estimates.other, row.other ?? 0)}`}
      </Typography>
    )}
  </Box>
);

export default OtherStateAid;
