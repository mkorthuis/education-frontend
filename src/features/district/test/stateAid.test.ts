import { describe, expect, it } from 'vitest';
import type { ProcessedReport } from '@/store/slices/financeSlice';
import {
  AidFormula, AidLine, aidWaterfall, adequacyChange, adequacyEquation, AidTownCalculation, changeSentence, DistrictAidYear, DistrictSpedAid,
  formatAidValue, hasEstimate, productArithmetic, readableFormula, SpedAidYear, stateAidRows, threeFigureDollars,
} from '../utils/stateAid';
import { spedAidSentence } from '../components/financial/SpecialEducationAidCalculation';
import { AID_FORMULA, districtYear, SPED_AID_YEARS, townCalculation } from '@/features/entity/test/financialsFixtures';
import { projectInflation } from '@/utils/calculations';

const line = (role: AidLine['role'], value: number, formula: string | null = null, inputs: Record<string, number> = {}): AidLine => ({
  step: 0, code: role, name: role, unit: 'dollars', role, value, formula, inputs, explanation: '', citation: '',
});

describe('state aid figures', () => {
  it('shows each figure in its unit', () => {
    expect(formatAidValue(926.6644, 'count')).toBe('926.66');
    expect(formatAidValue(4031916.8, 'dollars')).toBe('$4,031,917');
    expect(formatAidValue(4351, 'dollars_per_pupil')).toBe('$4,351');
    expect(formatAidValue(3708.78, 'dollars_per_pupil')).toBe('$3,708.78');
    // Valuations per student are whole dollars
    expect(formatAidValue(11550306.6415, 'dollars_per_pupil')).toBe('$11,550,307');
    expect(formatAidValue(0.8, 'fraction')).toBe('80%');
    expect(formatAidValue(0.890396656, 'fraction')).toBe('89.04%');
    expect(formatAidValue(1.925, 'dollars_per_thousand')).toBe('$1.925 per $1,000');
    expect(formatAidValue(0.00221069, 'dollars_per_dollar')).toBe('0.00221069');
  });

  it("shows a product's figures, and names any formula's parts", () => {
    const names = { resident_adm_base: { name: 'Resident students (ADM)', unit: 'count' }, base_per_pupil: { name: 'Base adequacy per student', unit: 'dollars_per_pupil' } };
    const base = line('cost', 4031916.8, 'resident_adm_base * base_per_pupil', { base_per_pupil: 4351, resident_adm_base: 926.6644 });
    expect(productArithmetic(base, names)).toBe('926.66 × $4,351');
    expect(productArithmetic(line('result', 1, 'max(0, cost - swept)', { cost: 2, swept: 1 }), names)).toBeNull();
    expect(readableFormula('resident_adm_base * base_per_pupil', names)).toBe('Resident students (ADM) × Base adequacy per student');
    // max, min and clamp in words, and a comparison as the 1 or 0 it counts as
    expect(readableFormula('max(0, cost - swept)', {})).toBe('the larger of 0 and cost − swept');
    expect(readableFormula('max(0, cost - swept) + (swept <= cost)', {})).toBe('(the larger of 0 and cost − swept) + (1 if swept ≤ cost, otherwise 0)');
    expect(readableFormula('frl_adm * clamp(factor * (ceiling - valuation), 0, most)', { frl_adm: { name: 'F&R students' } }))
      .toBe('F&R students × (factor × (ceiling − valuation), kept between 0 and most)');
    expect(readableFormula('max(0, share * level - min(a, b))', {})).toBe('the larger of 0 and share × level − (the smaller of a and b)');
  });

  it('builds the waterfall: the cost up, the SWEPT down, the grant from zero', () => {
    const bars = aidWaterfall([
      line('students', 900),
      line('cost', 4000),
      line('cost', 1000),
      line('cost_total', 5000),
      line('swept', 3500),
      line('added_aid', 0),
      line('result', 1500),
      line('hold_harmless', 300),
      line('result', 1800),
    ]);
    expect(bars).toEqual([
      null,
      { from: 0, to: 4000, kind: 'up' },
      { from: 4000, to: 5000, kind: 'up' },
      { from: 0, to: 5000, kind: 'total' },
      { from: 5000, to: 1500, kind: 'down' },
      { from: 1500, to: 1500, kind: 'up' },
      { from: 0, to: 1500, kind: 'total' },
      { from: 1500, to: 1800, kind: 'up' },
      { from: 0, to: 1800, kind: 'total' },
    ]);
    // A SWEPT above the cost takes the running total below zero; the preliminary grant is zero
    const above = aidWaterfall([line('cost_total', 2000), line('swept', 5000), line('result', 0)]);
    expect(above).toEqual([{ from: 0, to: 2000, kind: 'total' }, { from: 2000, to: -3000, kind: 'down' }, { from: 0, to: 0, kind: 'total' }]);
  });

  it("adds each year's parts up to the state revenue in its financial report", () => {
    const year = (fiscalYear: number, grant: number, swept: number) =>
      ({ fiscal_year: fiscalYear, status: 'final', adequacy_grant: grant, swept_retained: swept } as DistrictAidYear);
    const report = (lines: [string, number][]) => ({
      revenues: [
        ...lines.map(([name, value]) => ({ value, entry_type: { name, category: { name: '', super_category: { name: 'Revenue from State Sources' } } } })),
        { value: 9000000, entry_type: { name: 'Taxes', category: { name: '', super_category: { name: 'Revenue from Local Sources' } } } },
      ],
    } as unknown as ProcessedReport);
    const rows = stateAidRows({
      years: [year(2020, 1000, 3000), year(2021, 1000, 3000), year(2022, 1000, 3000), year(2023, 1000, 3000)],
      spedYears: [{ fiscal_year: 2021 }, { fiscal_year: 2022 }] as SpedAidYear[],
      sped: [{ fiscal_year: 2021, aid_paid: 200 }] as DistrictSpedAid[],
    }, {
      // Before the DOE's special education aid: the report's line
      2020: report([['Adequacy Aid Grant', 1000], ['Statewide Enhanced Education Tax', 3000], ['Special Education Aid', 150], ['School Building Aid', 400]]),
      2021: report([['Adequacy Aid Grant', 1000], ['Statewide Enhanced Education Tax', 3000], ['Special Education Aid', 200], ['Child Nutrition', 50], ['Child Nutrition', 25]]),
      // Published, and the district isn't in it: none; the report books $100 more adequacy aid, which is other
      2022: report([['Adequacy Aid Grant', 1100], ['Statewide Enhanced Education Tax', 3000]]),
    });
    expect(rows.slice(0, 3).map(({ year: fiscalYear, sped, spedSource, other, total, complete }) => ({ fiscalYear, sped, spedSource, other, total, complete }))).toEqual([
      { fiscalYear: 2020, sped: 150, spedSource: 'reported', other: 400, total: 4550, complete: true },
      { fiscalYear: 2021, sped: 200, spedSource: 'doe', other: 75, total: 4275, complete: true },
      { fiscalYear: 2022, sped: 0, spedSource: 'none_reported', other: 100, total: 4100, complete: true },
    ]);
    // No report and no special education aid yet: 2021-22's, adjusted for inflation (CPI 304.7 / 292.7)
    expect(rows[3]).toMatchObject({ sped: 0, spedSource: 'unknown', complete: false, estimates: { sped: { from: 2022, amount: 0 }, other: { from: 2022, amount: 100 } } });
    expect(rows[3].other).toBeCloseTo(100 * 304.7 / 292.7, 6);
    expect(rows[3].total).toBeCloseTo(4000 + 100 * 304.7 / 292.7, 6);
    expect(rows.slice(0, 3).every(row => !hasEstimate(row))).toBe(true);

    // Nothing to estimate from: the parts so far
    const first = stateAidRows({ years: [year(2023, 1000, 3000)], spedYears: [], sped: [] }, {});
    expect(first[0]).toMatchObject({ sped: null, other: null, total: 4000, complete: false, estimates: {} });
  });

  it('inflates an estimate past the CPI table at its last year\'s rate', () => {
    // The table ends with 2026 (333.5, after 2025's 321.9)
    expect(projectInflation(100, 2025, 2026)).toBeCloseTo(100 * 333.5 / 321.9, 6);
    expect(projectInflation(100, 2026, 2027)).toBeCloseTo(100 * 333.5 / 321.9, 6);
    expect(projectInflation(100, 2025, 2027)).toBeCloseTo(100 * (333.5 / 321.9) ** 2, 6);
  });

  it('figures a town\'s aid as one equation that adds up to its grant', () => {
    const town = townCalculation([111, 'Concord'], { base: 4100, frl: 2300 }, { resident: 1000, frl: 300 }, 3000000, 210000) as AidTownCalculation;
    const lines = adequacyEquation(town, AID_FORMULA as AidFormula);
    expect(lines.map(line => [line.kind, line.value, line.perStudent])).toEqual([
      ['cost', 4790000, 4790], ['extra', 210000, 210], ['swept', -3000000, -3000], ['grant', 2000000, 2000],
    ]);
    expect(lines[0].detail).toBe('1,000 students × $4,100, plus extra for 300 low-income students');

    // A SWEPT above the cost: the part past it comes back on after the SWEPT, and the cushion is the whole grant
    const rich = townCalculation([140, 'Dunbarton'], { base: 4182, frl: 2346 }, { resident: 100, frl: 10 }, 900000, 50000) as AidTownCalculation;
    const richLines = adequacyEquation(rich, AID_FORMULA as AidFormula);
    expect(richLines.map(line => line.kind)).toEqual(['cost', 'extra', 'swept', 'floor', 'grant']);
    expect(richLines.find(line => line.kind === 'floor')).toMatchObject({ value: 458340, label: 'No Grant Below $0', detail: 'The SWEPT covers the whole cost, with $458,340 to spare' });
    expect(richLines.slice(0, -1).reduce((sum, line) => sum + line.value, 0)).toBeCloseTo(richLines[richLines.length - 1].value, 6);
    expect(richLines[richLines.length - 1].value).toBe(50000);
  });

  it('breaks a change in the grant into parts that add up to it', () => {
    const formulas = { 2024: AID_FORMULA, 2025: AID_FORMULA } as unknown as Record<number, AidFormula>;
    const year = (fiscalYear: number, rates: { base: number; frl: number }, students: { resident: number; frl: number }, swept: number, cushion: number) =>
      districtYear(fiscalYear, 'final', '', [townCalculation([111, 'Concord'], rates, students, swept, cushion)], null) as unknown as DistrictAidYear;
    const before = year(2024, { base: 4100, frl: 2300 }, { resident: 1000, frl: 300 }, 3000000, 210000);
    const after = year(2025, { base: 4182, frl: 2346 }, { resident: 950, frl: 300 }, 3100000, 123300);
    const change = adequacyChange(before, after, formulas);
    expect(change.effects.map(effect => [effect.key, effect.value])).toEqual([['students', -209100], ['rates', 95800], ['swept', -100000], ['extras', -86700]]);
    expect(change.effects.reduce((sum, effect) => sum + effect.value, 0)).toBe(change.to - change.from);
    expect(changeSentence('Concord', change, '2023-24', '2024-25'))
      .toBe("Concord's adequacy grant fell $300K from 2023-24 to 2024-25. The biggest reason: 50 fewer students (−$209K).");

    // Fewer students, but more low-income ones, cost more: the label says so
    const needier = year(2025, { base: 4100, frl: 2300 }, { resident: 990, frl: 340 }, 3000000, 210000);
    const needs = adequacyChange(before, needier, formulas).effects.find(effect => effect.key === 'students')!;
    expect(needs).toMatchObject({
      label: 'Students and Their Needs', detail: '10 fewer resident students; 40 more low-income students', value: 51000,
      // On phones
      shortDetail: '10 fewer students, 40 more low-income',
    });
    expect(change.effects.find(effect => effect.key === 'rates')).toMatchObject({ shortLabel: "Legislature's Rates", shortDetail: 'Base rate up from $4,100 to $4,182' });
    expect(change.effects.find(effect => effect.key === 'swept')).toMatchObject({ shortLabel: 'More SWEPT Raised' });

    // A grant held steady (its cushion made up for 50 fewer students) says what offset what
    const steady = year(2025, { base: 4100, frl: 2300 }, { resident: 950, frl: 300 }, 3000000, 415000);
    const held = adequacyChange(before, steady, formulas);
    expect(held.to).toBe(held.from);
    expect(changeSentence('Concord', held, '2023-24', '2024-25'))
      .toBe("Concord's adequacy grant stayed the same from 2023-24 to 2024-25: 50 fewer students (−$205K) offset the other changes.");
  });

  it('explains a sliding-scale grant in the town\'s own numbers', () => {
    // Concord in 2024-25: $3,908 for each of its 1,380 low-income students
    const town = townCalculation([111, 'Concord'], { base: 4182, frl: 2346 }, { resident: 3626, frl: 1380.3844 }, 5000000, 0) as AidTownCalculation;
    const grant = 1380.3844 * 3908.1024;
    // Where the DOE has it: before the preliminary grant, which (with the grant) includes it
    town.steps.splice(town.steps.findIndex(entry => entry.code === 'preliminary_grant'), 0, {
      step: 5, code: 'extraordinary_need_grant', name: 'Extraordinary need grant', unit: 'dollars', role: 'added_aid', value: grant,
      formula: 'frl_adm * extraordinary_need_aid_per_frl_adm', inputs: {}, explanation: "The DOE's explanation", citation: 'RSA 198:40-f',
    });
    town.values.adequacy_grant += grant;
    const lines = adequacyEquation(town, AID_FORMULA as AidFormula);
    const line = lines.find(entry => entry.key === 'extraordinary_need_grant')!;
    expect(line.label).toBe('Extraordinary Need Grant');
    // On the cost, and the SWEPT comes off last: the cost and need less the SWEPT is the grant
    expect(lines.map(entry => entry.kind)).toEqual(['cost', 'need', 'swept', 'grant']);
    expect(lines[lines.length - 1].value).toBeCloseTo(lines[0].value + grant - 5000000, 6);
    expect(line.detail).toBe('Extra aid for towns with a high number of low-income students and low property values: $3,908 × 1,380 low-income students.');
    // Without the town's count, the DOE's own explanation
    delete town.values.frl_adm;
    expect(adequacyEquation(town, AID_FORMULA as AidFormula).find(entry => entry.key === 'extraordinary_need_grant')!.detail).toBe("The DOE's explanation");
  });

  it('words the special education rule in the year\'s numbers, shorter on phones', () => {
    const aidYear = SPED_AID_YEARS[0] as unknown as SpedAidYear;
    expect(spedAidSentence(aidYear, 'Concord', '2023-24', true)).toBe(
      "Concord pays a student's first $66,619 (3.5× the state cost per pupil). The state reimburses 80% up to $190,341 (10×) and 100% above. "
      + 'Due to limited funding, it reimbursed only 80% of what it owed on 2022-23 costs.',
    );
    // Paid in full, and a shortfall that would round to 100%
    expect(spedAidSentence({ ...aidYear, proration_rate: 1 }, 'Concord', '2023-24', true)).toMatch(/ In 2023-24, it reimbursed all it owed on 2022-23 costs\.$/);
    expect(spedAidSentence({ ...aidYear, proration_rate: 0.998 }, 'Concord', '2023-24')).toMatch(/reimbursed only 99\.8% of what it owed/);
  });

  it('shortens dollars to three significant figures', () => {
    expect([18419316, 7093067, 580957, 2748531, 8218, 950, 999600, -49459, 0].map(threeFigureDollars))
      .toEqual(['$18.4M', '$7.09M', '$581K', '$2.75M', '$8.22K', '$950', '$1.00M', '−$49.5K', '$0']);
  });
});
