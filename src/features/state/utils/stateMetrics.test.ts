import { describe, expect, it } from 'vitest';
import {
  changeSince,
  describeChange,
  efaTotals,
  formatSchoolYear,
  graduationRates,
  latestAssessmentYear,
  latestPoint,
  normalizeAssessmentRows,
  mergeSeries,
  percentChangeSeries,
  pivotByYear,
  postGraduationShares,
  proficiencyByGrade,
  proficiencyBySubgroup,
  proficiencyBySubject,
  revenueBySource,
  studentsPerTeacher,
  toSeries,
} from './stateMetrics';

const series = (pairs: [number, number][]) => pairs.map(([year, value]) => ({ year, value }));

describe('series helpers', () => {
  it('sorts by year and drops missing values', () => {
    const rows = [{ year: 2022, v: 3 }, { year: 2020, v: 1 }, { year: 2021, v: null }];
    expect(toSeries(rows, row => row.v)).toEqual(series([[2020, 1], [2022, 3]]));
  });

  it('finds the latest point', () => {
    expect(latestPoint(series([[2019, 5], [2024, 9], [2021, 7]]))).toEqual({ year: 2024, value: 9 });
    expect(latestPoint([])).toBeNull();
  });

  it('measures change from the requested number of years back', () => {
    const change = changeSince(series([[2014, 100], [2015, 110], [2024, 132], [2025, 121]]), 10);
    expect(change?.from).toEqual({ year: 2015, value: 110 });
    expect(change?.to).toEqual({ year: 2025, value: 121 });
    expect(change?.change).toBe(11);
    expect(change?.percentChange).toBeCloseTo(10);
  });

  it('falls back to the earliest point when the series is shorter', () => {
    expect(changeSince(series([[2022, 50], [2025, 100]]), 10)?.from.year).toBe(2022);
    expect(changeSince(series([[2025, 100]]), 10)).toBeNull();
  });

  it('expresses a series as percent change from a base year', () => {
    const changes = percentChangeSeries(series([[2009, 1], [2010, 200], [2011, 220], [2012, 180]]), 2010);
    expect(changes.map(point => point.year)).toEqual([2010, 2011, 2012]);
    expect(changes.map(point => Math.round(point.value))).toEqual([0, 10, -10]);
  });

  it('merges series into one row per year, with null gaps', () => {
    expect(mergeSeries({ a: series([[2020, 1], [2021, 2]]), b: series([[2021, 5]]) })).toEqual([
      { year: 2020, a: 1, b: null },
      { year: 2021, a: 2, b: 5 },
    ]);
  });

  it('pivots and sums rows by year and category', () => {
    const rows = [
      { year: 2021, type: 'x', n: 1 },
      { year: 2021, type: 'x', n: 2 },
      { year: 2020, type: 'y', n: 4 },
    ];
    expect(pivotByYear(rows, row => row.type, row => row.n)).toEqual([
      { year: 2020, x: null, y: 4 },
      { year: 2021, x: 3, y: null },
    ]);
  });
});

describe('outcomes', () => {
  it('turns cohort counts into rates', () => {
    const [rates] = graduationRates([{ year: 2025, cohort_size: 200, graduate: 175, earned_hiset: 4, dropped_out: 6 }]);
    expect(rates).toEqual({ year: 2025, graduated: 87.5, hiset: 2, droppedOut: 3 });
  });

  it('skips empty cohorts', () => {
    expect(graduationRates([{ year: 2025, cohort_size: 0, graduate: 0, earned_hiset: 0, dropped_out: 0 }])).toEqual([]);
  });

  it('gives each post-graduation plan as a share, with college combined', () => {
    const type = (id: number, name: string) => ({ id, name });
    const [shares] = postGraduationShares([
      { year: 2025, value: 60, post_graduation_type: type(1, '4 Year College') },
      { year: 2025, value: 20, post_graduation_type: type(2, 'Less 4 Year College') },
      { year: 2025, value: 20, post_graduation_type: type(4, 'Employed') },
    ]);
    expect(shares['4 Year College']).toBe(60);
    expect(shares.Employed).toBe(20);
    expect(shares.college).toBe(80);
  });
});

