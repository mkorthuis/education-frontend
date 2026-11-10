import { beforeEach, describe, expect, it, vi } from 'vitest';
// The harness first: it loads the store, which the pages' modules expect to exist
import { answerFrom, downloadExcel, renderEntityPage, row, sheet } from './entityPages';
import Staff from '@/features/district/components/Staff';

vi.mock('@/services/api/utils/apiUtils', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/services/api/utils/apiUtils')>()), fetchData: vi.fn() }));
vi.mock('@/features/state/utils/excel', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/features/state/utils/excel')>()), downloadWorkbook: vi.fn() }));

const TEACHER = { id: 1, name: 'Teacher' };
const SUPPORT = { id: 2, name: 'Instruction Support' };
const BACHELOR = { id: 2, name: 'Bachelor' };
const MASTERS = { id: 3, name: 'Masters' };
const BA = { id: 1, name: 'BA', description: "Bachelor's Degree" };
const MA = { id: 2, name: 'MA', description: "Master's Degree" };
const district = { district_id: 111 };

// Concord's staff; New Hampshire's are the statewide fixtures, except its salary bands
beforeEach(() => answerFrom({
  'staff/staff-type': [TEACHER, SUPPORT],
  'staff/teacher-education-type': [BACHELOR, MASTERS],
  'staff/teacher-salary-band-type': [BA, MA],
  'staff/district/staff?district_id=111': [
    { ...district, id: 1, year: 2015, value: 300, staff_type: TEACHER },
    { ...district, id: 2, year: 2025, value: 300, staff_type: TEACHER },
    { ...district, id: 3, year: 2025, value: 100, staff_type: SUPPORT },
  ],
  'staff/district/teacher-education?district_id=111': [
    { ...district, id: 1, year: 2025, value: 100, teacher_type: BACHELOR },
    { ...district, id: 2, year: 2025, value: 200, teacher_type: MASTERS },
  ],
  'staff/district/teacher-average-salary?district_id=111': [
    { ...district, id: 1, year: 2016, salary: 50000 },
    { ...district, id: 2, year: 2026, salary: 70000 },
  ],
  'staff/district/teacher-salary-band?district_id=111': [
    { ...district, id: 2, year: 2026, min_salary: 45000, max_salary: 75000, steps: 14, salary_band_type: MA },
    { ...district, id: 1, year: 2026, min_salary: 42000, max_salary: 65000, steps: 12, salary_band_type: BA },
  ],
  'staff/state/teacher-salary-band': [
    { id: 1, year: 2026, min_salary: 40000, max_salary: 60000, steps: 13, salary_band_type: BA },
  ],
  'class-size/class-size/district?district_id=111': [
    { ...district, id: 1, year: 2025, grades_1_2: 14.2, grades_3_4: 16, grades_5_8: 0, all_grades: 15.1 },
  ],
  'measurement/latest?district_id=111': [],
}));

describe('Staff download', () => {
  it("saves the district's pay, staff, education, salary bands and class size beside New Hampshire's", async () => {
    await renderEntityPage('district', <Staff />);
    const { fileName, sheets } = await downloadExcel();

    expect(fileName).toBe('concord-school-district-staff.xlsx');
    expect(sheets.map(entry => entry.name)).toEqual([
      'Average Teacher Salary', 'Staff By Type, 2024-25', 'Staff By Type By Year', 'Staff Types As % of Staff',
      'Teacher Education, 2024-25', 'Teacher Education By Year', 'Teacher Salary Bands', 'Class Size By Year', 'Notes',
    ]);
    // Pay in the latest year's dollars is the same as actual pay in that year
    expect(row(sheet(sheets, 'Average Teacher Salary'), '2025-26')).toEqual(['2025-26', 70000, 71857, 70000, 71857]);
    expect(row(sheet(sheets, 'Average Teacher Salary'), '2015-16').slice(0, 3)).toEqual(['2015-16', 50000, 56000]);
    // Teachers are 75% of Concord's staff against 70% statewide (14,000 of 20,000)
    const byType = sheet(sheets, 'Staff By Type, 2024-25');
    expect(row(byType, 'Teacher')).toEqual(['Teacher', 300, 0.75, 0.7]);
    expect(byType.totalRow).toEqual(['All Staff', 400, 1, 1]);
    expect(row(sheet(sheets, 'Staff By Type By Year'), '2014-15')).toEqual(['2014-15', 300, null, 300]);
    expect(row(sheet(sheets, 'Staff Types As % of Staff'), '2024-25')).toEqual(['2024-25', 0.75, 0.25, 0.7, 0.3]);
    // Degrees by name, with the state's share: 8,000 of 13,000 teachers hold a master's
    const masters = row(sheet(sheets, 'Teacher Education, 2024-25'), "Master's");
    expect(masters.slice(0, 2)).toEqual(["Master's", 200]);
    expect(masters[2]).toBeCloseTo(2 / 3);
    expect(masters[3]).toBeCloseTo(8000 / 13000);
    // Bands in the band types' order, with New Hampshire's average where it has one
    const bands = sheet(sheets, 'Teacher Salary Bands');
    expect(bands.rows).toEqual([
      ['2025-26', "Bachelor's Degree", 42000, 65000, 12, 40000, 60000],
      ['2025-26', "Master's Degree", 45000, 75000, 14, null, null],
    ]);
    // A class size of 0 is no figure
    expect(row(sheet(sheets, 'Class Size By Year'), '2024-25')).toEqual(['2024-25', 15.1, 14.2, 16, null, 15.3, 15.9, 17.1, 13.8]);
    expect(sheet(sheets, 'Notes').subtitle).toBe('Staff for Concord School District');
  });
});
