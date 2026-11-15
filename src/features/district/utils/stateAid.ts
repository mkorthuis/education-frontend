import type { ProcessedReport } from '@/store/slices/financeSlice';
import { formatCount, formatDollars, formatSchoolYear } from '@/features/state/utils/stateMetrics';
import { titleCase } from '@/features/state/utils/labels';
import { CONTEXT_COLOR } from '@/features/state/components/TrendChart';
import { READING_WIDTH, series } from '@/theme/tokens';
import { projectInflation } from '@/utils/calculations';
import { listNames } from './labels';

// New Hampshire's adequacy aid, as the DOE calculates it for each town and splits it among the town's
// school districts: the cost of an adequate education, less the statewide education property tax
// (SWEPT) the town raises and keeps, plus added aid and hold-harmless grants. The API's figures are
// the DOE's own; the formulas show how each follows from the ones before it.

export type AidStatus = 'final' | 'estimate';

/** What a part of the calculation is: an aid line, the SWEPT, a subtotal, or a figure used along the way */
export type AidRole = 'students' | 'cost' | 'cost_total' | 'swept' | 'added_aid' | 'hold_harmless' | 'result' | 'basis';

export interface AidYear {
  /** The year ending: 2027 is the 2026-27 school year, as the financial reports count years */
  fiscal_year: number;
  school_year: string;
  /** Estimate until the DOE's final calculation in April */
  status: AidStatus;
  as_of: string;
  summary_url: string;
  split_url: string | null;
  explained_url: string | null;
}

export interface AidParameter {
  code: string;
  name: string;
  value: number;
  unit: string;
  citation: string;
  source_url: string;
}

/** A part of the calculation: resident_adm_base, swept, adequacy_grant, ... */
export interface AidPart {
  code: string;
  name: string;
  description: string;
  /** count, dollars, dollars_per_pupil, fraction, dollars_per_thousand or dollars_per_dollar */
  unit: string;
  role: AidRole;
}

/** A year's rates, its steps, and the names and units of the parts it uses */
export interface AidFormula {
  year: AidYear;
  parameters: AidParameter[];
  steps: (AidPart & { step: number; formula: string | null; uses: string[]; explanation: string; citation: string })[];
  components: AidPart[];
}

/** A step of a town's calculation, with the town's figures */
export interface AidLine {
  step: number;
  code: string;
  name: string;
  unit: string;
  role: AidRole;
  /** The DOE's published figure */
  value: number;
  formula: string | null;
  /** Each name the formula uses: the town's figure or the year's rate */
  inputs: Record<string, number>;
  explanation: string;
  citation: string;
}

export interface AidTownCalculation {
  town_id: number;
  town_name: string;
  /** What this district receives of the town's aid */
  share: {
    adequacy_grant: number;
    swept_retained: number;
    /** doe_split: the DOE's split of a town among its districts; whole_town: the town's one district */
    source: 'doe_split' | 'whole_town';
    /** Of the town's grant plus SWEPT */
    share_of_town: number | null;
  };
  town_totals: { adequacy_grant: number; swept: number; total_state_aid: number };
  steps: AidLine[];
  /** Every figure the DOE published for the town and year */
  values: Record<string, number>;
}

export interface DistrictAidYear {
  fiscal_year: number;
  school_year: string;
  status: AidStatus;
  as_of: string;
  district_id: number;
  district_name: string;
  /** Paid by the state, from all member towns */
  adequacy_grant: number;
  /** The statewide education property tax kept locally */
  swept_retained: number;
  total_state_aid: number;
  member_towns: number;
  /** "Adequacy Aid Grant" in the district's financial report (DOE-25), when it has one for the year */
  reported_adequacy_grant: number | null;
  /** Reported minus calculated */
  reported_difference: number | null;
  towns: AidTownCalculation[];
}

// Special education aid (catastrophic aid until 2017; RSA 186-C:18, III): a district pays each high-cost
// student's costs up to a threshold, a multiple of the state average cost per pupil, and the state pays a share
// of the costs in each band above it, prorated when the appropriation falls short. Aid paid in a fiscal year
// is on the year before's costs.

export interface SpedAidBand {
  /** 1 is the lowest, which the district pays in full */
  band: number;
  label: string;
  from_multiple: number;
  to_multiple: number | null;
  state_share: number;
  citation: string;
  source_url: string;
}

export interface SpedAidYear {
  fiscal_year: number;
  /** The school year whose costs it pays for: 2023-24 for aid paid in 2024-25 */
  cost_school_year: string;
  status: AidStatus;
  /** The DOE's estimate of the state average cost per pupil */
  state_average_cost: number;
  /** The cost per student where state aid begins */
  threshold_cost: number;
  appropriation: number | null;
  /** Aid paid as a share of entitlement; 1 when paid in full */
  proration_rate: number;
  /** The least share of its entitlement a district gets when aid is prorated */
  minimum_share: number | null;
  aid_paid: number;
  source_url: string;
  bands: SpedAidBand[];
}

export interface DistrictSpedAid {
  district_id: number;
  fiscal_year: number;
  cost_school_year: string;
  /** Its costs for the students it reported */
  total_cost: number;
  /** What it pays in full: up to the threshold for each student */
  cost_below_threshold: number;
  /** The costs the state shares */
  cost_above_threshold: number;
  /** The state's share of its costs above the threshold */
  entitlement: number;
  /** Its entitlement, prorated when the appropriation falls short */
  aid_paid: number;
  bands: { band: number; label: string; state_share: number; cost: number }[];
}

