import React from 'react';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import { formatDollars } from '@/features/state/utils/stateMetrics';
import { formatDollarsShort, shortYear } from '@/features/state/utils/phrases';
import { color } from '@/theme/tokens';
import { AID_PARTS, AidPartKey, hasEstimate, PROSE_WIDTH, StateAidRow, threeFigureDollars } from '../../utils/stateAid';

// The answer first: how much the state provided in the year, per resident student where the district is one
// whole town, and one bar of its four parts, with a bracket over the two that make up its adequacy aid (the
// grant and the SWEPT). A part not in yet is estimated (faded, and "est." in the legend), and the year's aid is
// then what the state is expected to provide.

/** A bracket over the start of the bar, naming what the segments under it add up to: open at the bottom, as wide as `width` */
const BarBracket: React.FC<{ width: string; label: string }> = ({ width, label }) => (
  <Box sx={{ position: 'relative', height: 22, mb: 0.5 }}>
    <Box sx={{ position: 'absolute', left: 0, width, top: 0, bottom: 0, borderTop: '2px solid', borderLeft: '2px solid', borderRight: '2px solid', borderColor: color.textMuted, borderRadius: '2px 2px 0 0' }} />
    <Typography variant="caption" sx={{ position: 'absolute', left: 8, top: 3, color: 'text.secondary', whiteSpace: 'nowrap' }}>{label}</Typography>
  </Box>
);

interface StateAidSummaryProps {
  districtName: string;
  row: StateAidRow;
  /** Resident students, for a district of one whole town */
  students: number | null;
}

// "The state provided Conway $6.26M in 24/25. About $5,938 per student."
const StateAidSummary: React.FC<StateAidSummaryProps> = ({ districtName, row, students }) => {
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));
  const amount = formatDollarsShort(row.total, 2);
  const perStudent = students ? ` About ${formatDollars(row.total / students)} per student.` : '';
  const missing = [row.sped === null && 'special education', row.other === null && 'other'].filter(Boolean).join(' and ');
  const estimated = (key: AidPartKey) => Boolean(row.estimates[key]);
  // On phones, the parts' shortest names, and figures to three significant figures ("$18.4M")
  const dollars = (value: number) => (isMobile ? threeFigureDollars(value) : formatDollars(value));
  const width = (value: number | null) => `${(Math.max(0, value ?? 0) / Math.max(row.total, 1)) * 100}%`;
  return (
    <Box>
      <Typography variant="body1" sx={PROSE_WIDTH}>
        {row.complete ? (
          <>The state provided {districtName} <strong>{amount}</strong> in {shortYear(row.year)}.{perStudent}</>
        ) : !missing && hasEstimate(row) ? (
          <>The state is expected to provide {districtName} about <strong>{amount}</strong> in {shortYear(row.year)}.{perStudent}</>
        ) : (
          <>So far, the state has provided {districtName} <strong>{amount}</strong> for {shortYear(row.year)}. Its {missing} state aid isn't in yet.</>
        )}
      </Typography>
      <Box aria-hidden sx={{ mt: 2, maxWidth: 760 }}>
        <BarBracket width={width(row.grant + row.swept)} label={`Adequacy Aid ${isMobile ? threeFigureDollars(row.grant + row.swept) : formatDollarsShort(row.grant + row.swept, 2)}`} />
        <Box sx={{ display: 'flex', height: 22, gap: '2px' }}>
          {AID_PARTS.filter(part => (row[part.key] ?? 0) > 0).map(part => (
            <Box key={part.key} sx={{ width: width(row[part.key]), minWidth: 3, backgroundColor: part.color, opacity: estimated(part.key) ? 0.45 : 1, borderRadius: '2px' }} />
          ))}
        </Box>
      </Box>
      <Box component="ul" sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 2.5, rowGap: 0.5, listStyle: 'none', p: 0, m: 0, mt: 1 }}>
        {AID_PARTS.map(part => (
          <Box component="li" key={part.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: 0.5, backgroundColor: part.color, opacity: estimated(part.key) ? 0.45 : 1, flexShrink: 0 }} />
            <Typography variant="body2">
              {isMobile ? part.phoneName : part.name} <Box component="span" sx={{ fontWeight: 600 }}>{row[part.key] === null ? 'not in yet' : dollars(row[part.key] as number)}</Box>
              {estimated(part.key) && ' (est.)'}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default StateAidSummary;
