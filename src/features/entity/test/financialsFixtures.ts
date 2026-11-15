// The Financials page's API answers for Concord School District (111), shared by its tests: DOE-25
// reports for 2022-23 and 2023-24, the year the page shows in tests ($10M spent, 80% on instruction; in
// 2023-24, $13.5M received, $6M of it from the state), New Hampshire's figures, and Concord's adequacy and
// special education aid.

const entryType = (id: number, name: string, category: [number, string], superCategory: [number, string]) => ({
  id, name, page: '', account_no: '', line: '', category: { id: category[0], name: category[1], super_category: { id: superCategory[0], name: superCategory[1] } },
});
const ELEMENTARY: [number, string] = [1, 'General Fund - Elementary Expenditures'];
const OTHER_USES: [number, string] = [2, 'General Fund - Other Financing Uses'];
const FUNDS = [{ id: 1, state_name: 'General Fund', state_id: '10' }];
const item = (id: number, entryTypeId: number, value: number) => ({ id, value, entry_type_id: entryTypeId, fund_type_id: 1 });

const report = (year: number, expenditures: number[], revenues: number[], balance: number[]) => ({
  doe_form: { id: year, year, date_created: '', date_updated: '', district_id: 111 },
  expenditures: expenditures.map((value, index) => item(year * 10 + index, index + 1, value)),
  revenues: revenues.map((value, index) => item(year * 10 + index, index + 1, value)),
  balance_sheets: balance.map((value, index) => item(year * 10 + index, index + 10, value)),
  adm: { id: year, elementary: 600, middle: 400, high: 0, total: 1000 },
});

export const FINANCE_FIXTURES: Record<string, unknown> = {
  'finance/entry-types': {
    expenditure_entry_types: [
      entryType(1, 'Regular Programs', [1, 'Instruction'], ELEMENTARY),
      entryType(2, 'Special Programs', [1, 'Instruction'], ELEMENTARY),
      entryType(3, 'Student Transportation', [2, 'Support Services'], ELEMENTARY),
      entryType(4, 'Interest', [3, 'Debt Service'], OTHER_USES),
    ],
    revenue_entry_types: [
      entryType(1, 'Taxes', [1, 'Local'], [1, 'Revenue from Local Sources']),
      entryType(2, 'Adequacy Aid Grant', [2, 'Unrestricted Grants-In-Aid'], [2, 'Revenue from State Sources']),
      entryType(3, 'Title I', [3, 'Federal'], [3, 'Revenue from Federal Sources']),
      entryType(4, 'Statewide Enhanced Education Tax', [2, 'Unrestricted Grants-In-Aid'], [2, 'Revenue from State Sources']),
      entryType(5, 'Special Education Aid', [4, 'Restricted Grants-In-Aid'], [2, 'Revenue from State Sources']),
      entryType(6, 'School Building Aid', [4, 'Restricted Grants-In-Aid'], [2, 'Revenue from State Sources']),
    ],
    balance_entry_types: [
      entryType(10, 'Cash', [20, 'Current Assets'], [1, 'Assets']),
      entryType(11, 'Bonds Payable', [21, 'Long-Term Liabilities'], [2, 'Liabilities']),
    ],
  },
  'finance/fund-types': { balance_fund_types: FUNDS, revenue_fund_types: FUNDS, expenditure_fund_types: FUNDS },
  'finance/report?district_id=111': [
    report(2023, [5000000, 2000000, 1000000, 0], [6000000, 2000000, 0], [2500000, 5500000]),
    // State revenue in 2023-24: $2.5M adequacy aid (the DOE calculated $2M), $3M SWEPT, $120,000 special
    // education aid and $380,000 building aid
    report(2024, [6000000, 2000000, 1000000, 1000000], [7000000, 2500000, 500000, 3000000, 120000, 380000], [3000000, 5000000]),
  ],
  'finance/per-pupil/district?district_id=111': [
    { id: 1, year: 2023, elementary: 17000, middle: 18000, high: 0, total: 17500, district_id: 111, date_created: '', date_updated: '' },
    { id: 2, year: 2024, elementary: 18000, middle: 19000, high: 0, total: 18400, district_id: 111, date_created: '', date_updated: '' },
  ],
  // New Hampshire in 2023-24: $2B spent, 80% on instruction; 100,000 students; revenue 60% local
  'finance/per-pupil/state': [
    { id: 1, year: 2023, elementary: 17500, middle: 17000, high: 18000, total: 17600, date_created: '', date_updated: '' },
    { id: 2, year: 2024, elementary: 18500, middle: 18000, high: 19000, total: 18600, date_created: '', date_updated: '' },
  ],
  'finance/state-expenditure-rollup': [{ id: 1, year: 2023, total: 1900000000 }, { id: 2, year: 2024, total: 2000000000 }],
  'finance/state-expenditure': [
    { id: 1, year: 2024, entry_type_id: 1, value: 1200000000 },
    { id: 2, year: 2024, entry_type_id: 2, value: 400000000 },
    { id: 3, year: 2024, entry_type_id: 3, value: 300000000 },
    { id: 4, year: 2024, entry_type_id: 4, value: 100000000 },
  ],
  'finance/state-revenue': [
    { id: 1, year: 2024, entry_type_id: 1, value: 6000 },
    { id: 2, year: 2024, entry_type_id: 2, value: 3000 },
    { id: 3, year: 2024, entry_type_id: 3, value: 1000 },
  ],
  'finance/state-adm': [
    { year: 2023, elementary: 50500, middle: 25250, high: 25250, total: 101000 },
    { year: 2024, elementary: 50000, middle: 25000, high: 25000, total: 100000 },
  ],
};