/** A district's state aid by year, the years' formulas, its special education aid, and whether they've loaded */
export interface DistrictStateAid {
  status: 'loading' | 'ready' | 'unavailable';
  years: DistrictAidYear[];
  formulas: Record<number, AidFormula>;
  /** The years the DOE has published special education aid for; none when it couldn't be loaded */
  spedYears: SpedAidYear[];
  /** The district's special education aid in those years; a year it's missing from, it reported no high-cost students */
  sped: DistrictSpedAid[];
}

// The DOE calls the adequacy grant plus the SWEPT "total state aid"; the tab's total is all the state's aid
const LINE_NAMES: Record<string, string> = { final_total_state_grant: 'Adequacy Grant Plus SWEPT' };

/** A step's name on the tab */
export const lineName = (line: Pick<AidLine, 'code' | 'name'>): string => LINE_NAMES[line.code] ?? titleCase(line.name);

/** One color per figure, on the State Aid tab's chart and in its calculations' bars: the four parts in the
 * chart's order (series 1 to 3, after the brand blue), and Other in grey */
export const AID_COLORS = { grant: series[1], swept: series[2], sped: series[3], other: CONTEXT_COLOR };

/** Text at a reading width, except in the tab's two columns on wide screens, where the column sets it */
export const PROSE_WIDTH = { maxWidth: { xs: READING_WIDTH, lg: 'none' } } as const;

export type AidPartKey = 'grant' | 'swept' | 'sped' | 'other';

/** The four parts in the chart's order: their names, the chart legend's shorter ones, and on phones the shortest */
export const AID_PARTS: { key: AidPartKey; name: string; legendName: string; phoneName: string; color: string }[] = [
  { key: 'grant', name: 'Adequacy Grant', legendName: 'Adequacy Grant', phoneName: 'Grant', color: AID_COLORS.grant },
  { key: 'swept', name: 'SWEPT', legendName: 'SWEPT', phoneName: 'SWEPT', color: AID_COLORS.swept },
  { key: 'sped', name: 'Special Education Aid', legendName: 'Special Ed.', phoneName: 'Special Ed.', color: AID_COLORS.sped },
  { key: 'other', name: 'Other State Aid', legendName: 'Other', phoneName: 'Other', color: AID_COLORS.other },
];

// -------------------- The state revenue in the district's financial report --------------------

/** The DOE-25's category of the state aid the Revenues tab and the Overall tab's revenue card show */
const STATE_SOURCES = 'Revenue from State Sources';

/** The DOE-25 lines the State Aid tab calculates; every other state line is Other */
export const NAMED_STATE_LINES = {
  grant: 'Adequacy Aid Grant',
  swept: 'Statewide Enhanced Education Tax',
  sped: 'Special Education Aid',
} as const;

/** Those lines' names, which the Revenues tab links to the State Aid tab from */
export const NAMED_STATE_LINE_NAMES = new Set<string>(Object.values(NAMED_STATE_LINES));

/** A report's state revenue, line by line (each line's funds together), largest first */
export const stateRevenueLines = (report: ProcessedReport): { name: string; value: number }[] => {
  const lines = new Map<string, number>();
  report.revenues
    .filter(revenue => revenue.entry_type.category?.super_category?.name === STATE_SOURCES)
    .forEach(revenue => lines.set(revenue.entry_type.name, (lines.get(revenue.entry_type.name) ?? 0) + revenue.value));
  return [...lines].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
};

/** How the year's special education aid figure was found */
export type SpedSource =
  /** The DOE's published aid */
  | 'doe'
  /** The DOE published the year and the district isn't in it: it reported no high-cost students */
  | 'none_reported'
  /** The DOE's file isn't loaded for the year (2019-20); the district's financial report's line */
  | 'reported'
  /** Neither: not published yet, and no financial report */
  | 'unknown';

/** A year of the district's state aid: the four parts, and their total */
export interface StateAidRow {
  year: number;
  grant: number;
  swept: number;
  /** Null when it isn't known yet */
  sped: number | null;
  spedSource: SpedSource;
  /**
   * The rest of the state revenue in its financial report: its state total less the adequacy grant, SWEPT and
   * special education aid. Where the report books one of those differently from the DOE's figure, the difference
   * is here too, so the parts always add up to the report. Null without a report.
   */
  other: number | null;
  /** The parts' total: its financial report's state revenue when it has one, and the parts otherwise */
  total: number;
  /** Whether every part is known, so the total is the report's */
  complete: boolean;
  /** Special education or other aid that isn't in yet, estimated; the part's figure above is the estimate */
  estimates: Partial<Record<AidPartKey, AidEstimate>>;
}

/** A part that isn't in yet, estimated from the latest year it's in, adjusted for inflation */
export interface AidEstimate {
  /** The fiscal year it's from, and its figure there */
  from: number;
  amount: number;
}


/**
 * Each adequacy aid year's state aid: the DOE's adequacy and special education figures, and the report's other
 * aid. In the years after the latest one with special education or other aid, the part is estimated: that
 * year's figure, adjusted for inflation.
 */