describe('assessments', () => {
  const row = (year: number, subject: number, value: number | null, subgroup = 1, grade: number | null = null) => ({
    year,
    assessment_subject_id: subject,
    assessment_subgroup_id: subgroup,
    grade_id: grade,
    above_proficient_percentage: value,
  });
  const rows = [
    row(2025, 1, 42), row(2025, 2, 55), row(2025, 3, 38),
    row(2026, 1, 44), row(2026, 2, 55),
    row(2026, 1, 20, 9), row(2026, 2, 21, 9),
    row(2026, 1, null, 2), row(2026, 2, null, 2),
    row(2026, 1, 50, 1, 5), row(2026, 2, 60, 1, 5),
    row(2026, 1, 30, 1, 13),
  ];

  it('restores ids on rows the store enriched with related objects', () => {
    const stored = [
      { year: 2026, above_proficient_percentage: 44, assessment_subgroup: { id: 1 }, assessment_subject: { id: 1 }, grade: null },
      { year: 2026, above_proficient_percentage: 50, assessment_subgroup: { id: 1 }, assessment_subject: { id: 1 }, grade: { id: '5', name: 'Grade 3' } },
      { year: 2026, above_proficient_percentage: 55, assessment_subgroup_id: 1, assessment_subject_id: 2, grade_id: null },
      { year: 2026, above_proficient_percentage: 10, assessment_subject: { id: 1 } },
    ];
    expect(normalizeAssessmentRows(stored)).toEqual([
      { year: 2026, above_proficient_percentage: 44, assessment_subgroup_id: 1, assessment_subject_id: 1, grade_id: null, grade_name: null },
      { year: 2026, above_proficient_percentage: 50, assessment_subgroup_id: 1, assessment_subject_id: 1, grade_id: 5, grade_name: 'Grade 3' },
      { year: 2026, above_proficient_percentage: 55, assessment_subgroup_id: 1, assessment_subject_id: 2, grade_id: null, grade_name: null },
    ]);
  });

  it('gives all-students proficiency by year and subject', () => {
    expect(proficiencyBySubject(rows)).toEqual([
      { year: 2025, math: 42, reading: 55, science: 38 },
      { year: 2026, math: 44, reading: 55, science: null },
    ]);
  });

  it('finds the latest year with results', () => {
    expect(latestAssessmentYear(rows)).toBe(2026);
    expect(latestAssessmentYear([row(2027, 1, null)])).toBeNull();
  });

  it('lists subgroups with results, dropping fully suppressed ones', () => {
    const table = proficiencyBySubgroup(rows, 2026, [
      { id: 1, name: 'All students' },
      { id: 2, name: 'Am. Indian' },
      { id: 9, name: 'IEP/SWD' },
    ]);
    expect(table.map(entry => entry.name)).toEqual(['All students', 'IEP/SWD']);
    expect(table[1]).toMatchObject({ math: 20, reading: 21, science: null });
  });

  it('lists tested grades in grade order', () => {
    const table = proficiencyByGrade(rows, 2026, [
      { id: 13, name: 'Grade 11' },
      { id: 5, name: 'Grade 3' },
      { id: 6, name: 'Grade 4' },
    ]);
    expect(table.map(entry => entry.name)).toEqual(['Grade 3', 'Grade 11']);
    expect(table[0]).toMatchObject({ math: 50, reading: 60 });
  });
});

describe('money', () => {
  it('sums revenue into local, state, federal and other', () => {
    const entryTypes = [
      { id: 1, category: { super_category: { name: 'Revenue from Local Sources' } } },
      { id: 2, category: { super_category: { name: 'Revenue from State Sources' } } },
      { id: 3, category: { super_category: { name: 'Revenue from Federal Sources' } } },
      { id: 4, category: { super_category: { name: 'Other Financing Sources' } } },
    ];
    const rows = [
      { year: 2025, entry_type_id: 1, value: 100 },
      { year: 2025, entry_type_id: 1, value: 50 },
      { year: 2025, entry_type_id: 2, value: 30 },
      { year: 2025, entry_type_id: 3, value: 10 },
      { year: 2025, entry_type_id: 99, value: 5 },
    ];
    expect(revenueBySource(rows, entryTypes)).toEqual([{ year: 2025, local: 150, state: 30, federal: 10, other: 5 }]);
  });

  it('counts EFA students and estimates cost from per-student amounts', () => {
    const entryTypes = [
      { id: 1, name: 'Base Aid', year: 2026, value: 4000 },
      { id: 3, name: 'Special Education Aid', year: 2026, value: 2000 },
    ];
    const rows = [
      { year: 2026, entry_type_id: 1, value: 100 },
      { year: 2026, entry_type_id: 3, value: 10 },
      { year: 2027, entry_type_id: 1, value: 120 },
    ];
    expect(efaTotals(rows, entryTypes)).toEqual([
      { year: 2026, students: 100, estimatedCost: 420000 },
      // No 2027 amounts yet, so no cost estimate beyond zero
      { year: 2027, students: 120, estimatedCost: 0 },
    ]);
  });
});

describe('staff', () => {
  it('divides students by teachers for years that have both', () => {
    expect(studentsPerTeacher(series([[2024, 1500], [2025, 1400]]), series([[2025, 100], [2026, 90]]))).toEqual(
      series([[2025, 14]])
    );
  });
});

describe('formatting', () => {
  it('writes out school years', () => {
    expect(formatSchoolYear(2025)).toBe('2024-25');
    expect(formatSchoolYear(2000)).toBe('1999-00');
  });

  it('describes changes in words', () => {
    expect(describeChange(12.4)).toBe('up 12%');
    expect(describeChange(-3.6)).toBe('down 4%');
    expect(describeChange(0.2)).toBe('unchanged');
  });
});