// -------------------- Adequacy aid --------------------

const step = (stepNo: number, code: string, name: string, role: string, value: number, formula: string | null, inputs: Record<string, number>, citation: string) => ({
  step: stepNo, code, name, unit: 'dollars', role, value, formula, inputs, explanation: `How ${name.toLowerCase()} is figured`, citation,
});

/**
 * A town's calculation: students at the base and free or reduced-price meal rates make the cost, the
 * SWEPT comes off it, and a hold-harmless grant goes on
 */
export const townCalculation = (
  town: [number, string],
  rates: { base: number; frl: number },
  students: { resident: number; frl: number },
  swept: number,
  holdHarmless: number,
  share: { grant: number; swept: number; of: number | null } | null = null,
) => {
  const base = students.resident * rates.base;
  const frl = students.frl * rates.frl;
  const cost = base + frl;
  const preliminary = Math.max(0, cost - swept);
  const grant = preliminary + holdHarmless;
  return {
    town_id: town[0],
    town_name: town[1],
    share: share
      ? { adequacy_grant: share.grant, swept_retained: share.swept, source: 'doe_split', share_of_town: share.of }
      : { adequacy_grant: grant, swept_retained: swept, source: 'whole_town', share_of_town: 1 },
    town_totals: { adequacy_grant: grant, swept, total_state_aid: grant + swept },
    steps: [
      step(1, 'base_adequacy_aid', 'Base adequacy aid', 'cost', base, 'resident_adm_base * base_per_pupil',
        { base_per_pupil: rates.base, resident_adm_base: students.resident }, 'RSA 198:40-a, II(a)'),
      step(2, 'frl_differentiated_aid', 'Free or reduced-price meal aid', 'cost', frl, 'frl_adm * frl_per_pupil',
        { frl_adm: students.frl, frl_per_pupil: rates.frl }, 'RSA 198:40-a, II(b)'),
      step(3, 'total_cost_adequate_education', 'Cost of an adequate education', 'cost_total', cost, 'base_adequacy_aid + frl_differentiated_aid',
        { base_adequacy_aid: base, frl_differentiated_aid: frl }, 'RSA 198:40-a'),
      step(4, 'swept', 'Statewide education property tax (SWEPT)', 'swept', swept, null, {}, 'RSA 76:3'),
      step(5, 'preliminary_grant', 'Preliminary grant', 'result', preliminary, 'max(0, total_cost_adequate_education - swept)',
        { swept, total_cost_adequate_education: cost }, 'RSA 198:41, I'),
      step(6, 'hold_harmless_grant', 'Hold-harmless grant', 'hold_harmless', holdHarmless, null, {}, 'RSA 198:41, I(d)'),
      step(7, 'adequacy_grant', 'Adequacy grant', 'result', grant, 'preliminary_grant + hold_harmless_grant',
        { hold_harmless_grant: holdHarmless, preliminary_grant: preliminary }, 'RSA 198:42'),
      step(8, 'final_total_state_grant', 'Total state aid', 'result', grant + swept, 'adequacy_grant + swept',
        { adequacy_grant: grant, swept }, 'DOE workbook'),
    ],
    values: {
      resident_adm_base: students.resident, frl_adm: students.frl, base_adequacy_aid: base, frl_differentiated_aid: frl,
      total_cost_adequate_education: cost, swept, preliminary_grant: preliminary, hold_harmless_grant: holdHarmless,
      adequacy_grant: grant, final_total_state_grant: grant + swept, equalized_valuation: swept * 1000,
    },
  };
};

type TownCalculation = ReturnType<typeof townCalculation>;

/** A district's year: its towns' shares of their aid, and the grant its financial report shows */
export const districtYear = (fiscalYear: number, status: 'final' | 'estimate', asOf: string, towns: TownCalculation[], reported: number | null) => {
  const grant = towns.reduce((sum, town) => sum + town.share.adequacy_grant, 0);
  const swept = towns.reduce((sum, town) => sum + town.share.swept_retained, 0);
  return {
    fiscal_year: fiscalYear,
    school_year: `${fiscalYear - 1}-${String(fiscalYear).slice(-2)}`,
    status,
    as_of: asOf,
    district_id: 111,
    district_name: 'Concord',
    adequacy_grant: grant,
    swept_retained: swept,
    total_state_aid: grant + swept,
    member_towns: towns.length,
    reported_adequacy_grant: reported,
    reported_difference: reported === null ? null : reported - grant,
    towns,
  };
};

