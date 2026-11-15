import React from 'react';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import { ChartHeader } from '@/features/state/components/chartText';
import { CONTEXT_COLOR } from '@/features/state/components/TrendChart';
import { color } from '@/theme/tokens';
import { formatDollars, formatSchoolYear } from '@/features/state/utils/stateMetrics';
import { titleCase } from '@/features/state/utils/labels';
import { capitalize } from '@/features/state/utils/phrases';
import {
  AID_COLORS, barDollars, DistrictSpedAid, estimateNote, PROSE_WIDTH, SpedAidYear, StateAidRow, threeFigureDollars,
} from '../../utils/stateAid';
import CalculationTable, { CalcRow, LineDetails, StepsFold } from './CalculationTable';

// Who paid for the district's high-cost students, and why: one bar of their costs, in the district's share
// and the state's (with the part the state didn't pay), then the rule in the year's numbers. The steps, folded
// away: its high-cost students' costs, less what it pays for each up to the threshold, the state's share of
// each band above it (the entitlement), and the proration when the appropriation falls short. The DOE
// publishes each district's costs by band, not its students. Aid paid in a fiscal year is on the year before's
// costs.

const percent = (share: number, digits = 0) => `${(share * 100).toFixed(digits).replace(/\.0+$/, '')}%`;
const times = (multiple: number) => `${multiple.toLocaleString('en-US')} times`;

/**
 * The rule in the year's numbers, then what the state paid of it: "Concord pays the first $69,698 of a
 * student's special education costs, 3.5 times the state average cost per pupil. The state reimburses 80% of
 * costs up to $199,137, 10 times the state average cost per pupil, and 100% above that. However, due to limited
 * funding, the state reimbursed only 69% of what it owed on 2023-24 costs." Shorter on phones: "Concord pays
 * a student's first $69,698 (3.5× the state cost per pupil). The state reimburses 80% up to $199,137
 * (10×) and 100% above. Due to limited funding, it reimbursed only 69% of what it owed on 2023-24 costs."
 */
export const spedAidSentence = (aidYear: SpedAidYear, districtName: string, schoolYear: string, short = false): string => {
  const average = (multiple: number) => (short ? `${multiple.toLocaleString('en-US')}× the state cost per pupil` : `${times(multiple)} the state average cost per pupil`);
  const bands = [...aidYear.bands].sort((a, b) => a.band - b.band);
  const threshold = bands.find(band => band.state_share === 0)?.to_multiple;
  const shares = bands.filter(band => band.state_share > 0).map(band => {
    const share = percent(band.state_share);
    if (band.to_multiple === null) return short ? `${share} above` : `${share} above that`;
    const upTo = formatDollars(band.to_multiple * aidYear.state_average_cost);
    return short ? `${share} up to ${upTo} (${band.to_multiple.toLocaleString('en-US')}×)` : `${share} of costs up to ${upTo}, ${average(band.to_multiple)}`;
  });
  const listed = shares.length > 1
    ? `${shares.slice(0, -1).join(', ')}${short && shares.length === 2 ? '' : ','} and ${shares[shares.length - 1]}`
    : shares[0];
  // In whole percents, unless that would round a shortfall up to 100%
  const paid = percent(aidYear.proration_rate, aidYear.proration_rate > 0.995 ? 1 : 0);
  const minimum = aidYear.minimum_share ? `, and each district at least ${percent(aidYear.minimum_share)} of its share` : '';
  return [
    short
      ? `${districtName} pays a student's first ${formatDollars(aidYear.threshold_cost)}${threshold ? ` (${average(threshold)})` : ''}.`
      : `${districtName} pays the first ${formatDollars(aidYear.threshold_cost)} of a student's special education costs${threshold ? `, ${average(threshold)}` : ''}.`,
    shares.length ? `The state reimburses ${listed}.` : '',
    aidYear.proration_rate < 1
      ? `${short ? 'Due to limited funding, it' : 'However, due to limited funding, the state'} reimbursed only ${paid} of what it owed on ${aidYear.cost_school_year} costs${minimum}.`
      : `In ${schoolYear}, ${short ? 'it' : 'the state'} reimbursed all it owed on ${aidYear.cost_school_year} costs.`,
  ].filter(Boolean).join(' ');
};

