import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// The harness first: it loads the store, which the pages' modules expect to exist
import { answerFrom, downloadExcel, renderEntityPage, row, sheet } from './entityPages';
import { store } from '@/store/store';
import { setInflationAdjustment } from '@/store/slices/financeSlice';
import Financials from '@/features/district/components/Financials';

vi.mock('@/services/api/utils/apiUtils', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/services/api/utils/apiUtils')>()), fetchData: vi.fn() }));
vi.mock('@/features/state/utils/excel', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/features/state/utils/excel')>()), downloadWorkbook: vi.fn() }));

const entryType = (id: number, name: string, category: [number, string], superCategory: [number, string]) => ({
  id, name, page: '', account_no: '', line: '', category: { id: category[0], name: category[1], super_category: { id: superCategory[0], name: superCategory[1] } },
});
const ELEMENTARY: [number, string] = [1, 'General Fund - Elementary Expenditures'];
const OTHER_USES: [number, string] = [2, 'General Fund - Other Financing Uses'];
const FUNDS = [{ id: 1, state_name: 'General Fund', state_id: '10' }];
const item = (id: number, entryTypeId: number, value: number) => ({ id, value, entry_type_id: entryTypeId, fund_type_id: 1 });

// Concord's DOE-25 reports for 2022-23 and 2023-24, the year the page shows in tests: $10M spent, 80%
// on instruction, and $10M received, 70% locally
const report = (year: number, expenditures: number[], revenues: number[], balance: number[]) => ({
  doe_form: { id: year, year, date_created: '', date_updated: '', district_id: 111 },
  expenditures: expenditures.map((value, index) => item(year * 10 + index, index + 1, value)),
  revenues: revenues.map((value, index) => item(year * 10 + index, index + 1, value)),
  balance_sheets: balance.map((value, index) => item(year * 10 + index, index + 10, value)),
  adm: { id: year, elementary: 600, middle: 400, high: 0, total: 1000 },
});

beforeEach(() => answerFrom({
  'finance/entry-types': {
    expenditure_entry_types: [
      entryType(1, 'Regular Programs', [1, 'Instruction'], ELEMENTARY),
      entryType(2, 'Special Programs', [1, 'Instruction'], ELEMENTARY),
      entryType(3, 'Student Transportation', [2, 'Support Services'], ELEMENTARY),
      entryType(4, 'Interest', [3, 'Debt Service'], OTHER_USES),
    ],
    revenue_entry_types: [
      entryType(1, 'Taxes', [1, 'Local'], [1, 'Revenue from Local Sources']),
      entryType(2, 'Adequacy', [2, 'State'], [2, 'Revenue from State Sources']),
      entryType(3, 'Title I', [3, 'Federal'], [3, 'Revenue from Federal Sources']),
    ],
    balance_entry_types: [
      entryType(10, 'Cash', [20, 'Current Assets'], [1, 'Assets']),
      entryType(11, 'Bonds Payable', [21, 'Long-Term Liabilities'], [2, 'Liabilities']),
    ],
  },
  'finance/fund-types': { balance_fund_types: FUNDS, revenue_fund_types: FUNDS, expenditure_fund_types: FUNDS },
  'finance/report?district_id=111': [
    report(2023, [5000000, 2000000, 1000000, 0], [6000000, 2000000, 0], [2500000, 5500000]),
    report(2024, [6000000, 2000000, 1000000, 1000000], [7000000, 2500000, 500000], [3000000, 5000000]),
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
}));

afterEach(() => {
  store.dispatch(setInflationAdjustment(false));
});

describe('Financials download', () => {
  it("saves every tab's figures for every year, beside New Hampshire's", async () => {
    await renderEntityPage('district', <Financials />);
    const { fileName, sheets } = await downloadExcel();

    expect(fileName).toBe('concord-school-district-financials.xlsx');
    expect(sheets.map(entry => entry.name)).toEqual([
      'Spending By Year', 'Spending Breakdown', 'Revenue By Year', 'Cost Per Student',
      'Expenditure Breakdown', 'Revenue Breakdown', 'Assets Breakdown', 'Liabilities Breakdown', 'Notes',
    ]);
    // The latest year in its own dollars, with the state's total spending
    expect(row(sheet(sheets, 'Spending By Year'), '2023-24')).toEqual(['2023-24', 10000000, 8000000, 1000000, 10000000, 2000000000]);
    expect(row(sheet(sheets, 'Spending By Year'), '2022-23').slice(0, 4)).toEqual(['2022-23', 8000000, 7000000, 1000000]);

    // Shares and cost per student, the district's beside the state's (1,000 and 100,000 students)
    const breakdown = sheet(sheets, 'Spending Breakdown');
    expect(row(breakdown, 'Instruction')).toEqual(['Instruction', 0.8, 0.8, 8000, 16000]);
    expect(row(breakdown, '    Transportation')).toEqual(['    Transportation', 0.1, 0.15, 1000, 3000]);
    expect(row(breakdown, '    Debt Service')).toEqual(['    Debt Service', 0.1, 0.05, 1000, 1000]);
    expect(breakdown.subtotalRows).toEqual([0, 5, 13]);

    // Revenue by source, then each source's share beside the state's
    expect(row(sheet(sheets, 'Revenue By Year'), '2023-24')).toEqual(['2023-24', 10000000, 7000000, 2500000, 500000, 0, 0.7, 0.25, 0.05, 0, 0.6, 0.3, 0.1, 0]);
    const perStudent = sheet(sheets, 'Cost Per Student');
    expect(perStudent.columns.map(column => column.header)).toContain('NH All Grades');
    expect(row(perStudent, '2023-24')).toEqual(['2023-24', 18000, 19000, 0, 18400, 18400, 18500, 18000, 19000, 18600, 18600]);

    // Every line in both years, in the page's order: elementary instruction first, largest first
    const expenditures = sheet(sheets, 'Expenditure Breakdown');
    expect(expenditures.columns.slice(3).map(column => column.header)).toEqual(['2022-23', '2023-24']);
    expect(expenditures.rows.map(entry => entry[2])).toEqual(['Regular Programs', 'Special Programs', 'Student Transportation', 'Interest']);
    expect(expenditures.rows[0]).toEqual(['Elementary Expenditures', 'Instruction', 'Regular Programs', 5000000, 6000000]);
    expect(expenditures.rows[3]).toEqual(['Other Financing Uses', 'Debt Service', 'Interest', 0, 1000000]);
    expect(expenditures.totalRow).toEqual(['Total', null, null, 8000000, 10000000]);
    // Federal, state, then local sources, as the Revenues tab lists them
    expect(sheet(sheets, 'Revenue Breakdown').rows.map(entry => entry[2])).toEqual(['Title I', 'Adequacy', 'Taxes']);
    expect(sheet(sheets, 'Assets Breakdown').rows).toEqual([['Assets', 'Current Assets', 'Cash', 2500000, 3000000]]);
    expect(sheet(sheets, 'Liabilities Breakdown').totalRow).toEqual(['Total Liabilities', null, null, 5500000, 5000000]);
    expect(sheet(sheets, 'Notes').subtitle).toBe('Financials for Concord School District');
  });

  it('offers the download with the inflation-adjusted title too', async () => {
    store.dispatch(setInflationAdjustment(true));
    await renderEntityPage('district', <Financials />);
    const { fileName } = await downloadExcel();

    expect(fileName).toBe('concord-school-district-financials.xlsx');
  });
});