const CONCORD_TOWN: [number, string] = [111, 'Concord'];

// Concord's aid: 2023-24, final and as its report shows it ($4.79M cost less $3M SWEPT, plus $210,000
// hold-harmless: a $2M grant), and the DOE's estimate for 2024-25
export const CONCORD_STATE_AID = [
  districtYear(2024, 'final', '2024-04-01', [townCalculation(CONCORD_TOWN, { base: 4100, frl: 2300 }, { resident: 1000, frl: 300 }, 3000000, 210000)], 2000000),
  districtYear(2025, 'estimate', '2024-10-01', [townCalculation(CONCORD_TOWN, { base: 4182, frl: 2346 }, { resident: 950, frl: 300 }, 3100000, 123300)], null),
];

const part = (code: string, name: string, unit: string, role: string) => ({ code, name, description: '', unit, role });

/** A year's formula: its rates, and the names and units of its parts (the same for every year in tests) */
export const AID_FORMULA = {
  year: {
    fiscal_year: 2025,
    school_year: '2024-25',
    status: 'estimate',
    as_of: '2024-10-01',
    summary_url: 'https://www.education.nh.gov/adequacy-fy25.xlsx',
    split_url: 'https://www.education.nh.gov/adequacy-fy25-split.xlsx',
    explained_url: 'https://www.education.nh.gov/fy25-explained.pdf',
  },
  parameters: [
    { code: 'base_per_pupil', name: 'Base adequacy per student', value: 4182, unit: 'dollars_per_pupil', citation: 'RSA 198:40-a', source_url: '' },
    { code: 'frl_per_pupil', name: 'Extra per free or reduced-price meal student', value: 2346, unit: 'dollars_per_pupil', citation: 'RSA 198:40-a', source_url: '' },
  ],
  steps: [],
  components: [
    part('resident_adm_base', 'Resident students (ADM)', 'count', 'students'),
    part('frl_adm', 'Free or reduced-price meal students', 'count', 'students'),
    part('base_adequacy_aid', 'Base adequacy aid', 'dollars', 'cost'),
    part('frl_differentiated_aid', 'Free or reduced-price meal aid', 'dollars', 'cost'),
    part('total_cost_adequate_education', 'Cost of an adequate education', 'dollars', 'cost_total'),
    part('swept', 'Statewide education property tax (SWEPT)', 'dollars', 'swept'),
    part('preliminary_grant', 'Preliminary grant', 'dollars', 'result'),
    part('hold_harmless_grant', 'Hold-harmless grant', 'dollars', 'hold_harmless'),
    part('adequacy_grant', 'Adequacy grant', 'dollars', 'result'),
    part('final_total_state_grant', 'Total state aid', 'dollars', 'result'),
    part('equalized_valuation', 'Equalized valuation', 'dollars', 'basis'),
  ],
};

const spedBand = (band: number, from: number, to: number | null, share: number, label: string) => ({
  band, label, from_multiple: from, to_multiple: to, state_share: share, citation: 'RSA 186-C:18, III(a)', source_url: '',
});
const SPED_BANDS = [
  spedBand(1, 0, 3.5, 0, 'Paid by the district (up to 3.5 times the state average)'),
  spedBand(2, 3.5, 10, 0.8, '3.5 to 10 times the state average: 80% state aid'),
  spedBand(3, 10, null, 1, 'Over 10 times the state average: 100% state aid'),
];

/** Special education aid paid in 2023-24 on 2022-23 costs, prorated to 80%; 2024-25's isn't published */
export const SPED_AID_YEARS = [{
  fiscal_year: 2024,
  cost_school_year: '2022-23',
  status: 'final',
  state_average_cost: 19034.08,
  threshold_cost: 66619.28,
  appropriation: 33917000,
  proration_rate: 0.8,
  minimum_share: null,
  aid_paid: 33917000,
  source_url: 'https://www.education.nh.gov/fy24-sped-aid.pdf',
  bands: SPED_BANDS,
}];

/** Concord's: two students' costs up to the threshold, $187,500 between 3.5 and 10 times, $120,000 paid */
export const CONCORD_SPED_AID = [{
  district_id: 111,
  fiscal_year: 2024,
  cost_school_year: '2022-23',
  total_cost: 320738.56,
  cost_below_threshold: 133238.56,
  cost_above_threshold: 187500,
  entitlement: 150000,
  aid_paid: 120000,
  bands: [
    { band: 1, label: SPED_BANDS[0].label, state_share: 0, cost: 133238.56 },
    { band: 2, label: SPED_BANDS[1].label, state_share: 0.8, cost: 187500 },
    { band: 3, label: SPED_BANDS[2].label, state_share: 1, cost: 0 },
  ],
}];

export const STATE_AID_FIXTURES: Record<string, unknown> = {
  'finance/adequacy-aid/district/111/calculation': CONCORD_STATE_AID,
  'finance/adequacy-aid/formula': AID_FORMULA,
  'finance/special-education-aid/years': SPED_AID_YEARS,
  'finance/special-education-aid/district?district_id=111': CONCORD_SPED_AID,
};
