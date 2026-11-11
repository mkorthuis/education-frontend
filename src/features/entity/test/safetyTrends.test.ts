import { describe, expect, it } from 'vitest';
import { countsByYear, entityOnly, ratesByYear } from '../components/safety/category/subCategory/safetyTrends';

const suspensions = [
  { year: 2024, count: 30, type: 'in' },
  { year: 2024, count: 20, type: 'out' },
  { year: 2025, count: 10, type: 'in' },
];

describe('safety trend rates', () => {
  it("sums a year's rows, or those picked, and has no count for a year with none", () => {
    const all = countsByYear(suspensions, row => row.count);
    const outOfSchool = countsByYear(suspensions, row => row.count, row => row.type === 'out');
    expect([all(2024), all(2025), all(2023)]).toEqual([50, 10, null]);
    // 2025 reported in-school suspensions only, so none out of school
    expect([outOfSchool(2024), outOfSchool(2025)]).toEqual([20, 0]);
  });

  it("gives the place's and the state's rate per 100 students, oldest year first", () => {
    const rows = ratesByYear(
      [2025, 2024, 2024],
      countsByYear(suspensions, row => row.count),
      year => (year === 2024 ? 1500 : null),
      [{ year: 2024, total_enrollment: 1000 }, { year: 2025, total_enrollment: 800 }],
      [{ year: 2024, total_enrollment: 30000 }, { year: 2025, total_enrollment: 30000 }]
    );
    // No state count for 2025, so no state rate rather than a rate of zero
    expect(rows).toEqual([
      { year: 2024, entity: 5, state: 5 },
      { year: 2025, entity: 1.25, state: null },
    ]);
    expect(entityOnly(rows)).toEqual([{ year: 2024, entity: 5 }, { year: 2025, entity: 1.25 }]);
  });

  it('leaves a year without enrollment unrated', () => {
    const rows = ratesByYear([2024], () => 7, () => 9, [], [{ year: 2024, total_enrollment: 0 }], 1);
    expect(rows).toEqual([{ year: 2024, entity: null, state: null }]);
  });
});
