import { beforeEach, describe, expect, it, vi } from 'vitest';
// The harness first: it loads the store, which the pages' modules expect to exist
import { answerFrom, downloadExcel, renderEntityPage, row, sheet } from './entityPages';
import DistrictEnrollment from '@/features/district/components/Enrollment';
import SchoolEnrollment from '@/features/school/components/Enrollment';

vi.mock('@/services/api/utils/apiUtils', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/services/api/utils/apiUtils')>()), fetchData: vi.fn() }));
vi.mock('@/features/state/utils/excel', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/features/state/utils/excel')>()), downloadWorkbook: vi.fn() }));

const GRADE_NAMES: Record<number, string> = { 1: 'Preschool', 2: 'Kindergarten', 3: 'Grade 1', 11: 'Grade 9', 12: 'Grade 10', 13: 'Grade 11', 14: 'Grade 12' };
const enrolled = (place: Record<string, number>, year: number, gradeId: number, enrollment: number) =>
  ({ ...place, id: year * 100 + gradeId, year, grade_id: gradeId, enrollment, grade: { id: gradeId, name: GRADE_NAMES[gradeId] } });
const measured = (year: number, typeId: number, field: number) => ({ id: year * 100 + typeId, year, district_id: 111, measurement_type_id: typeId, field });

beforeEach(() => answerFrom({
  // Two towns, so the towns sheet has a column for each
  'location/town?district_id=111': [{ id: 111, name: 'Concord' }, { id: 112, name: 'Bow' }],
  'enrollment/town?district_id=111': [
    enrolled({ town_id: 111 }, 2025, 2, 200), enrolled({ town_id: 111 }, 2025, 3, 210),
    enrolled({ town_id: 112 }, 2025, 2, 50), enrolled({ town_id: 112 }, 2025, 3, 55),
    enrolled({ town_id: 111 }, 2026, 2, 190), enrolled({ town_id: 111 }, 2026, 3, 205),
    enrolled({ town_id: 112 }, 2026, 2, 45), enrolled({ town_id: 112 }, 2026, 3, 52),
    // Preschool, which the page's grade table leaves out but its chart counts
    enrolled({ town_id: 111 }, 2026, 1, 30),
  ],
  'measurement/type': [
    { id: 34, name: 'Economically Disadvantaged Students (%)', measurement_type_category_id: 1 },
    { id: 35, name: 'English Language Learners (%)', measurement_type_category_id: 1 },
    { id: 36, name: 'Students with Disability (%)', measurement_type_category_id: 1 },
    { id: 37, name: 'Total Enrollment', measurement_type_category_id: 1 },
  ],
  // English language learners reported only as under 10%
  'measurement?district_id=111': [measured(2026, 37, 4000), measured(2026, 34, 25.5), measured(2026, 35, 10), measured(2026, 36, 17)],
  // Concord High, grades 9-12; each class loses 5 students moving up a grade
  'enrollment/school/20': [
    enrolled({ school_id: 20 }, 2025, 11, 400), enrolled({ school_id: 20 }, 2025, 12, 380),
    enrolled({ school_id: 20 }, 2025, 13, 370), enrolled({ school_id: 20 }, 2025, 14, 360),
    enrolled({ school_id: 20 }, 2026, 11, 410), enrolled({ school_id: 20 }, 2026, 12, 395),
    enrolled({ school_id: 20 }, 2026, 13, 375), enrolled({ school_id: 20 }, 2026, 14, 365),
  ],
}));

describe('Enrollment download', () => {
  it("saves the district's towns, grades, projection and school groups", async () => {
    await renderEntityPage('district', <DistrictEnrollment />);
    const { fileName, sheets } = await downloadExcel();

    expect(fileName).toBe('concord-school-district-enrollment.xlsx');
    expect(sheets.map(entry => entry.name)).toEqual(['Students in District Towns', 'Town Students By Grade', 'Enrollment Projection', 'District School Enrollment', 'Notes']);
    // Every town, every year, preschool included as in the page's chart
    const towns = sheet(sheets, 'Students in District Towns');
    expect(towns.columns.map(column => column.header)).toEqual(['School Year', 'All Towns', 'Concord', 'Bow']);
    expect(row(towns, '2024-25')).toEqual(['2024-25', 515, 410, 105]);
    expect(row(towns, '2025-26')).toEqual(['2025-26', 522, 425, 97]);
    // Every grade by every year, summed across the towns
    const byGrade = sheet(sheets, 'Town Students By Grade');
    expect(byGrade.columns.map(column => column.header)).toEqual(['Grade', '2024-25', '2025-26']);
    expect(row(byGrade, 'Preschool')).toEqual(['Preschool', null, 30]);
    expect(row(byGrade, 'Kindergarten')).toEqual(['Kindergarten', 250, 235]);
    expect(byGrade.totalRow).toEqual(['All Grades', 515, 522]);
    // Kindergarten projected at its average, 242.5, every year; all 13 grades and 15 years ahead
    const projection = sheet(sheets, 'Enrollment Projection');
    expect(projection.rows).toHaveLength(13);
    expect(projection.columns).toHaveLength(17);
    expect(row(projection, 'Kindergarten').slice(0, 4)).toEqual(['Kindergarten', 235, 242.5, 242.5]);
    expect(row(projection, 'Grade 1').slice(0, 3)).toEqual(['Grade 1', 257, 261]);
    // Shares as the page's table shows them, and the chart's estimated students
    expect(row(sheet(sheets, 'District School Enrollment'), '2025-26')).toEqual(['2025-26', 4000, 0.255, 1020, '<10%', null, 0.17, 680]);
    expect(sheet(sheets, 'Notes').subtitle).toBe('Enrollment for Concord School District');
  });

  it("saves the school's students by year and grade, and its projection for its own grades", async () => {
    await renderEntityPage('school', <SchoolEnrollment />);
    const { fileName, sheets } = await downloadExcel();

    expect(fileName).toBe('concord-high-school-enrollment.xlsx');
    expect(sheets.map(entry => entry.name)).toEqual(['Students By Year', 'Students By Grade', 'Enrollment Projection', 'Notes']);
    expect(sheet(sheets, 'Students By Year').rows).toEqual([['2024-25', 1510], ['2025-26', 1545]]);
    expect(row(sheet(sheets, 'Students By Grade'), 'Grade 12')).toEqual(['Grade 12', 360, 365]);
    // Grade 9, the school's first grade, at its average; each later grade the one below less 5
    const projection = sheet(sheets, 'Enrollment Projection');
    expect(projection.rows.map(entry => entry[0])).toEqual(['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']);
    expect(row(projection, 'Grade 9').slice(0, 3)).toEqual(['Grade 9', 410, 405]);
    expect(row(projection, 'Grade 10').slice(0, 3)).toEqual(['Grade 10', 395, 405]);
    expect(row(projection, 'Grade 12').slice(0, 3)).toEqual(['Grade 12', 365, 370]);
    expect(projection.totalRow?.slice(0, 3)).toEqual(['Total Students', 1545, 1570]);
    expect(sheet(sheets, 'Notes').subtitle).toBe('Enrollment for Concord High School');
  });
});
