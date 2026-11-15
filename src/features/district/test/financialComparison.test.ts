import { describe, expect, it } from 'vitest';
import type { ProcessedReport } from '@/store/slices/financeSlice';
import { calculateInflationAdjustedAmount } from '@/utils/calculations';
import {
  prepareDetailedAssetsComparisonData,
  prepareDetailedExpenditureComparisonData,
  prepareDetailedLiabilitiesComparisonData,
  prepareDetailedRevenueComparisonData,
} from '../utils/financialDataProcessing';

// The Revenues, Expenditures and Balance Sheet tabs compare a year's lines with another year's. Every
// line in either year is a row, so each year's column adds up to its report.

const item = (entryTypeId: number, name: string, category: [number, string], superCategory: [number, string], value: number, fund = 1) => ({
  id: entryTypeId * 100 + fund,
  value,
  entry_type: { id: entryTypeId, name, page: '', account_no: '', line: '', category: { id: category[0], name: category[1], super_category: { id: superCategory[0], name: superCategory[1] } } },
  fund_type: { id: fund, state_id: '', state_name: '' },
});

const report = (parts: Partial<Pick<ProcessedReport, 'revenues' | 'expenditures' | 'balance_sheets'>>) =>
  ({ revenues: [], expenditures: [], balance_sheets: [], adm: { id: 1, elementary: 0, middle: 0, high: 0, total: 0 }, ...parts } as unknown as ProcessedReport);

const total = (rows: { currentValue: number; previousValue: number }[], field: 'currentValue' | 'previousValue') =>
  rows.reduce((sum, row) => sum + row[field], 0);

const STATE: [number, string] = [2, 'Revenue from State Sources'];
const LOCAL: [number, string] = [1, 'Revenue from Local Sources'];
const UNRESTRICTED: [number, string] = [10, 'Unrestricted Grants-In-Aid'];
const RESTRICTED: [number, string] = [11, 'Restricted Grants-In-Aid'];

describe('Comparison tables', () => {
  it('lists a revenue line that ended, one that started, and one renamed on the form', () => {
    // Conway: building aid ends after 2023-24; a new grant starts in 2024-25; special education aid was
    // "catastrophic aid" (another entry type) on earlier forms
    const before = report({
      revenues: [
        item(40, 'Adequacy Aid Grant', UNRESTRICTED, STATE, 2603652),
        item(44, 'School Building Aid', RESTRICTED, STATE, 1059832),
        item(201747, 'Special Education Aid', RESTRICTED, STATE, 90000),
        item(1, 'Taxes', [1, 'Assessments'], LOCAL, 17000000),
      ] as any,
    });
    const after = report({
      revenues: [
        item(40, 'Adequacy Aid Grant', UNRESTRICTED, STATE, 2603652),
        item(57, 'Other Restricted State Aid', RESTRICTED, STATE, 4114),
        item(47, 'Special Education Aid', RESTRICTED, STATE, 8218),
        item(1, 'Taxes', [1, 'Assessments'], LOCAL, 18000000),
      ] as any,
    });
    const rows = prepareDetailedRevenueComparisonData(after, before, false, 2025, 2024);
    const row = (name: string) => rows.find(entry => entry.name === name);

    expect(row('School Building Aid')).toMatchObject({ currentValue: 0, previousValue: 1059832, difference: -1059832, percentChange: -100 });
    expect(row('Other Restricted State Aid')).toMatchObject({ currentValue: 4114, previousValue: 0, percentChange: 0 });
    expect(row('Special Education Aid')).toMatchObject({ currentValue: 8218, previousValue: 90000 });
    // Each column adds up to its year's report
    expect(total(rows, 'previousValue')).toBe(2603652 + 1059832 + 90000 + 17000000);
    expect(total(rows, 'currentValue')).toBe(2603652 + 4114 + 8218 + 18000000);
    // The line that ended sorts below the others in its group, as having nothing this year
    const restricted = rows.filter(entry => entry.subCategory === 'Restricted Grants-In-Aid').map(entry => entry.name);
    expect(restricted[restricted.length - 1]).toBe('School Building Aid');
  });

  it('restates a line that ended in the current year\'s dollars too', () => {
    const before = report({ revenues: [item(44, 'School Building Aid', RESTRICTED, STATE, 1000000)] as any });
    const after = report({ revenues: [item(40, 'Adequacy Aid Grant', UNRESTRICTED, STATE, 500000)] as any });
    const rows = prepareDetailedRevenueComparisonData(after, before, true, 2025, 2024);
    expect(rows.find(entry => entry.name === 'School Building Aid')?.previousValue).toBe(calculateInflationAdjustedAmount(1000000, 2024, 2025));
  });

  it('lists a spending line that ended, keeping food service under its school level', () => {
    const ELEMENTARY: [number, string] = [1, 'General Fund - Elementary Expenditures'];
    const FOOD: [number, string] = [9, 'Food Service Operations'];
    const before = report({
      expenditures: [
        item(1, 'Regular Programs', [1, 'Instruction'], ELEMENTARY, 5000000),
        item(5, 'School Administration', [2, 'Support Services'], ELEMENTARY, 447),
        item(90, 'Elementary Food Service', [20, 'Food Service'], FOOD, 300000),
      ] as any,
    });
    const after = report({ expenditures: [item(1, 'Regular Programs', [1, 'Instruction'], ELEMENTARY, 5200000)] as any });
    const rows = prepareDetailedExpenditureComparisonData(after, before, false, 2025, 2024);

    expect(rows.find(entry => entry.name === 'School Administration')).toMatchObject({ currentValue: 0, previousValue: 447 });
    expect(rows.find(entry => entry.name === 'Food Service Operations')).toMatchObject({
      category: 'Elementary Expenditures', subCategory: 'Support Services', currentValue: 0, previousValue: 300000,
    });
    expect(total(rows, 'previousValue')).toBe(5300447);
  });

  it('lists balance sheet lines that ended, assets and liabilities apart', () => {
    const ASSETS: [number, string] = [1, 'Assets'];
    const LIABILITIES: [number, string] = [2, 'Liabilities'];
    const before = report({
      balance_sheets: [
        item(1, 'Cash', [1, 'Current Assets'], ASSETS, 3000000),
        item(7, 'Bond Proceeds Receivable', [1, 'Current Assets'], ASSETS, 250000),
        item(15, 'Bond and Interest Payable', [2, 'Current Liabilities'], LIABILITIES, 100000),
      ] as any,
    });
    const after = report({ balance_sheets: [item(1, 'Cash', [1, 'Current Assets'], ASSETS, 3500000)] as any });

    const assets = prepareDetailedAssetsComparisonData(after, before, false, 2025, 2024);
    expect(assets.map(entry => [entry.name, entry.currentValue, entry.previousValue])).toEqual([
      ['Cash', 3500000, 3000000],
      ['Bond Proceeds Receivable', 0, 250000],
    ]);
    const liabilities = prepareDetailedLiabilitiesComparisonData(after, before, false, 2025, 2024);
    expect(liabilities.map(entry => [entry.name, entry.currentValue, entry.previousValue])).toEqual([['Bond and Interest Payable', 0, 100000]]);
    // Without a comparison year, the current year's lines alone
    expect(prepareDetailedAssetsComparisonData(after, null, false, 2025, 2024).map(entry => entry.name)).toEqual(['Cash']);
  });
});