export const stateAidRows = (aid: Pick<DistrictStateAid, 'years' | 'spedYears' | 'sped'>, reports: Record<string, ProcessedReport | null | undefined>): StateAidRow[] => {
  const spedPublished = new Set(aid.spedYears.map(year => year.fiscal_year));
  const spedByYear = new Map(aid.sped.map(row => [row.fiscal_year, row.aid_paid]));
  const rows: StateAidRow[] = aid.years.map(entry => {
    const year = entry.fiscal_year;
    const report = reports[year] ?? null;
    const lines = report ? stateRevenueLines(report) : [];
    const reportedSped = lines.find(line => line.name === NAMED_STATE_LINES.sped)?.value ?? 0;
    const [sped, spedSource]: [number | null, SpedSource] = spedByYear.has(year)
      ? [spedByYear.get(year)!, 'doe']
      : spedPublished.has(year)
        ? [0, 'none_reported']
        : report
          ? [reportedSped, 'reported']
          : [null, 'unknown'];
    const stateRevenue = report ? lines.reduce((sum, line) => sum + line.value, 0) : null;
    const other = stateRevenue !== null && sped !== null ? stateRevenue - entry.adequacy_grant - entry.swept_retained - sped : null;
    const complete = other !== null;
    return {
      year,
      grant: entry.adequacy_grant,
      swept: entry.swept_retained,
      sped,
      spedSource,
      other,
      total: complete ? stateRevenue! : entry.adequacy_grant + entry.swept_retained + (sped ?? 0),
      complete,
      estimates: {},
    };
  });

  const latest = (key: 'sped' | 'other') => [...rows].reverse().find(row => row[key] !== null);
  const bases = { sped: latest('sped'), other: latest('other') };
  return rows.map(row => {
    const estimates: StateAidRow['estimates'] = {};
    (['sped', 'other'] as const).forEach(key => {
      const base = bases[key];
      if (base && row[key] === null && row.year > base.year) estimates[key] = { from: base.year, amount: base[key]! };
    });
    if (!estimates.sped && !estimates.other) return row;
    const sped = estimates.sped ? projectInflation(estimates.sped.amount, estimates.sped.from, row.year) : row.sped;
    const other = estimates.other ? projectInflation(estimates.other.amount, estimates.other.from, row.year) : row.other;
    return { ...row, sped, other, total: row.grant + row.swept + (sped ?? 0) + (other ?? 0), estimates };
  });
};

/** "$18.4M", "$7.09M", "$581K", "$950": three significant figures, for a phone's legend */
export const threeFigureDollars = (value: number): string => {
  const sign = value < 0 ? '−' : '';
  const size = Number(Math.abs(value).toPrecision(3));
  if (size < 1e3) return `${sign}$${Math.round(Math.abs(value))}`;
  const [scaled, unit] = size >= 1e9 ? [size / 1e9, 'B'] : size >= 1e6 ? [size / 1e6, 'M'] : [size / 1e3, 'K'];
  return `${sign}$${scaled.toPrecision(3)}${unit}`;
};

/** A year's state aid in four parts, by a factor: with Adjust For Inflation, the years' chart's in the site's fiscal year's dollars */
export const restateRow = (row: StateAidRow, factor: number): StateAidRow => {
  const scale = (value: number | null) => (value === null ? null : value * factor);
  return { ...row, grant: row.grant * factor, swept: row.swept * factor, sped: scale(row.sped), other: scale(row.other), total: row.total * factor };
};

/** "+$95,800", "−$209K": a change with its sign, a true minus */
export const withSign = (value: number, format: (amount: number) => string = formatDollars): string =>
  `${value > 0 ? '+' : '−'}${format(Math.abs(value))}`;

/** "$5.82M", "$581K", "$950": the bars' legends */
export const barDollars = (amount: number): string =>
  (amount >= 1e6 ? `$${(amount / 1e6).toFixed(2)}M` : amount >= 1e3 ? `$${Math.round(amount / 1e3)}K` : formatDollars(amount));

/** What an estimate is from: "The estimate here, $1,327,951, is 2025-26's $1,281,762 adjusted for inflation." */
export const estimateNote = (estimate: AidEstimate, value: number): string =>
  `The estimate here, ${formatDollars(value)}, is ${formatSchoolYear(estimate.from)}'s ${formatDollars(estimate.amount)} adjusted for inflation.`;

/** Whether any of the year's parts is estimated */
export const hasEstimate = (row: StateAidRow): boolean => Boolean(row.estimates.sped || row.estimates.other);

const upTo = (value: number, digits: number) => value.toLocaleString('en-US', { maximumFractionDigits: digits });

/**
 * A figure in its unit: "926.66" students, "$4,031,917", "$3,708.78" per student (a rate with cents),
 * "80%", "$1.03 per $1,000" of valuation, or a plain factor ("0.00221069").
 */
