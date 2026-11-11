import { describe, expect, it } from 'vitest';
import { countsByYear, entityOnly, ratesByYear } from '../components/safety/category/subCategory/safetyTrends';

const suspensions = [
  { year: 2025, count: 10, type: 'in' },
  { year: 2024, count: 30, type: 'in' },
  { year: 2024, count: 20, type: 'out' },
];

describe('safety trend rates', () => {
  it("totals each year's rows, or those picked", () => {
    expect(countsByYear(suspensions, row => row.count)).toEqual(new Map([[2025, 10], [2024, 50]]));
    // 2025 reported in-school suspensions only, so none out of school
    expect(countsByYear(suspensions, row => row.count, row => row.type === 'out')).toEqual(new Map([[2025, 0], [2024, 20]]));
  });

  it("gives the place's and the state's rate per 100 students, oldest year first", () => {
    const rows = ratesByYear(
      countsByYear(suspensions, row => row.count),
      new Map([[2024, 1500]]),
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
    const rows = ratesByYear(new Map([[2024, 7]]), new Map([[2024, 9]]), [], [{ year: 2024, total_enrollment: 0 }], 1);
    expect(rows).toEqual([{ year: 2024, entity: null, state: null }]);
  });
});
