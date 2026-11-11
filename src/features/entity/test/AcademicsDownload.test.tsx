import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
// The harness first: it loads the store, which the pages' modules expect to exist
import { answerFrom, downloadExcel, renderEntityPage, row, sheet } from './entityPages';
import { store } from '@/store/store';
import { clearStateData, fetchAssessmentStateData } from '@/store/slices/assessmentSlice';
import DistrictAcademics from '@/features/district/components/AcademicAchievement';
import SchoolAcademics from '@/features/school/components/AcademicAchievement';

vi.mock('@/services/api/utils/apiUtils', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/services/api/utils/apiUtils')>()), fetchData: vi.fn() }));
vi.mock('@/features/state/utils/excel', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/features/state/utils/excel')>()), downloadWorkbook: vi.fn() }));

const MATH = 1;
const READING = 2;
const SCIENCE = 3;
const ALL_STUDENTS = 1;
const IEP = 9;
// "Grade 3" in the statewide grade fixture
const GRADE_3 = 5;

type Place = { district_id?: number; school_id?: number; district_name?: string; school_name?: string };
type Levels = [number, number, number, number];
// A result as the API sends it; the tests' latest year is 2024-25, the default when no .env is loaded
const result = (place: Place, year: number, subject: number, subgroup: number, gradeId: number | null, proficient: number | null, { levels, exception = null }: { levels?: Levels; exception?: string | null } = {}) => ({
  id: (place.district_id ?? place.school_id ?? 0) * 1e6 + year * 100 + subject * 10 + subgroup + (gradeId ?? 0) * 1e5,
  year,
  district_id: place.district_id ?? null,
  school_id: place.school_id ?? null,
  district_name: place.district_name ?? null,
  school_name: place.school_name ?? null,
  assessment_subgroup_id: subgroup,
  assessment_subject_id: subject,
  grade_id: gradeId,
  total_fay_students_low: 100,
  total_fay_students_high: 105,
  ...Object.fromEntries((levels ?? [null, null, null, null]).flatMap((level, index) => [[`level_${index + 1}_percentage`, level], [`level_${index + 1}_percentage_exception`, null]])),
  above_proficient_percentage: proficient,
  above_proficient_percentage_exception: exception,
  participate_percentage: null,
  mean_sgp: null,
  average_score: null,
});

const STATE: Place = {};
const CONCORD: Place = { district_id: 111, district_name: 'Concord' };
const CONCORD_HIGH: Place = { district_id: 111, school_id: 20, district_name: 'Concord', school_name: 'Concord High School' };
// The district's results and its high school's: every subject in 2024-25, math since 2018-19, and
// math by student group and grade
const results = (place: Place) => [
  result(place, 2019, MATH, ALL_STUDENTS, null, 40),
  result(place, 2025, MATH, ALL_STUDENTS, null, 43.5, { levels: [20, 36.5, 30, 13.5] }),
  result(place, 2025, READING, ALL_STUDENTS, null, 52),
  result(place, 2025, SCIENCE, ALL_STUDENTS, null, 38),
  result(place, 2025, MATH, IEP, null, null, { exception: 'SCORE_UNDER_10' }),
  result(place, 2025, MATH, ALL_STUDENTS, GRADE_3, 50),
];

beforeEach(() => answerFrom({
  'assessment/district?district_id=111': results(CONCORD),
  'assessment/school?school_id=20': results(CONCORD_HIGH),
  'assessment/state': [
    result(STATE, 2019, MATH, ALL_STUDENTS, null, 47),
    result(STATE, 2025, MATH, ALL_STUDENTS, null, 46, { levels: [22, 32, 30, 16] }),
    result(STATE, 2025, READING, ALL_STUDENTS, null, 56),
    result(STATE, 2025, SCIENCE, ALL_STUDENTS, null, 37),
    result(STATE, 2025, MATH, IEP, null, 14),
    result(STATE, 2025, MATH, ALL_STUDENTS, GRADE_3, 52),
  ],
  // Every district's or school's result for all students in all grades: what the ranks are among
  'assessment/district': [
    result(CONCORD, 2025, MATH, ALL_STUDENTS, null, 43.5),
    result(CONCORD, 2025, READING, ALL_STUDENTS, null, 52),
    result({ district_id: 7, district_name: 'Bedford' }, 2025, MATH, ALL_STUDENTS, null, 60),
    result({ district_id: 7, district_name: 'Bedford' }, 2025, READING, ALL_STUDENTS, null, 70),
    result({ district_id: 3, district_name: 'Berlin' }, 2025, MATH, ALL_STUDENTS, null, 30),
    result({ district_id: 327, district_name: 'Lyme' }, 2025, MATH, ALL_STUDENTS, null, null, { exception: 'SCORE_OVER_90' }),
  ],
  'assessment/school': [
    result(CONCORD_HIGH, 2025, MATH, ALL_STUDENTS, null, 43.5),
    result({ district_id: 7, school_id: 70, district_name: 'Bedford', school_name: 'Bedford High School' }, 2025, MATH, ALL_STUDENTS, null, 55),
  ],
}));

describe('Academic Performance download', () => {
  it("saves the district's results by subject, grade, group and year beside New Hampshire's, and what it ranks among", async () => {
    await renderEntityPage('district', <DistrictAcademics />);
    const { fileName, sheets } = await downloadExcel();

    expect(fileName).toBe('concord-school-district-academics.xlsx');
    expect(sheets.map(entry => entry.name)).toEqual([
      'Key Figures', 'Proficient By Grade', 'Proficient By Student Group',
      'Math Results By Year', 'Reading Results By Year', 'Science Results By Year', 'All Districts', 'Notes',
    ]);
    // As on the math card: 43.5% against 46% statewide, up 3.5 points since 2018-19, third of four
    // (Lyme's ">90%" ranks as 91%)
    const math = row(sheet(sheets, 'Key Figures'), 'Math');
    expect(math.slice(0, 2)).toEqual(['Math', '2024-25']);
    expect(math[2]).toBeCloseTo(0.435);
    expect(math[3]).toBeCloseTo(0.46);
    expect(math.slice(4)).toEqual([3.5, 3, 4]);
    expect(row(sheet(sheets, 'Key Figures'), 'Reading').slice(5)).toEqual([2, 2]);

    const byGrade = sheet(sheets, 'Proficient By Grade');
    expect(byGrade.columns.map(column => column.header)).toEqual(['Grade', 'Math', 'NH Math', 'Reading', 'NH Reading', 'Science', 'NH Science']);
    expect(row(byGrade, 'Grade 3').slice(0, 3)).toEqual(['Grade 3', 0.5, 0.52]);
    // A share withheld as under 10% shows as the page shows it, beside the state's
    const byGroup = sheet(sheets, 'Proficient By Student Group');
    expect(row(byGroup, 'Students with Disabilities (IEP)').slice(0, 3)).toEqual(['Students with Disabilities (IEP)', '<10%', 0.14]);
    expect(row(byGroup, 'Disability')).toEqual(['Disability', null, null, null, null, null, null]);

    // Every group, grade and year, with the achievement levels beside the state's
    const mathByYear = sheet(sheets, 'Math Results By Year');
    expect(mathByYear.rows.map(entry => entry.slice(0, 3))).toEqual([
      ['All Students', 'All Grades', '2018-19'],
      ['All Students', 'All Grades', '2024-25'],
      ['All Students', 'Grade 3', '2024-25'],
      ['Students with Disabilities (IEP)', 'All Grades', '2024-25'],
    ]);
    const latest = mathByYear.rows[1];
    expect(latest[4]).toBeCloseTo(0.46);
    expect(latest[5]).toBeCloseTo(0.2);
    expect(latest[9]).toBeCloseTo(0.22);
    expect(mathByYear.columns[9].header).toBe('NH Below Proficient (Level 1)');

    const all = sheet(sheets, 'All Districts');
    expect(all.rows.map(entry => entry[0])).toEqual(['Bedford', 'Berlin', 'Concord', 'Lyme']);
    expect(row(all, 'Lyme')[1]).toBe('>90%');
    expect(all.subtotalRows).toEqual([2]);
    expect(sheet(sheets, 'Notes').subtitle).toBe('Academic Performance for Concord School District');
  });

  it("names a school's file after the school, and ranks it among schools", async () => {
    await renderEntityPage('school', <SchoolAcademics />);
    const { fileName, sheets } = await downloadExcel();

    expect(fileName).toBe('concord-high-school-academics.xlsx');
    expect(row(sheet(sheets, 'Key Figures'), 'Math').slice(5)).toEqual([2, 2]);
    const all = sheet(sheets, 'All Schools');
    expect(all.columns.map(column => column.header)).toEqual(['School', 'District', 'Math', 'Reading', 'Science']);
    expect(row(all, 'Concord High School').slice(0, 3)).toEqual(['Concord High School', 'Concord', 0.435]);
    expect(sheet(sheets, 'Notes').subtitle).toBe('Academic Performance for Concord High School');
  });
});

describe('Academic Performance after the overview', () => {
  // The overview loads only the state's all-students results, which then became the "current" state
  // results; the page found them, never asked for the rest, and waited for those forever
  it.each([
    ['district', <DistrictAcademics key="district" />],
    ['school', <SchoolAcademics key="school" />],
  ] as const)('loads on a %s page after the overview', async (kind, page) => {
    store.dispatch(clearStateData());
    await store.dispatch(fetchAssessmentStateData({ assessment_subgroup_id: ALL_STUDENTS }));
    await renderEntityPage(kind, page);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Download Excel' })).toBeEnabled(), { timeout: 3000 });
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    // Every state result is current again, for the subject details' state figures
    expect(store.getState().assessment.currentStateKey).toBe('_default');
  });
});
