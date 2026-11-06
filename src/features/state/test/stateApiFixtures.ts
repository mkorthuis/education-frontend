// Small statewide API responses for the State page tests, keyed by path under /api/v1/.
// Numbers are chosen so the pages' sentences are easy to check by hand.

const grade = (id: number, name: string) => ({ id, name });
const assessment = (year: number, subject: number, subgroup: number, gradeId: number | null, proficient: number | null) => ({
  id: year * 1000 + subject * 100 + subgroup * 10 + (gradeId ?? 0),
  year,
  district_id: null,
  school_id: null,
  district_name: null,
  school_name: null,
  assessment_subgroup_id: subgroup,
  assessment_subject_id: subject,
  grade_id: gradeId,
  total_fay_students_low: 1000,
  total_fay_students_high: 1005,
  level_1_percentage: null,
  level_1_percentage_exception: null,
  level_2_percentage: null,
  level_2_percentage_exception: null,
  level_3_percentage: null,
  level_3_percentage_exception: null,
  level_4_percentage: proficient === null ? null : Math.round(proficient / 2),
  level_4_percentage_exception: null,
  above_proficient_percentage: proficient,
  above_proficient_percentage_exception: null,
  participate_percentage: 96,
  mean_sgp: 50,
  average_score: null,
});

export const STATE_API_FIXTURES: Record<string, unknown> = {
  'finance/state-adm': [
    { year: 2015, elementary: 80000, middle: 35000, high: 50000, total: 165000 },
    { year: 2025, elementary: 74000, middle: 30000, high: 45403, total: 149403 },
  ],
  'finance/per-pupil/state': [
    { id: 1, year: 2015, elementary: 14000, middle: 13500, high: 14500, total: 14000, date_created: '', date_updated: '' },
    { id: 2, year: 2025, elementary: 23533, middle: 21294, high: 22263, total: 21000, date_created: '', date_updated: '' },
  ],
  'finance/state-expenditure-rollup': [
    { id: 1, year: 2015, total: 3000000000 },
    { id: 2, year: 2025, total: 4140000000 },
  ],
  'finance/state-revenue': [
    { id: 1, year: 2025, entry_type_id: 1, value: 3000 },
    { id: 2, year: 2025, entry_type_id: 2, value: 1000 },
  ],
  'finance/entry-types': {
    balance_entry_types: [],
    expenditure_entry_types: [],
    revenue_entry_types: [
      { id: 1, name: 'Taxes', page: '', account_no: '', line: '', category: { id: 1, name: 'Local', super_category: { id: 1, name: 'Revenue from Local Sources' } } },
      { id: 2, name: 'Adequacy', page: '', account_no: '', line: '', category: { id: 2, name: 'State', super_category: { id: 2, name: 'Revenue from State Sources' } } },
    ],
  },
  'enrollment/town/state': [
    // 2020-21 (the pandemic dip) is skipped as the comparison year in favor of 2019-20
    // 2014-15, the year the key figure tiles compare with
    { year: 2015, grade_id: 2, total_enrollment: 12500, grade: grade(2, 'Kindergarten') },
    { year: 2015, grade_id: 14, total_enrollment: 14000, grade: grade(14, 'Grade 12') },
    { year: 2020, grade_id: 2, total_enrollment: 11250, grade: grade(2, 'Kindergarten') },
    { year: 2021, grade_id: 2, total_enrollment: 10000, grade: grade(2, 'Kindergarten') },
    { year: 2026, grade_id: 2, total_enrollment: 10625, grade: grade(2, 'Kindergarten') },
    { year: 2026, grade_id: 14, total_enrollment: 12269, grade: grade(14, 'Grade 12') },
  ],
  'staff/state/staff': [
    { id: 1, year: 2015, value: 15000, staff_type: { id: 1, name: 'Teacher' } },
    { id: 2, year: 2025, value: 14000, staff_type: { id: 1, name: 'Teacher' } },
    { id: 3, year: 2025, value: 6000, staff_type: { id: 2, name: 'Instruction Support' } },
  ],
  'staff/state/teacher-average-salary': [
    { id: 1, year: 2016, salary: 56000 },
    { id: 2, year: 2026, salary: 71857 },
  ],
  'staff/state/teacher-education': [
    { id: 1, year: 2025, value: 5000, teacher_type: { id: 2, name: 'Bachelor' } },
    { id: 2, year: 2025, value: 8000, teacher_type: { id: 3, name: 'Masters' } },
  ],
  'class-size/class-size/state': [
    { id: 1, year: 2025, grades_1_2: 15.9, grades_3_4: 17.1, grades_5_8: 13.8, all_grades: null },
  ],
  'outcome/outcome/graduation-cohort/state': [
    { id: 1, year: 2015, cohort_size: 1000, graduate: 880, earned_hiset: 20, dropped_out: 30 },
    { id: 2, year: 2025, cohort_size: 1000, graduate: 875, earned_hiset: 22, dropped_out: 22 },
  ],
  'outcome/outcome/post-graduation/state': [
    { id: 1, year: 2025, value: 500, post_graduation_type: { id: 1, name: '4 Year College', description: 'Entering Four Year Colleges & Universities' } },
    { id: 2, year: 2025, value: 170, post_graduation_type: { id: 2, name: 'Less 4 Year College', description: 'Entering Less Than Four Years' } },
    { id: 3, year: 2025, value: 330, post_graduation_type: { id: 4, name: 'Employed', description: 'Employed' } },
  ],
  'outcome/outcome/early-exit/state': [
    { id: 1, year: 2024, adjusted_fall_enrollment: 60000, earned_hiset: 300, enrolled_in_college: 5, dropped_out: 600, missing: 0, annual_early_exit_percentage: 0.015, four_year_early_exit_percentage: 0.06, annual_dropout_percentage: 0.01, four_year_dropout_percentage: 0.04 },
  ],
  'assessment/subject': [
    { id: 1, name: 'mat', description: 'Math' },
    { id: 2, name: 'rea', description: 'Reading' },
    { id: 3, name: 'sci', description: 'Science' },
  ],
  'assessment/subgroup': [
    { id: 1, name: 'All students', description: null },
    { id: 9, name: 'IEP/SWD', description: null },
  ],
  'location/grade': [grade(2, 'Kindergarten'), grade(5, 'Grade 3'), grade(13, 'Grade 11'), grade(14, 'Grade 12')],
  'assessment/state': [
    assessment(2018, 1, 1, null, 48), assessment(2018, 2, 1, null, 58),
    assessment(2026, 1, 1, null, 44), assessment(2026, 2, 1, null, 55), assessment(2026, 3, 1, null, 38),
    assessment(2026, 1, 9, null, 13), assessment(2026, 2, 9, null, 17),
    assessment(2026, 1, 1, 5, 54), assessment(2026, 2, 1, 5, 51),
  ],
  'education-freedom-account/entry-type': [
    { id: 1, name: 'Base Aid', description: 'Base Aid', year: 2027, value: 4000 },
    { id: 3, name: 'Special Education Aid', description: 'Special Education Aid', year: 2027, value: 2000 },
  ],
  'education-freedom-account/state-entry': [
    { year: 2026, entry_type_id: 1, value: 10000 },
    { year: 2026, entry_type_id: 3, value: 700 },
    { year: 2027, entry_type_id: 1, value: 12500 },
    { year: 2027, entry_type_id: 3, value: 1000 },
  ],
  'safety/school-safety-type': [{ id: 4, name: 'Arsons' }],
  'safety/bullying-type': [{ id: 1, name: 'Bullying (of any kind)' }],
  'safety/state/truancy': [{ id: 1, year: 2025, count: 30546 }],
  'safety/state/bullying': [{ id: 1, year: 2025, reported: 1626, investigated_actual: 684, bullying_type: { id: 1, name: 'Bullying (of any kind)' } }],
  'safety/state/safety': [{ id: 1, year: 2025, count: 3, safety_type: { id: 4, name: 'Arsons' } }],
  'safety/state/restraint': [{ id: 1, year: 2025, generated: 1100, active_investigation: 0, closed_investigation: 1100, bodily_injury: 0, serious_injury: 0 }],
  'safety/state/seclusion': [{ id: 1, year: 2025, generated: 1500, active_investigation: 0, closed_investigation: 1500 }],
  'safety/state/enrollment': [{ year: 2025, total_enrollment: 162544 }],
  'location/district': [{ id: 7, name: 'Bedford' }, { id: 3, name: 'Berlin' }],
  'measurement/type': [
    { id: 34, name: 'Economically Disadvantaged Students (%)', measurement_type_category_id: 1 },
    { id: 36, name: 'Students with Disability (%)', measurement_type_category_id: 1 },
  ],
  // October 1 public school enrollment: 2025-26 the latest year, compared with 2019-20 (the year
  // before the pandemic dip) by grade and with 2014-15 on the tiles; private counts a year behind
  'enrollment/type/state': [
    { id: 1, year: 2015, enrollment_type: { id: 1, name: 'Public District Schools' }, grade: grade(2, 'Kindergarten'), enrollment: 10000 },
    { id: 2, year: 2015, enrollment_type: { id: 1, name: 'Public District Schools' }, grade: grade(14, 'Grade 12'), enrollment: 12000 },
    { id: 3, year: 2015, enrollment_type: { id: 3, name: 'Public Charter Schools' }, grade: grade(8, 'Grade 6'), enrollment: 2500 },
    { id: 4, year: 2020, enrollment_type: { id: 1, name: 'Public District Schools' }, grade: grade(2, 'Kindergarten'), enrollment: 11268 },
    { id: 5, year: 2021, enrollment_type: { id: 1, name: 'Public District Schools' }, grade: grade(2, 'Kindergarten'), enrollment: 9000 },
    { id: 6, year: 2026, enrollment_type: { id: 1, name: 'Public District Schools' }, grade: grade(2, 'Kindergarten'), enrollment: 10625 },
    { id: 7, year: 2026, enrollment_type: { id: 1, name: 'Public District Schools' }, grade: grade(14, 'Grade 12'), enrollment: 12269 },
    { id: 8, year: 2026, enrollment_type: { id: 3, name: 'Public Charter Schools' }, grade: grade(8, 'Grade 6'), enrollment: 7000 },
    { id: 9, year: 2025, enrollment_type: { id: 5, name: 'Nonpublic Schools' }, grade: grade(2, 'Kindergarten'), enrollment: 16700 },
    // 2024-25 public counts, so the type of school table has a year with both public and private
    { id: 10, year: 2025, enrollment_type: { id: 1, name: 'Public District Schools' }, grade: grade(2, 'Kindergarten'), enrollment: 10600 },
    { id: 11, year: 2025, enrollment_type: { id: 3, name: 'Public Charter Schools' }, grade: grade(8, 'Grade 6'), enrollment: 6000 },
  ],
  'enrollment/reduced-lunch/state': [{ id: 1, year: 2026, enrollment: 155853, eligible: 36085 }],
  'enrollment/english-learner/state': [{ id: 1, year: 2026, enrollment: 160257, eligible: 6074, monitor: 1821 }],
  // The same rows for either measure: statewide figures that stop a year before the EFA counts
  'measurement/state': [{ year: 2026, field: 20.5, districts: 178 }],
  'enrollment/school-counts/state': [
    { year: 2016, schools: 430, districts: 166 },
    { year: 2025, schools: 442, districts: 166 },
  ],
  // Schools for any district; tests that need a district without schools override it
  'location/school': [{ id: 70, name: 'Bedford High School', district_id: 7, grades: [grade(14, 'Grade 12')] }],
};

/** The fixture for a request URL such as "/api/v1/finance/state-adm?year=2025", or undefined. */
export const fixtureFor = (url: string): unknown => {
  const path = url.split('?')[0].replace(/^\/api\/v1\//, '');
  return STATE_API_FIXTURES[path];
};
