import { beforeEach, describe, expect, it, vi } from 'vitest';
// The harness first: it loads the store, which the pages' modules expect to exist
import { answerFrom, downloadExcel, renderEntityPage, row, sheet } from './entityPages';
import DistrictOutcomes from '@/features/district/components/Outcomes';
import SchoolOutcomes from '@/features/school/components/Outcomes';

vi.mock('@/services/api/utils/apiUtils', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/services/api/utils/apiUtils')>()), fetchData: vi.fn() }));
vi.mock('@/features/state/utils/excel', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/features/state/utils/excel')>()), downloadWorkbook: vi.fn() }));

const plans = (place: Record<string, number>, year: number, counts: Record<string, number>) =>
  Object.entries(counts).map(([name, value], index) => ({ ...place, id: year * 10 + index, year, value, post_graduation_type: { id: index + 1, name } }));
const exit = (place: Record<string, number>, year: number, students: number, droppedOut: number) => ({
  ...place, id: year, year, adjusted_fall_enrollment: students, earned_hiset: 0, enrolled_in_college: 0, dropped_out: droppedOut, missing: 0,
  annual_early_exit_percentage: 0, four_year_early_exit_percentage: 0, annual_dropout_percentage: droppedOut / students, four_year_dropout_percentage: (droppedOut / students) * 4,
});
// The same figures for the district and its high school; New Hampshire's are the statewide fixtures
const outcomes = (kind: 'district' | 'school', place: Record<string, number>, query: string) => ({
  [`outcome/outcome/graduation-cohort/${kind}${query}`]: [
    { ...place, id: 1, year: 2015, cohort_size: 300, graduate: 246, earned_hiset: 0, dropped_out: 5 },
    { ...place, id: 2, year: 2025, cohort_size: 371, graduate: 271, earned_hiset: 13, dropped_out: 4 },
  ],
  [`outcome/outcome/post-graduation/${kind}${query}`]: [
    ...plans(place, 2015, { '4 Year College': 60, 'Less 4 Year College': 15, Employed: 20, Unknown: 5 }),
    ...plans(place, 2025, { '4 Year College': 40, 'Less 4 Year College': 5, Employed: 20, Unknown: 35 }),
  ],
  [`outcome/outcome/early-exit/${kind}${query}`]: [exit(place, 2024, 1500, 15)],
});

beforeEach(() => answerFrom({
  'outcome/outcome/post-graduation-type': [
    { id: 1, name: '4 Year College', description: '' },
    { id: 2, name: 'Less 4 Year College', description: '' },
    { id: 3, name: 'Employed', description: '' },
    { id: 4, name: 'Unknown', description: '' },
  ],
  ...outcomes('district', { district_id: 111 }, '?district_id=111'),
  ...outcomes('school', { school_id: 20 }, '?school_id=20'),
}));

describe('Graduation / College download', () => {
  it("saves the district's classes, plans and dropout rate beside New Hampshire's", async () => {
    await renderEntityPage('district', <DistrictOutcomes />);
    const { fileName, sheets } = await downloadExcel();

    expect(fileName).toBe('concord-school-district-graduation.xlsx');
    expect(sheets.map(entry => entry.name)).toEqual(['Graduation By Class', 'Plans of the Class of 2025', 'Plans Over Time', 'Annual Dropout Rate', 'Notes']);
    // The class of 2025: 271 of 371 graduated, against 875 of 1,000 statewide
    const classOf2025 = row(sheet(sheets, 'Graduation By Class'), 2025);
    expect(classOf2025.slice(0, 6)).toEqual([2025, 371, 271, 13, 4, 83]);
    expect(classOf2025[6]).toBeCloseTo(271 / 371);
    expect(classOf2025[10]).toBeCloseTo(0.875);
    expect(classOf2025[12]).toBeCloseTo(0.022);
    // Shares of the class's graduates, with the state's: 500 of 1,000 planned a four-year college
    const latestPlans = sheet(sheets, 'Plans of the Class of 2025');
    expect(row(latestPlans, 'Four-Year College')).toEqual(['Four-Year College', 40, 0.4, 0.5]);
    expect(row(latestPlans, 'Unknown')).toEqual(['Unknown', 35, 0.35, null]);
    expect(latestPlans.totalRow).toEqual(['All Graduates', 100, 1, 1]);
    const overTime = sheet(sheets, 'Plans Over Time');
    expect(overTime.columns.map(column => column.header)).toContain('NH Four-Year College');
    expect(row(overTime, 2015).slice(0, 2)).toEqual([2015, 0.6]);
    expect(row(sheet(sheets, 'Annual Dropout Rate'), '2023-24')).toEqual(['2023-24', 1500, 15, 0.01, 0.04, 0.01]);
    expect(sheet(sheets, 'Notes').subtitle).toBe('Graduation / College for Concord School District');
  });

  it("names a school's file and notes after the school", async () => {
    await renderEntityPage('school', <SchoolOutcomes />);
    const { fileName, sheets } = await downloadExcel();

    expect(fileName).toBe('concord-high-school-graduation.xlsx');
    expect(row(sheet(sheets, 'Graduation By Class'), 2025).slice(0, 3)).toEqual([2025, 371, 271]);
    expect(sheet(sheets, 'Notes').subtitle).toBe('Graduation / College for Concord High School');
  });
});
