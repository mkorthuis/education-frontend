import React, { useMemo, useState } from 'react';
import { Box, Chip, Table, TableBody, TableCell, TableHead, TableRow, Typography, useMediaQuery, useTheme } from '@mui/material';
import { visuallyHidden } from '@/components/ds';
import { ChartHeader } from '@/features/state/components/chartText';
import { formatDollars } from '@/features/state/utils/stateMetrics';
import { shortYear } from '@/features/state/utils/phrases';
import {
  AID_COLORS,
  AidFormula,
  AidLine,
  aidNames,
  aidWaterfall,
  AidRole,
  AidTownCalculation,
  adequacyEquation,
  barDollars,
  DistrictAidYear,
  EquationLine,
  formatAidValue,
  lineName,
  productArithmetic,
  PROSE_WIDTH,
  readableFormula,
  sweptCoversCost,
} from '../../utils/stateAid';
import CalculationTable, { CalcRow, LineDetails, StepsFold } from './CalculationTable';

// How the adequacy aid is figured, as one equation in the town's own numbers: what an adequate education
// costs for its students, plus the extra need and the cushions, less the statewide property tax it raises and
// keeps, is the grant. Each line in total and per resident student, and a bar showing who pays. The
// DOE's full calculation is folded away underneath, step by step.

const percent = (share: number | null) => (share === null ? null : `${Math.round(share * 100)}%`);
// The first line has no sign; the rest go on, come off, or are the result
const MARKERS: Record<EquationLine['kind'], string> = { cost: '', need: '+', extra: '+', swept: '−', floor: '+', grant: '=' };

/** The line's sign and figure: the SWEPT comes off */
const signed = (value: number) => (value < 0 ? `−${formatDollars(-value)}` : formatDollars(value));

