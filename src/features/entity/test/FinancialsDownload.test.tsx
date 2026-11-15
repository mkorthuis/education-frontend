import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// The harness first: it loads the store, which the pages' modules expect to exist
import { answerFrom, downloadExcel, renderEntityPage, row, sheet } from './entityPages';
import { store } from '@/store/store';
import { setInflationAdjustment } from '@/store/slices/financeSlice';
import Financials from '@/features/district/components/Financials';
import { FINANCE_FIXTURES, STATE_AID_FIXTURES } from './financialsFixtures';

// The report's state revenue lines, which the Revenues tab lists and the State Aid tab explains
const STATE_LINES = ['Adequacy Aid Grant', 'Statewide Enhanced Education Tax', 'Special Education Aid', 'School Building Aid'];

vi.mock('@/services/api/utils/apiUtils', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/services/api/utils/apiUtils')>()), fetchData: vi.fn() }));
vi.mock('@/features/state/utils/excel', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/features/state/utils/excel')>()), downloadWorkbook: vi.fn() }));

beforeEach(() => answerFrom({ ...FINANCE_FIXTURES, ...STATE_AID_FIXTURES }));

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
    expect(row(sheet(sheets, 'Revenue By Year'), '2023-24')).toEqual([
      '2023-24', 13500000, 7000000, 6000000, 500000, 0, 7000000 / 13500000, 6000000 / 13500000, 500000 / 13500000, 0, 0.6, 0.3, 0.1, 0,
    ]);
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
    // Federal, state, then local sources, as the Revenues tab lists them; its state lines are the state aid,
    // as reported: the State Aid tab's own sheets aren't in the download
    const revenues = sheet(sheets, 'Revenue Breakdown');
    const stateLines = revenues.rows.filter(entry => STATE_LINES.includes(entry[2] as string));
    expect(stateLines.map(entry => entry[2]).sort()).toEqual([...STATE_LINES].sort());
    expect(stateLines.reduce((sum, entry) => sum + (entry[4] as number), 0)).toBe(6000000);
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

  it("doesn't wait for the State Aid tab's calculation", async () => {
    answerFrom(FINANCE_FIXTURES);
    await renderEntityPage('district', <Financials />);
    const { sheets } = await downloadExcel();

    expect(sheets.map(entry => entry.name)).not.toContain('State Aid By Year');
    expect(sheet(sheets, 'Revenue Breakdown').rows.map(entry => entry[2])).toContain('Adequacy Aid Grant');
  });
});