/** The year's lines, from the district's costs to its aid */
const spedAidRows = (aidYear: SpedAidYear, district: DistrictSpedAid): CalcRow[] => {
  const threshold = aidYear.bands.find(band => band.state_share === 0)?.to_multiple ?? null;
  const thresholdText = threshold ? `${times(threshold)} the ${formatDollars(aidYear.state_average_cost)} state average` : 'the threshold';
  const rows: CalcRow[] = [
    {
      key: 'total_cost',
      name: 'Cost of Its High-Cost Students',
      caption: `Special education costs in ${district.cost_school_year}`,
      value: formatDollars(district.total_cost),
      emphasis: 'subtotal',
      bar: { from: 0, to: district.total_cost, kind: 'total' },
      details: (
        <LineDetails
          explanation={`The district's ${district.cost_school_year} costs for each student whose special education cost more than ${formatDollars(aidYear.threshold_cost)}, the cost where state aid begins.`}
        />
      ),
    },
    {
      key: 'district_share',
      name: 'Paid by the District',
      caption: `Up to ${formatDollars(aidYear.threshold_cost)} a student: ${thresholdText}`,
      value: `−${formatDollars(district.cost_below_threshold)}`,
      sign: '−',
      bar: { from: district.total_cost, to: district.cost_above_threshold, kind: 'down' },
      details: (
        <LineDetails
          explanation={`The district pays each student's costs up to ${formatDollars(aidYear.threshold_cost)}, ${thresholdText} (the DOE's estimate of the average cost per pupil). A student there part of the year counts at part of it.`}
        />
      ),
    },
    {
      key: 'cost_above_threshold',
      name: 'Costs Above the Threshold',
      value: formatDollars(district.cost_above_threshold),
      emphasis: 'subtotal',
      bar: { from: 0, to: district.cost_above_threshold, kind: 'total' },
    },
  ];

  // The state's share of each band above the threshold builds the entitlement
  let running = 0;
  district.bands.filter(band => band.state_share > 0).forEach(band => {
    const formula = aidYear.bands.find(entry => entry.band === band.band);
    const share = band.cost * band.state_share;
    const from = running;
    running += share;
    const range = formula
      ? formula.to_multiple === null
        ? `over ${times(formula.from_multiple)} the state average (${formatDollars(formula.from_multiple * aidYear.state_average_cost)})`
        : `between ${formula.from_multiple.toLocaleString('en-US')} and ${times(formula.to_multiple)} the state average (${formatDollars(formula.from_multiple * aidYear.state_average_cost)} to ${formatDollars(formula.to_multiple * aidYear.state_average_cost)})`
      : 'in this band';
    rows.push({
      key: `band_${band.band}`,
      name: titleCase(band.label),
      caption: `${formatDollars(band.cost)} × ${percent(band.state_share)}`,
      value: formatDollars(share),
      indent: true,
      sign: '+',
      bar: { from, to: running, kind: 'up' },
      details: (
        <LineDetails
          explanation={`The state pays ${percent(band.state_share)} of each student's costs ${range}.`}
        />
      ),
    });
  });

  rows.push({
    key: 'entitlement',
    name: 'Entitlement',
    value: formatDollars(district.entitlement),
    emphasis: 'subtotal',
    bar: { from: 0, to: district.entitlement, kind: 'total' },
    details: <LineDetails explanation="The state's share of the costs above the threshold: the aid the district is owed in full." />,
  });

  // Prorated when the appropriation falls short; with a minimum, a district's share can be more than the rate
  if (district.aid_paid < district.entitlement - 0.5) {
    const paid = district.entitlement > 0 ? district.aid_paid / district.entitlement : 0;
    const appropriation = aidYear.appropriation ? `the ${formatDollars(aidYear.appropriation)} appropriation` : 'the appropriation';
    rows.push({
      key: 'proration',
      name: 'Cut by Proration',
      caption: `Paid at ${percent(paid, 2)}: ${appropriation} fell short`,
      value: `−${formatDollars(district.entitlement - district.aid_paid)}`,
      sign: '−',
      bar: { from: district.entitlement, to: district.aid_paid, kind: 'down' },
      details: (
        <LineDetails
          explanation={`${capitalize(appropriation)} covered ${percent(aidYear.proration_rate, 2)} of every district's entitlement${aidYear.minimum_share ? `, and each district got at least ${percent(aidYear.minimum_share)} of its own` : ''}.`}
        />
      ),
    });
  }

  rows.push({
    key: 'aid_paid',
    name: 'Special Education Aid',
    value: formatDollars(district.aid_paid),
    emphasis: 'subtotal',
    bar: { from: 0, to: district.aid_paid, kind: 'total' },
    color: AID_COLORS.sped,
  });
  return rows;
};