export const formatAidValue = (value: number, unit: string | undefined): string => {
  switch (unit) {
    case 'count':
      return upTo(value, 2);
    case 'dollars':
      return formatDollars(value);
    case 'dollars_per_pupil':
      // Rates have cents in some years; valuations per student are whole dollars
      return Math.abs(value) < 10000 && !Number.isInteger(value)
        ? `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : formatDollars(value);
    case 'fraction':
      return `${upTo(value * 100, 2)}%`;
    case 'dollars_per_thousand':
      return `$${upTo(value, 3)} per $1,000`;
    default:
      return upTo(value, 9);
  }
};

/** Each code a year's formulas use, with its name and unit: its parts and its rates */
export const aidNames = (formula: AidFormula | undefined): Record<string, { name: string; unit: string }> => {
  if (!formula) return {};
  const names: Record<string, { name: string; unit: string }> = {};
  formula.components.forEach(part => { names[part.code] = { name: part.name, unit: part.unit }; });
  formula.parameters.forEach(parameter => { names[parameter.code] = { name: parameter.name, unit: parameter.unit }; });
  return names;
};

const PRODUCT = /^\s*[a-z_][a-z0-9_]*(\s*\*\s*[a-z_][a-z0-9_]*)+\s*$/i;

/** A product's figures, for the line itself: "926.66 × $4,351"; null for any other formula */
export const productArithmetic = (line: AidLine, names: Record<string, { unit: string }>): string | null => {
  if (!line.formula || !PRODUCT.test(line.formula)) return null;
  const codes = line.formula.split('*').map(code => code.trim());
  if (codes.some(code => !(code in line.inputs))) return null;
  return codes.map(code => formatAidValue(line.inputs[code], names[code]?.unit)).join(' × ');
};

/** A call's arguments, split at its own commas, from the "(" at `open` to its ")" */
const callArguments = (text: string, open: number): { args: string[]; close: number } => {
  const args: string[] = [];
  let depth = 0;
  let current = '';
  for (let index = open; index < text.length; index += 1) {
    const char = text[index];
    if (char === '(' && depth++ === 0) continue;
    if (char === ')' && --depth === 0) return { args: [...args, current.trim()], close: index };
    if (char === ',' && depth === 1) {
      args.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  return { args: [...args, current.trim()], close: text.length };
};

const FUNCTION_CALL = /\b(max|min|clamp)\(/;

/**
 * max, min and clamp in words ("the larger of 0 and ...", "..., kept between 0 and ..."), in brackets
 * where more of the formula follows; a comparison in brackets, the 1 or 0 it counts as
 */
const inWords = (formula: string): string => {
  const call = FUNCTION_CALL.exec(formula);
  if (!call) {
    return formula.replace(/\(([^()]+?)\s*(<=|>=|<|>)\s*([^()]+?)\)/g, '(1 if $1 $2 $3, otherwise 0)');
  }
  const { args, close } = callArguments(formula, call.index + call[1].length);
  const parts = args.map(inWords);
  const phrase = call[1] === 'clamp'
    ? `${parts[0]}, kept between ${parts[1]} and ${parts[2]}`
    : `the ${call[1] === 'max' ? 'larger' : 'smaller'} of ${parts.join(' and ')}`;
  const whole = call.index === 0 && close === formula.length - 1;
  const before = formula.slice(0, call.index);
  const after = formula.slice(close + 1);
  return inWords(before) + (whole ? phrase : `(${phrase})`) + inWords(after);
};

/** A formula with each code named: "Resident students (ADM) × Base adequacy per student" */
export const readableFormula = (formula: string, names: Record<string, { name: string }>): string =>
  inWords(formula.trim())
    .replace(/\b[a-z_][a-z0-9_]*\b/gi, code => names[code]?.name ?? code)
    .replace(/\s\*\s/g, ' × ')
    .replace(/\s-\s/g, ' − ')
    .replace(/<=/g, '≤')
    .replace(/>=/g, '≥');

/** A step's bar in the calculation's waterfall: from the running total before it to the one after */
export interface AidBar {
  from: number;
  to: number;
  /** A subtotal or result from zero, or a step up or down */
  kind: 'total' | 'up' | 'down';
}

/**
 * The calculation as a waterfall: the aid lines build the cost, the SWEPT comes off it, added aid and
 * hold-harmless grants go on, and each subtotal (the cost, the preliminary grant, the grant) starts
 * again from zero. The preliminary grant is never below zero, so where the SWEPT is more than the
 * cost the running total jumps back up to it. Student counts and figures used along the way have no bar.
 */
export const aidWaterfall = (lines: AidLine[]): (AidBar | null)[] => {
  let running = 0;
  return lines.map(line => {
    switch (line.role) {
      case 'cost':
      case 'added_aid':
      case 'hold_harmless': {
        const from = running;
        running += line.value;
        return { from, to: running, kind: line.value < 0 ? 'down' : 'up' };
      }
      case 'swept': {
        const from = running;
        running -= line.value;
        return { from, to: running, kind: 'down' };
      }
      case 'cost_total':
      case 'result':
        running = line.value;
        return { from: 0, to: line.value, kind: 'total' };
      default:
        return null;
    }
  });
};

/** The town's SWEPT covers its whole cost of an adequate education */
export const sweptCoversCost = (town: AidTownCalculation): boolean =>
  (town.values.swept ?? 0) >= (town.values.total_cost_adequate_education ?? 0);

// -------------------- Explaining the adequacy aid --------------------

// One sentence carries it: the state decides what an adequate education costs for the town's students; the
// town pays part through the statewide education property tax (SWEPT); the state pays the rest, and adds
// cushions so aid can't fall too fast.

/** The extra rates' students, as the cost line's sentence names them */
const EXTRA_GROUPS: Record<string, string> = {
  frl_differentiated_aid: 'low-income',
  sped_differentiated_aid: 'special education',
  ell_differentiated_aid: 'English-learner',
  grade3_reading_differentiated_aid: 'grade 3 reading',
};

// The cost line's own, shorter names, where they differ
const COST_GROUPS: Record<string, string> = { ...EXTRA_GROUPS, sped_differentiated_aid: 'special ed.' };

// On phones, the groups as nouns: "72 fewer low-income, 12 more special ed., 10 fewer English learners"
const PHONE_GROUPS: Record<string, string> = { ...COST_GROUPS, ell_differentiated_aid: 'English learners' };

/** Plain names for the aid added to the cost (extraordinary need) and the cushions; the DOE's name for any other */
const EXTRA_NAMES: Record<string, string> = {
  hold_harmless_grant: "Cushion So Aid Doesn't Fall Too Fast Year over Year",
  hold_harmless_95pct_grant: 'Guarantee of 95% of the Earlier Estimate',
  swept_hold_harmless_grant: 'Cushion for the 2023 SWEPT Cut',
  stabilization_grant: 'Stabilization: A Cushion from the 2012 Formula Change',
  extraordinary_need_grant: 'Extraordinary Need Grant',
  fiscal_capacity_disparity_aid: 'Fiscal Capacity Disparity Aid',
};

/** On phones, in the change's details: "Extraordinary need −$4.71M; 95% guarantee +$1.46M" */
const PHONE_EXTRA_NAMES: Record<string, string> = {
  hold_harmless_grant: 'Cushion',
  hold_harmless_95pct_grant: '95% guarantee',
  swept_hold_harmless_grant: 'SWEPT cushion',
  stabilization_grant: 'Stabilization',
  extraordinary_need_grant: 'Extraordinary need',
  fiscal_capacity_disparity_aid: 'Disparity aid',
};

const shortDollars = (value: number): string => {
  const size = Math.abs(value);
  const sign = value < 0 ? '−' : '';
  if (size >= 1e9) return `${sign}$${(size / 1e9).toFixed(2).replace(/\.?0+$/, '')}B`;
  if (size >= 1e6) return `${sign}$${(size / 1e6).toFixed(2).replace(/\.?0+$/, '')}M`;
  if (size >= 1e4) return `${sign}$${Math.round(size / 1e3)}K`;
  return `${sign}${formatDollars(size)}`;
};

/** A product step's count and rate: the input counted in students, and the other */
const countAndRate = (line: AidLine, names: Record<string, { unit: string }>): { count: string; rate: string } | null => {
  const codes = Object.keys(line.inputs);
  if (codes.length !== 2 || !line.formula || !PRODUCT.test(line.formula)) return null;
  const count = codes.find(code => names[code]?.unit === 'count' || code.endsWith('_adm'));
  const rate = codes.find(code => code !== count);
  return count && rate ? { count, rate } : null;
};

/**
 * The sliding-scale grants in the town's own numbers: why it gets them, then its amount per student times its
 * students ("$3,908 × 1,380 low-income students"). Null without the town's count, for the DOE's own
 * explanation instead.
 */
const SLIDING_SCALES: Record<string, { count: string; who: string; why: string }> = {
  extraordinary_need_grant: {
    count: 'frl_adm', who: 'low-income student', why: 'Extra aid for towns with a high number of low-income students and low property values',
  },
  fiscal_capacity_disparity_aid: {
    count: 'resident_adm_base', who: 'student', why: 'Extra aid for towns with little property to tax for each student',
  },
};

const slidingScaleDetail = (line: AidLine, town: AidTownCalculation): string | null => {
  const scale = SLIDING_SCALES[line.code];
  const count = scale && town.values[scale.count];
  if (!scale || !count) return null;
  return `${scale.why}: ${formatDollars(line.value / count)} × ${formatCount(count)} ${scale.who}s.`;
};

export interface EquationLine {
  key: string;
  label: string;
  /** On phones, where it's shorter */
  shortLabel?: string;
  detail?: string;
  value: number;
  /** The value per resident student */
  perStudent: number | null;
  /**
   * need: aid the DOE adds to the cost before the SWEPT comes off (extraordinary need); extra: cushions on top;
   * floor: where the SWEPT is more than the cost, the part past it, since the grant can't go below $0
   */
  kind: 'cost' | 'need' | 'extra' | 'swept' | 'floor' | 'grant';
}

/**
 * A town's adequacy aid as one equation: what an adequate education costs for its students, plus the extra
 * need the DOE adds (extraordinary need) and the cushions, less the SWEPT it raises and keeps, is its grant.
 * Where the SWEPT is more than the cost, the part past it is a line after it, since the grant can't go below
 * $0. The lines add up to the DOE's grant: any other difference is a line too.
 */
export const adequacyEquation = (town: AidTownCalculation, formula?: AidFormula): EquationLine[] => {
  const names = aidNames(formula);
  const values = town.values;
  const students = values.resident_adm_base ?? null;
  const per = (value: number) => (students ? value / students : null);
  const cost = values.total_cost_adequate_education ?? 0;
  const swept = values.swept ?? 0;
  const grant = values.adequacy_grant ?? 0;

  // The cost: every student at the base rate, plus the extra rates' students
  const base = town.steps.find(line => line.code === 'base_adequacy_aid');
  const baseParts = base && countAndRate(base, names);
  const extras = town.steps
    .filter(line => line.role === 'cost' && EXTRA_GROUPS[line.code])
    .flatMap(line => {
      const parts = countAndRate(line, names);
      const count = parts ? line.inputs[parts.count] : 0;
      return count >= 0.5 ? [`${formatCount(count)} ${COST_GROUPS[line.code]}`] : [];
    });
  const costDetail = baseParts
    ? `${formatCount(base!.inputs[baseParts.count])} students × ${formatAidValue(base!.inputs[baseParts.rate], 'dollars_per_pupil')}${extras.length ? `, plus extra for ${listNames(extras)} students` : ''}`
    : undefined;

  // The SWEPT: the year's rate on the town's property value
  const rate = formula?.parameters.find(parameter => parameter.code === 'swept_rate')?.value;
  const valuation = values.equalized_valuation;
  const sweptDetail = rate
    ? `$${rate.toFixed(2)} per $1,000${valuation ? ` on ${shortDollars(valuation)} of property` : ' of property value'}`
    : undefined;

  // Aid the DOE adds before its preliminary grant (extraordinary need, disparity and relief aid) is part of what
  // the SWEPT is measured against; the rest (stabilization, hold-harmless) are cushions on top
  const preliminary = town.steps.findIndex(line => line.code === 'preliminary_grant');
  const added = (line: AidLine, index: number): EquationLine => ({
    key: line.code,
    label: EXTRA_NAMES[line.code] ?? titleCase(line.name),
    detail: slidingScaleDetail(line, town) ?? line.explanation,
    value: line.value,
    perStudent: per(line.value),
    kind: line.role === 'added_aid' && preliminary >= 0 && index < preliminary ? 'need' : 'extra',
  });
  const additions = town.steps
    .map((line, index) => ((line.role === 'added_aid' || line.role === 'hold_harmless') && Math.abs(line.value) >= 0.5 ? added(line, index) : null))
    .filter((line): line is EquationLine => line !== null);
  const need = additions.filter(line => line.kind === 'need');
  const spare = swept - cost - need.reduce((sum, line) => sum + line.value, 0);
  const lines: EquationLine[] = [
    { key: 'cost', label: 'Adequate Education Cost in NH', shortLabel: 'Adequate Education Cost', detail: costDetail, value: cost, perStudent: per(cost), kind: 'cost' },
    ...need,
    ...additions.filter(line => line.kind === 'extra'),
  ];
  const floor: EquationLine | null = spare > 0
    ? { key: 'floor', label: 'No Grant Below $0', detail: `The SWEPT covers the whole cost, with ${formatDollars(spare)} to spare`, value: spare, perStudent: per(spare), kind: 'floor' }
    : null;
  const shown = lines.reduce((sum, line) => sum + line.value, 0) - swept + (floor?.value ?? 0);
  if (Math.abs(grant - shown) >= 1) {
    lines.push({ key: 'adjustment', label: 'Other Adjustments', detail: 'Including the rule that the grant before the cushions can\'t go below $0', value: grant - shown, perStudent: per(grant - shown), kind: 'extra' });
  }
  lines.push({ key: 'swept', label: `${town.town_name} Raises for Schools (SWEPT)`, detail: sweptDetail, value: -swept, perStudent: per(-swept), kind: 'swept' });
  if (floor) lines.push(floor);
  lines.push({ key: 'grant', label: 'Adequacy Grant', value: grant, perStudent: per(grant), kind: 'grant' });
  return lines;
};

export interface AidChangeEffect {
  key: 'students' | 'rates' | 'swept' | 'extras' | 'other';
  label: string;
  detail?: string;
  /** On phones, where they're shorter */
  shortLabel?: string;
  shortDetail?: string;
  value: number;
}

export interface AidChange {
  from: number;
  to: number;
  effects: AidChangeEffect[];
  /** The change in resident students, for a district of one whole town */
  students: number | null;
}

const extraTotal = (town: AidTownCalculation) =>
  town.steps.filter(line => line.role === 'added_aid' || line.role === 'hold_harmless').reduce((sum, line) => sum + line.value, 0);

/**
 * Why a district's adequacy grant changed between two years, in four parts that add up to the change: its
 * towns' students (the change in each group's count, at the later year's rates), the rates and rules (the rest
 * of the change in the cost), the SWEPT they raise, and the cushions and extra aid. A town split among
 * districts counts at the district's share of its grant in the later year. Anything else (the grant's floor
 * at $0, a change in the split) is a fifth part, so the parts always add up.
 */
export const adequacyChange = (from: DistrictAidYear, to: DistrictAidYear, formulas: Record<number, AidFormula>): AidChange => {
  const namesFrom = aidNames(formulas[from.fiscal_year]);
  const namesTo = aidNames(formulas[to.fiscal_year]);
  const totals = { students: 0, rates: 0, swept: 0, extras: 0 };
  const extraChanges = new Map<string, number>();
  // Each extra rate's students: 20 more low-income
  const groupChanges: { code: string; counted: number }[] = [];
  to.towns.forEach(town => {
    const before = from.towns.find(entry => entry.town_id === town.town_id);
    if (!before) return;
    const share = town.town_totals.adequacy_grant > 0
      ? town.share.adequacy_grant / town.town_totals.adequacy_grant
      : town.share.share_of_town ?? 1;
    // Students: each group's count change at the later year's rate, for the groups in both years
    let students = 0;
    town.steps.filter(line => line.role === 'cost').forEach(line => {
      const parts = countAndRate(line, namesTo);
      const earlier = before.steps.find(entry => entry.code === line.code);
      const earlierParts = earlier && countAndRate(earlier, namesFrom);
      if (!parts || !earlier || !earlierParts) return;
      const counted = line.inputs[parts.count] - earlier.inputs[earlierParts.count];
      students += counted * line.inputs[parts.rate];
      if (EXTRA_GROUPS[line.code] && Math.abs(counted) >= 1) groupChanges.push({ code: line.code, counted });
    });
    const costChange = (town.values.total_cost_adequate_education ?? 0) - (before.values.total_cost_adequate_education ?? 0);
    totals.students += students * share;
    totals.rates += (costChange - students) * share;
    totals.swept -= ((town.values.swept ?? 0) - (before.values.swept ?? 0)) * share;
    totals.extras += (extraTotal(town) - extraTotal(before)) * share;
    // Each cushion's change, across the towns
    new Set([...town.steps, ...before.steps]
      .filter(line => line.role === 'added_aid' || line.role === 'hold_harmless')
      .map(line => line.code))
      .forEach(code => {
        const now = town.steps.find(line => line.code === code)?.value ?? 0;
        const then = before.steps.find(line => line.code === code)?.value ?? 0;
        extraChanges.set(code, (extraChanges.get(code) ?? 0) + (now - then) * share);
      });
  });

  // The details: how many students (for a district of one whole town), the base rate, the property value and
  // SWEPT rate, the cushions that moved
  const one = (year: DistrictAidYear) => (year.towns.length === 1 ? year.towns[0] : null);
  const [townFrom, townTo] = [one(from), one(to)];
  const wholeTown = townFrom?.share.source === 'whole_town' && townTo?.share.source === 'whole_town' && townFrom.town_id === townTo.town_id;
  const studentChange = wholeTown ? (townTo!.values.resident_adm_base ?? 0) - (townFrom!.values.resident_adm_base ?? 0) : null;
  const baseRate = (town: AidTownCalculation | null) => town?.steps.find(line => line.code === 'base_adequacy_aid')?.inputs.base_per_pupil;
  const sweptRate = (year: DistrictAidYear) => formulas[year.fiscal_year]?.parameters.find(parameter => parameter.code === 'swept_rate')?.value;
  const [rateFrom, rateTo] = [baseRate(townFrom), baseRate(townTo)];
  const [valueFrom, valueTo] = [townFrom?.values.equalized_valuation, townTo?.values.equalized_valuation];
  const [sweptFrom, sweptTo] = [sweptRate(from), sweptRate(to)];
  const percent = (now: number, then: number) => `${Math.abs(Math.round(((now - then) / then) * 100))}%`;
  const sweptDetail = [
    valueFrom && valueTo ? `Property value ${valueTo >= valueFrom ? 'up' : 'down'} ${percent(valueTo, valueFrom)}` : null,
    sweptFrom && sweptTo && sweptFrom !== sweptTo ? `rate ${sweptTo < sweptFrom ? 'down' : 'up'} from $${sweptFrom.toFixed(2)} to $${sweptTo.toFixed(2)} per $1,000` : null,
  ].filter(Boolean).join('; ');
  // On phones: "Value up 15%; rate down to $1.22 per $1,000"
  const sweptShort = [
    valueFrom && valueTo ? `Value ${valueTo >= valueFrom ? 'up' : 'down'} ${percent(valueTo, valueFrom)}` : null,
    sweptFrom && sweptTo && sweptFrom !== sweptTo ? `rate ${sweptTo < sweptFrom ? 'down' : 'up'} to $${sweptTo.toFixed(2)} per $1,000` : null,
  ].filter(Boolean).join('; ');
  const moved = [...extraChanges].filter(([, value]) => Math.abs(value) >= 0.5);
  const movedExtras = moved.map(([code, value]) => `${EXTRA_NAMES[code] ?? titleCase(code.replace(/_/g, ' '))} ${withSign(value)}`);
  const movedShort = moved.map(([code, value]) => `${PHONE_EXTRA_NAMES[code] ?? EXTRA_NAMES[code] ?? titleCase(code.replace(/_/g, ' '))} ${withSign(value, threeFigureDollars)}`);
  // "103 fewer resident students; 72 fewer low-income students", or on phones "103 fewer students, 72 fewer low-income"
  const counts = (counted: number, what: string) => `${formatCount(Math.abs(Math.round(counted)))} ${counted <= 0 ? 'fewer' : 'more'} ${what}`;

  // Fewer students lower the cost, but more of them with extra rates (low-income, special education) raise it;
  // the label says which way the students moved only when the money moved the same way
  const fewer = studentChange !== null ? studentChange < 0 : totals.students < 0;
  const studentsLabel = (studentChange === null || Math.round(studentChange) !== 0) && fewer === (totals.students < 0)
    ? (fewer ? 'Fewer Students' : 'More Students')
    : 'Students and Their Needs';
  const effects: AidChangeEffect[] = [
    {
      key: 'students',
      label: studentsLabel,
      detail: studentChange !== null
        ? [counts(studentChange, 'resident students'), ...groupChanges.map(group => counts(group.counted, `${EXTRA_GROUPS[group.code]} students`))].join('; ')
        : 'Changes in its towns\' resident students and their needs',
      shortDetail: studentChange !== null
        ? [counts(studentChange, 'students'), ...groupChanges.map(group => counts(group.counted, PHONE_GROUPS[group.code]))].join(', ')
        : 'Changes in students and their needs',
      value: totals.students,
    },
    {
      key: 'rates',
      label: 'Rates Set by the Legislature',
      detail: rateFrom && rateTo && rateFrom !== rateTo ? `The base rate ${rateTo > rateFrom ? 'rose' : 'fell'} from ${formatAidValue(rateFrom, 'dollars_per_pupil')} to ${formatAidValue(rateTo, 'dollars_per_pupil')} per student, and the extra rates with it` : 'The rates per student and the rules for the cost',
      shortLabel: "Legislature's Rates",
      shortDetail: rateFrom && rateTo && rateFrom !== rateTo ? `Base rate ${rateTo > rateFrom ? 'up' : 'down'} from ${formatDollars(rateFrom)} to ${formatDollars(rateTo)}` : 'Rates and rules',
      value: totals.rates,
    },
    {
      key: 'swept',
      label: totals.swept <= 0 ? 'More Statewide Property Tax Raised in Town' : 'Less Statewide Property Tax Raised in Town',
      detail: sweptDetail || undefined,
      shortLabel: totals.swept <= 0 ? 'More SWEPT Raised' : 'Less SWEPT Raised',
      shortDetail: sweptShort || undefined,
      value: totals.swept,
    },
    {
      key: 'extras',
      label: 'Cushions and Extra Aid',
      detail: movedExtras.length ? movedExtras.join('; ') : undefined,
      shortDetail: movedShort.length ? movedShort.join('; ') : undefined,
      value: totals.extras,
    },
  ];
  const other = (to.adequacy_grant - from.adequacy_grant) - effects.reduce((sum, effect) => sum + effect.value, 0);
  if (Math.abs(other) >= 1) {
    effects.push({
      key: 'other',
      label: 'Other Changes',
      detail: 'The grant before the cushions can\'t go below $0, and the DOE\'s split of a town among its districts can change',
      shortDetail: 'The grant\'s $0 floor, and town splits',
      value: other,
    });
  }
  return { from: from.adequacy_grant, to: to.adequacy_grant, effects: effects.filter(effect => Math.abs(effect.value) >= 0.5), students: studentChange };
};

/** "Conway's adequacy grant fell $479K from 2025-26 to 2026-27. The biggest reason: 54 fewer students (−$393K)." */
export const changeSentence = (district: string, change: AidChange, fromYear: string, toYear: string): string => {
  const difference = change.to - change.from;
  const steady = Math.abs(difference) < 0.5;
  const biggest = change.effects.filter(effect => effect.key !== 'other').sort((a, b) => Math.abs(b.value) - Math.abs(a.value))[0];
  const opening = steady
    ? `${district}'s adequacy grant stayed the same from ${fromYear} to ${toYear}`
    : `${district}'s adequacy grant ${difference > 0 ? 'rose' : 'fell'} ${shortDollars(Math.abs(difference))} from ${fromYear} to ${toYear}.`;
  if (!biggest) return steady ? `${opening}.` : opening;
  const studentsMoved = change.students !== null && Math.round(change.students) !== 0 && (change.students < 0) === (biggest.value < 0);
  const reason = {
    students: studentsMoved
      ? `${formatCount(Math.abs(Math.round(change.students!)))} ${change.students! < 0 ? 'fewer' : 'more'} students`
      : biggest.value <= 0 ? 'changes in its students and their needs' : 'more students with extra needs',
    rates: biggest.value >= 0 ? 'higher rates set by the legislature' : 'lower rates set by the legislature',
    swept: biggest.value <= 0 ? 'more statewide property tax raised in town' : 'less statewide property tax raised in town',
    extras: biggest.value >= 0 ? 'more cushion and extra aid' : 'less cushion and extra aid',
    other: '',
  }[biggest.key];
  const amount = withSign(biggest.value, shortDollars);
  return steady
    ? `${opening}: ${reason} (${amount}) offset the other changes.`
    : `${opening} The biggest reason: ${reason} (${amount}).`;
};

/** Resident students per year, for a district of one whole town every year; null otherwise */
export const residentStudents = (years: DistrictAidYear[]): Map<number, number> | null => {
  const single = years.every(year => year.towns.length === 1 && year.towns[0].share.source === 'whole_town' && (year.towns[0].values.resident_adm_base ?? 0) > 0);
  return single ? new Map(years.map(year => [year.fiscal_year, year.towns[0].values.resident_adm_base])) : null;
};

/** The DOE-25's other state lines, in a line each */
export const OTHER_LINE_NOTES: Record<string, string> = {
  'School Building Aid': 'The state\'s share of payments on school construction debt',
  'Kindergarten Building Aid': 'The state\'s share of building kindergarten space',
  'Keno-Kindergarten Aid': 'Kindergarten aid paid from keno revenue',
  'Child Nutrition': 'The state\'s match for school meals',
  'Vocational Education (Tuition)': 'Tuition for students at regional career and technical centers',
  'Vocational Education (Transportation)': 'Transportation to regional career and technical centers',
  'Vocational Education (Building)': 'Building aid for career and technical centers',
  'Vocational Education (Robotics)': 'Grants for robotics teams',
  'Adult Education': 'Adult education programs',
  'Driver Education': 'Driver education',
  'School Improvement Aid': 'School improvement grants',
  'Shared Revenue': 'State revenue shared with towns',
  'Other State Aid': 'Other unrestricted state aid, as the district booked it',
  'Other Restricted State Aid': 'Other state grants for a set purpose, as the district booked them',
  'Public Inter Agencies': 'Payments from other public agencies',
  'Revenue in Lieu of Taxes': 'Payments in place of property taxes',
  'Revenue for/on behalf of LEA': 'Payments the state made on the district\'s behalf',
};
