import { beforeEach, describe, expect, it, vi } from 'vitest';
// The harness first: it loads the store, which the pages' modules expect to exist
import { answerFrom, downloadExcel, renderEntityPage, row, sheet } from './entityPages';
import EducationFreedomAccount from '@/features/district/components/EducationFreedomAccount';
import { efaWorkbook } from '@/features/district/workbooks/efaWorkbook';

vi.mock('@/services/api/utils/apiUtils', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/services/api/utils/apiUtils')>()), fetchData: vi.fn() }));
vi.mock('@/features/state/utils/excel', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/features/state/utils/excel')>()), downloadWorkbook: vi.fn() }));

// Per-student amounts change by year: the base amount was $3,900 in 2025-26 and $4,000 in 2026-27
const ENTRY_TYPES = [
  { id: 1, name: 'Base Aid', description: 'Base Aid', year: 2026, value: 3900 },
  { id: 1, name: 'Base Aid', description: 'Base Aid', year: 2027, value: 4000 },
  { id: 2, name: 'Federal Free & Reduced (F&R) Price Meal Eligible', description: '', year: 2027, value: 1000 },
  { id: 3, name: 'Special Education Aid', description: '', year: 2027, value: 2000 },
];
const entry = (town: number, year: number, type: number, value: number) => ({
  id: town * 100000 + year * 10 + type, town_id: town, year, entry_type_id: type, value, date_created: '', date_updated: '',
});
// Concord and Bow; Bow's students are counted with the district's
const ENTRIES = [
  entry(111, 2026, 1, 50),
  entry(111, 2027, 1, 70), entry(111, 2027, 2, 20), entry(111, 2027, 3, 10),
  entry(112, 2027, 1, 30),
];
const TOWN_ENROLLMENT = [
  { id: 1, town_id: 111, grade_id: 2, year: 2026, enrollment: 1800, grade: { id: 2, name: 'Kindergarten' } },
  { id: 2, town_id: 111, grade_id: 14, year: 2026, enrollment: 1700, grade: { id: 14, name: 'Grade 12' } },
  { id: 3, town_id: 111, grade_id: 2, year: 2027, enrollment: 4000, grade: { id: 2, name: 'Kindergarten' } },
];

beforeEach(() => answerFrom({
  'location/town?district_id=111': [{ id: 111, name: 'Concord' }, { id: 112, name: 'Bow' }],
  'education-freedom-account/entry-type': ENTRY_TYPES,
  'education-freedom-account/entry?district_id=111': ENTRIES,
  'enrollment/town?district_id=111': TOWN_ENROLLMENT,
}));

describe('Education Freedom Accounts download', () => {
  it("saves the district's grants beside New Hampshire's, every year's aid categories, and each town's", async () => {
    await renderEntityPage('district', <EducationFreedomAccount />);
    const { fileName, sheets } = await downloadExcel();

    expect(fileName).toBe('concord-school-district-education-freedom-accounts.xlsx');
    expect(sheets.map(entry => entry.name)).toEqual(['EFA Grants By Year', 'Students and Grants By Year', 'EFA Students By Town', 'Notes']);
    // 2025-26: 50 of 3,500 public school students, against 10,000 of 22,894 statewide (the state fixtures)
    const grants = sheet(sheets, 'EFA Grants By Year');
    expect(grants.columns.map(column => column.header)).toContain('NH % of Public School Enrollment');
    const lastYear = row(grants, '2025-26');
    expect(lastYear.slice(0, 3)).toEqual(['2025-26', 50, 3500]);
    expect(lastYear[3]).toBeCloseTo(50 / 3500);
    expect(lastYear.slice(4, 6)).toEqual([10000, 22894]);
    expect(lastYear[6]).toBeCloseTo(10000 / 22894);
    // 2026-27: Concord's 70 and Bow's 30; no statewide enrollment that year
    expect(row(grants, '2026-27')).toEqual(['2026-27', 100, 4000, 0.025, 12500, null, null]);

    // Each year's categories at that year's amounts, then a bold total counting each student once
    const categories = sheet(sheets, 'Students and Grants By Year');
    expect(categories.rows).toEqual([
      ['2025-26', 'Base Student Aid', 50, 3900, 195000],
      ['2025-26', 'Total', 50, null, 195000],
      ['2026-27', 'Base Student Aid', 100, 4000, 400000],
      ['2026-27', 'Free & Reduced Meal Aid', 20, 1000, 20000],
      ['2026-27', 'Special Education Aid', 10, 2000, 20000],
      ['2026-27', 'Total', 100, null, 440000],
    ]);
    expect(categories.subtotalRows).toEqual([1, 5]);

    const byTown = sheet(sheets, 'EFA Students By Town');
    expect(byTown.rows).toContainEqual(['2026-27', 'Bow', 'Base Student Aid', 30, 4000, 120000]);
    expect(byTown.rows[0]).toEqual(['2025-26', 'Concord', 'Base Student Aid', 50, 3900, 195000]);

    const notes = sheet(sheets, 'Notes');
    expect(notes.subtitle).toBe('Education Freedom Accounts for Concord School District');
    // 2026-27 is the state's preliminary year
    expect(String(notes.rows[0][0])).toContain('2026-27 numbers are preliminary');
  });

  it('leaves out the town sheet for a district of one town', () => {
    const sheets = efaWorkbook({
      name: 'Concord',
      displayName: 'Education Freedom Accounts',
      towns: [{ id: 111, name: 'Concord' }],
      entries: ENTRIES.filter(row => row.town_id === 111),
      stateEntries: [],
      entryTypes: ENTRY_TYPES,
      townEnrollment: [],
      stateTownEnrollment: [],
    });
    expect(sheets.map(entry => entry.name)).toEqual(['EFA Grants By Year', 'Students and Grants By Year', 'Notes']);
    // With no enrollment, no share
    expect(row(sheet(sheets, 'EFA Grants By Year'), '2026-27')).toEqual(['2026-27', 70, null, null, null, null, null]);
  });
});