// The district's share in grey; the state's in its color, striped where it went unpaid and the district paid it
const DISTRICT_COLOR = CONTEXT_COLOR;
const UNPAID = `repeating-linear-gradient(135deg, ${AID_COLORS.sped} 0 2px, ${color.surface} 2px 5px)`;

interface PaidPart {
  key: string;
  name: string;
  /** On phones */
  shortName: string;
  amount: number;
  fill: Record<string, string | number>;
}

/** The parts of the district's high-cost students' costs: its share by the rule, then the state's, paid and not */
const spedPaidGroups = (aidYear: SpedAidYear, district: DistrictSpedAid, districtName: string): { key: string; name: string; amount: number; parts: PaidPart[] }[] => {
  const threshold = formatDollars(aidYear.threshold_cost);
  // Its share of the band the state pays part of: "20% of Costs from $69,698 to $199,137"
  const shared = district.bands.filter(band => band.state_share > 0 && band.state_share < 1);
  const ownShare = shared.reduce((sum, band) => sum + band.cost * (1 - band.state_share), 0);
  const band = shared.length === 1 ? aidYear.bands.find(entry => entry.band === shared[0].band) : undefined;
  const shareName = band && band.to_multiple !== null
    ? `${percent(1 - band.state_share)} of Costs from ${threshold} to ${formatDollars(band.to_multiple * aidYear.state_average_cost)}`
    : `Its Share of Costs Above ${threshold}`;
  const unpaid = Math.max(0, district.entitlement - district.aid_paid);
  const groups: { key: string; name: string; parts: PaidPart[] }[] = [
    {
      key: 'district',
      name: `${districtName}'s Share`,
      parts: [
        { key: 'first', name: `First ${threshold} of Each Student`, shortName: `First ${threshold} Each`, amount: district.cost_below_threshold, fill: { backgroundColor: DISTRICT_COLOR } },
        { key: 'share', name: shareName, shortName: band ? `${percent(1 - band.state_share)} Share` : 'Its Share', amount: ownShare, fill: { backgroundColor: DISTRICT_COLOR, opacity: 0.5 } },
      ],
    },
    {
      key: 'state',
      name: "The State's Share",
      parts: [
        { key: 'paid', name: 'Reimbursed by the State', shortName: 'Reimbursed', amount: district.aid_paid, fill: { backgroundColor: AID_COLORS.sped } },
        { key: 'unpaid', name: `Not Paid, Left to ${districtName}`, shortName: `Left to ${districtName}`, amount: unpaid, fill: { background: UNPAID, boxShadow: `inset 0 0 0 1px ${AID_COLORS.sped}` } },
      ],
    },
  ];
  return groups.map(group => {
    const parts = group.parts.filter(part => part.amount >= 0.5);
    // The sum of the parts as shown, so the dollars add up on the page
    return { ...group, parts, amount: parts.reduce((sum, part) => sum + Math.round(part.amount), 0) };
  });
};

/**
 * Who paid for the district's high-cost students: "Concord's high-cost students cost $1.71M in 2023-24. The
 * state reimbursed $581K (34%), and Concord paid $1.13M (66%)." Then one bar of their costs, the district's
 * share by the rule and the state's, with the part of the state's share that went unpaid striped, and the
 * parts listed under each share.
 */
