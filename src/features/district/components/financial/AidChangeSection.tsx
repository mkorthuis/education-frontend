import React, { useMemo } from 'react';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import { ChartHeader } from '@/features/state/components/chartText';
import { formatDollars } from '@/features/state/utils/stateMetrics';
import { AID_COLORS, AidFormula, adequacyChange, changeSentence, DistrictAidYear, PROSE_WIDTH, sweptCoversCost, withSign } from '../../utils/stateAid';
import CalculationTable, { CalcRow } from './CalculationTable';

// Why the adequacy grant changed since last year: from the year before's grant to this one's, in the parts
// that add up to the change: students, the legislature's rates, the SWEPT raised in town, and the cushions. A
// district with no grant in either year (its towns' property tax covers their cost) gets a sentence instead:
// the parts of a change from $0 to $0 only cancel.

const TITLE = 'Why the Grant Changed Since Last Year';

interface AidChangeSectionProps {
  districtName: string;
  years: DistrictAidYear[];
  year: DistrictAidYear;
  formulas: Record<number, AidFormula>;
}

const AidChangeSection: React.FC<AidChangeSectionProps> = ({ districtName, years, year, formulas }) => {
  // On phones, the parts' shorter names and details
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));
  // The latest year before this one
  const from = useMemo(() => years.filter(entry => entry.fiscal_year < year.fiscal_year).pop(), [years, year]);
  const change = useMemo(() => (from ? adequacyChange(from, year, formulas) : null), [from, year, formulas]);
  if (!from || !change) return null;

  if (change.from < 0.5 && change.to < 0.5) {
    const covered = [from, year].every(entry => entry.towns.every(sweptCoversCost));
    return (
      <Box component="section" aria-labelledby="aid-change-title">
        <ChartHeader titleId="aid-change-title" title={TITLE} />
        <Typography variant="body1" sx={PROSE_WIDTH}>
          {districtName} received no adequacy grant in {from.school_year} or {year.school_year}
          {covered ? ': the statewide property tax raised in town covered the whole cost both years.' : '.'}
        </Typography>
      </Box>
    );
  }

  let running = change.from;
  const rows: CalcRow[] = [
    {
      key: 'from',
      name: `${from.school_year} Adequacy Grant`,
      value: formatDollars(change.from),
      emphasis: 'subtotal',
      bar: { from: 0, to: change.from, kind: 'total' },
      color: AID_COLORS.grant,
    },
    ...change.effects.map(effect => {
      const start = running;
      running += effect.value;
      return {
        key: effect.key,
        name: (isMobile && effect.shortLabel) || effect.label,
        caption: (isMobile && effect.shortDetail) || effect.detail,
        value: withSign(effect.value),
        indent: true,
        bar: { from: start, to: running, kind: effect.value < 0 ? 'down' as const : 'up' as const },
      };
    }),
    {
      key: 'to',
      name: `${year.school_year} Adequacy Grant`,
      value: formatDollars(change.to),
      emphasis: 'subtotal',
      bar: { from: 0, to: change.to, kind: 'total' },
      color: AID_COLORS.grant,
    },
  ];

  return (
    <Box component="section" aria-labelledby="aid-change-title">
      <ChartHeader titleId="aid-change-title" title={TITLE} />
      <Typography variant="body1" sx={{ mb: 2, ...PROSE_WIDTH }}>
        {changeSentence(districtName, change, from.school_year, year.school_year)}
      </Typography>
      <CalculationTable rows={rows} label={`Why ${districtName}'s adequacy grant changed from ${from.school_year} to ${year.school_year}`} heading="Change" />
    </Box>
  );
};

export default AidChangeSection;