/** The equation, a row a line: its marker, its words, its total and its amount per student */
const Equation: React.FC<{ lines: EquationLine[]; label: string }> = ({ lines, label }) => {
  const perStudent = lines.some(line => line.perStudent !== null);
  return (
    <Table size="small" aria-label={label} sx={{ fontVariantNumeric: 'tabular-nums', '& td': { verticalAlign: 'top' } }}>
      <TableHead>
        <TableRow>
          <TableCell sx={{ width: 36, pr: 0, pl: 0.5 }}><Box component="span" sx={visuallyHidden}>Step</Box></TableCell>
          <TableCell><Box component="span" sx={visuallyHidden}>What</Box></TableCell>
          <TableCell align="right">Total</TableCell>
          {perStudent && <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Per Student</TableCell>}
        </TableRow>
      </TableHead>
      <TableBody>
        {lines.map(line => {
          const bold = line.kind === 'grant';
          const rule = bold ? { borderTop: '2px solid', borderTopColor: 'divider' } : {};
          return (
            <TableRow key={line.key} sx={{ '& > td': rule }}>
              <TableCell sx={{ width: 36, pr: 0, pl: 0.5 }}>
                <Box aria-hidden sx={{ width: 22, textAlign: 'center', color: 'text.secondary', fontWeight: 700 }}>
                  {MARKERS[line.kind]}
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: bold ? 600 : 400 }}>
                  {line.shortLabel ? (
                    <>
                      <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{line.label}</Box>
                      <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>{line.shortLabel}</Box>
                    </>
                  ) : line.label}
                </Typography>
                {/* On phones, the lines alone */}
                {line.detail && <Typography variant="caption" component="p" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' }, maxWidth: { xs: 560, lg: 'none' }, whiteSpace: 'pre-line' }}>{line.detail}</Typography>}
              </TableCell>
              <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontWeight: bold ? 600 : 400 }}>
                {signed(line.value)}
              </TableCell>
              {perStudent && (
                <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' }, whiteSpace: 'nowrap', color: 'text.secondary', width: 140 }}>
                  {line.perStudent !== null && <>{signed(line.perStudent)}<Box component="span" sx={visuallyHidden}> per student</Box></>}
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

/**
 * Who pays: the SWEPT raised in town and the part of the cost the state pays, side by side, then the cushions.
 * On phones, the legend's short names.
 */
const CostBar: React.FC<{ lines: EquationLine[]; townName: string }> = ({ lines, townName }) => {
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));
  const value = (kind: EquationLine['kind']) => lines.filter(line => line.kind === kind).reduce((sum, line) => sum + line.value, 0);
  const cost = value('cost') + value('need');
  const swept = -value('swept');
  const gap = Math.max(0, cost - swept);
  const extras = Math.max(0, value('extra'));
  const scale = swept + gap + extras || 1;
  const width = (amount: number) => `${(Math.max(0, amount) / scale) * 100}%`;
  const parts = [
    { key: 'swept', name: `${townName} Property Taxes (SWEPT)`, shortName: 'SWEPT', amount: swept, color: AID_COLORS.swept },
    { key: 'gap', name: 'Adequacy Grant (State)', shortName: 'Adequacy Grant (State)', amount: gap, color: AID_COLORS.grant },
    { key: 'extras', name: 'Cushions and Extra Aid', shortName: 'Extra Aid', amount: extras, color: AID_COLORS.grant, faded: true },
  ].filter(part => part.amount >= 0.5);
  return (
    <Box aria-hidden sx={{ mt: 2, maxWidth: 760 }}>
      <Box sx={{ display: 'flex', height: 18, gap: '2px' }}>
        {parts.map(part => (
          <Box key={part.key} sx={{ width: width(part.amount), minWidth: 2, backgroundColor: part.color, opacity: part.faded ? 0.5 : 1, borderRadius: '2px' }} />
        ))}
      </Box>
      <Box component="ul" sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 2, rowGap: 0.5, listStyle: 'none', p: 0, m: 0, mt: 1 }}>
        {parts.map(part => (
          <Box component="li" key={part.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: 0.5, backgroundColor: part.color, opacity: part.faded ? 0.5 : 1 }} />
            <Typography variant="caption" color="text.primary">{isMobile ? part.shortName : part.name} {barDollars(part.amount)}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

// The DOE's steps: aid lines go on (+), the SWEPT comes off (−); subtotals and results are bold under a
// rule; student counts and figures used along the way are grey
const SIGNS: Partial<Record<AidRole, '+' | '−'>> = { swept: '−', added_aid: '+', hold_harmless: '+' };
const SUBTOTALS = new Set<AidRole>(['cost_total', 'result']);
const ALONG_THE_WAY = new Set<AidRole>(['students', 'basis']);
const barColor = (line: AidLine) =>
  line.code === 'adequacy_grant' ? AID_COLORS.grant : line.role === 'swept' ? AID_COLORS.swept : AID_COLORS.other;

/** The DOE's calculation for the town, step by step, each opening to its formula and figures */
const adequacyStepRows = (town: AidTownCalculation, formula?: AidFormula): CalcRow[] => {
  const names = aidNames(formula);
  const bars = aidWaterfall(town.steps);
  return town.steps.map((line, index) => ({
    key: line.code,
    name: lineName(line),
    caption: productArithmetic(line, names) ?? undefined,
    value: line.role === 'swept' ? `−${formatAidValue(line.value, line.unit)}` : formatAidValue(line.value, line.unit),
    emphasis: SUBTOTALS.has(line.role) ? 'subtotal' : ALONG_THE_WAY.has(line.role) ? 'muted' : undefined,
    indent: line.role === 'cost' || ALONG_THE_WAY.has(line.role),
    sign: SIGNS[line.role],
    bar: bars[index],
    color: barColor(line),
    details: (
      <LineDetails explanation={line.explanation}>
        {line.formula ? (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, ...PROSE_WIDTH }}>
              As a formula: {readableFormula(line.formula, names)}
            </Typography>
            {Object.keys(line.inputs).length > 0 && (
              <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2.5, typography: 'body2', color: 'text.secondary' }}>
                {Object.entries(line.inputs).map(([code, value]) => (
                  <li key={code}>{names[code]?.name ?? code}: {formatAidValue(value, names[code]?.unit)}</li>
                ))}
              </Box>
            )}
          </>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>The DOE's figure for the town; it isn't calculated from the lines above.</Typography>
        )}
      </LineDetails>
    ),
  }));
};

interface AdequacyAidSectionProps {
  districtName: string;
  year: DistrictAidYear;
  formula?: AidFormula;
}

const AdequacyAidSection: React.FC<AdequacyAidSectionProps> = ({ districtName, year, formula }) => {
  const [townId, setTownId] = useState<number>();
  const town: AidTownCalculation = year.towns.find(entry => entry.town_id === townId) ?? year.towns[0];
  const lines = useMemo(() => adequacyEquation(town, formula), [town, formula]);
  const steps = useMemo(() => adequacyStepRows(town, formula), [town, formula]);

  // A town split among districts sends the district part of its aid
  const split = town.share.source === 'doe_split';
  const taxes = year.towns.length > 1 ? 'your local property taxes in each member town' : `your local ${town.town_name} property taxes`;
  // No grant: the SWEPT alone funds it, and where it raises more than the cost, that's why
  const sweptOnly = year.adequacy_grant < 0.5;
  const covered = year.towns.every(sweptCoversCost);
  const students = year.towns.length > 1 ? 'their students' : `${town.town_name}'s students`;
  const keeps = year.towns.length > 1 ? 'each town keeps all of it for its own schools' : `${town.town_name} keeps all of it for its own schools`;

  return (
    <Box component="section" aria-labelledby="adequacy-aid-title">
      <ChartHeader titleId="adequacy-aid-title" title="How Adequacy Aid Is Calculated" />
      {/* Adequacy grants are paid from the Education Trust Fund (RSA 198:39), which the general fund tops up */}
      <Typography variant="body1" sx={{ mb: 2, ...PROSE_WIDTH }}>
        {sweptOnly ? (
          <>
            In {shortYear(year.fiscal_year)}, statewide adequacy aid is funded entirely by {taxes} (SWEPT).{' '}
            {covered
              ? `They raise more than the state's cost of an adequate education for ${students}, so the state pays no adequacy grant, and ${keeps}.`
              : 'The state pays no adequacy grant.'}{' '}
            The adequacy aid is calculated in the steps below.
          </>
        ) : (
          <>
            Statewide adequacy aid is funded first by {taxes} (SWEPT). It is then topped up by an adequacy grant from the
            state's Education Trust Fund. Both the adequacy aid and the resulting grant are calculated in the steps below.
          </>
        )}
      </Typography>

      {year.towns.length > 1 && (
        <Box role="group" aria-label="Member town" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {year.towns.map(entry => {
            const share = entry.share.source === 'doe_split' ? percent(entry.share.share_of_town) : null;
            const chosen = entry.town_id === town.town_id;
            return (
              <Chip
                key={entry.town_id}
                label={share ? `${entry.town_name} · ${share}` : entry.town_name}
                color={chosen ? 'primary' : 'default'}
                variant={chosen ? 'filled' : 'outlined'}
                onClick={() => setTownId(entry.town_id)}
                aria-pressed={chosen}
              />
            );
          })}
        </Box>
      )}

      <Equation lines={lines} label={`How ${town.town_name}'s ${year.school_year} adequacy aid is figured`} />
      <CostBar lines={lines} townName={town.town_name} />

      {split && (
        <Typography variant="body2" sx={{ mt: 2, ...PROSE_WIDTH }}>
          {districtName} receives {percent(town.share.share_of_town) ?? 'part'} of {town.town_name}'s aid:{' '}
          {formatDollars(town.share.adequacy_grant)} of its {formatDollars(town.town_totals.adequacy_grant)} adequacy grant and{' '}
          {formatDollars(town.share.swept_retained)} of its {formatDollars(town.town_totals.swept)} SWEPT, as the DOE splits the town among its districts.
        </Typography>
      )}

      <StepsFold>
        <CalculationTable rows={steps} label={`${town.town_name}'s adequacy aid calculation, ${year.school_year}`} />
      </StepsFold>
    </Box>
  );
};

export default AdequacyAidSection;