const WhoPaid: React.FC<{ aidYear: SpedAidYear; district: DistrictSpedAid; districtName: string; isMobile: boolean }> = ({ aidYear, district, districtName, isMobile }) => {
  const groups = spedPaidGroups(aidYear, district, districtName);
  const total = Math.max(district.total_cost, 1);
  const stateShare = Math.round((district.aid_paid / total) * 100);
  const swatch = (part: PaidPart) => <Box sx={{ width: 12, height: 12, borderRadius: 0.5, flexShrink: 0, ...part.fill }} />;
  // On phones, the legend's figures to three significant figures ("$868K"); the threshold in a name stays whole
  const dollars = (value: number) => (isMobile ? threeFigureDollars(value) : formatDollars(value));
  return (
    <>
      <Typography variant="body1" sx={PROSE_WIDTH}>
        {districtName}'s high-cost students cost <strong>{barDollars(district.total_cost)}</strong> in {district.cost_school_year}.
        {' '}The state reimbursed {barDollars(district.aid_paid)} ({stateShare}%), and {districtName} paid {barDollars(district.total_cost - district.aid_paid)} ({100 - stateShare}%).
      </Typography>
      <Box aria-hidden sx={{ mt: 2, maxWidth: 760, display: 'flex', height: 22, gap: '2px' }}>
        {groups.flatMap(group => group.parts).map(part => (
          <Box key={part.key} sx={{ width: `${(part.amount / total) * 100}%`, minWidth: 3, borderRadius: '2px', ...part.fill }} />
        ))}
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 5, rowGap: 1, mt: 1, maxWidth: 760 }}>
        {groups.map(group => (
          <Box key={group.key}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{group.name} {dollars(group.amount)}</Typography>
            <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
              {group.parts.map(part => (
                <Box component="li" key={part.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                  {swatch(part)}
                  <Typography variant="body2">
                    {isMobile ? part.shortName : part.name} <Box component="span" sx={{ fontWeight: 600 }}>{dollars(part.amount)}</Box>
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </>
  );
};

interface SpecialEducationAidCalculationProps {
  districtName: string;
  schoolYear: string;
  row: StateAidRow;
  aidYear?: SpedAidYear;
  district?: DistrictSpedAid;
  /** The first year the DOE's aid by district is loaded for */
  firstYear?: number;
}

const SpecialEducationAidCalculation: React.FC<SpecialEducationAidCalculationProps> = ({ districtName, schoolYear, row, aidYear, district, firstYear }) => {
  const sentence = (text: string) => <Typography variant="body1" sx={PROSE_WIDTH}>{text}</Typography>;
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));
  return (
    <Box component="section" aria-labelledby="special-education-aid-title">
      <ChartHeader titleId="special-education-aid-title" title="How the Special Education Aid Is Figured" />
      {aidYear ? (
        <>
          {/* Who paid for its high-cost students, or that it had none; then the rule */}
          {district
            ? <WhoPaid aidYear={aidYear} district={district} districtName={districtName} isMobile={isMobile} />
            : sentence(`${districtName} reported no students whose ${aidYear.cost_school_year} costs passed ${formatDollars(aidYear.threshold_cost)}, so it received no special education aid in ${schoolYear}.`)}
          <Typography variant="body1" sx={{ mt: 2, ...PROSE_WIDTH }}>{spedAidSentence(aidYear, districtName, schoolYear, isMobile)}</Typography>
          {district && (
            <StepsFold label="Show Every Step">
              <CalculationTable rows={spedAidRows(aidYear, district)} label={`${districtName}'s special education aid calculation, ${schoolYear}`} />
            </StepsFold>
          )}
        </>
      ) : row.spedSource === 'reported' ? (
        sentence(`${firstYear ? `The DOE's special education aid by district starts here with ${formatSchoolYear(firstYear)}. ` : ''}${districtName}'s ${schoolYear} financial report shows ${formatDollars(row.sped ?? 0)} in special education aid.`)
      ) : (
        sentence(`The DOE hasn't published special education aid for ${schoolYear} yet.${row.estimates.sped
          ? ` ${estimateNote(row.estimates.sped, row.sped ?? 0)}`
          : ''}`)
      )}
    </Box>
  );
};

export default SpecialEducationAidCalculation;
