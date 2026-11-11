import { describe, expect, it } from 'vitest';
import { totalsByYear } from '@/features/state/utils/stateMetrics';
import { entityOnly, ratesByYear } from '../trends';

describe('district and school rates', () => {
  it("gives the place's and the state's rate per 100 students for each year the place has", () => {
    const suspensions = [{ year: 2025, count: 10 }, { year: 2024, count: 30 }, { year: 2024, count: 20 }];
    const rows = ratesByYear(
      totalsByYear(suspensions, row => row.count),
      [{ year: 2023, value: 900 }, { year: 2024, value: 1500 }],
      [{ year: 2024, value: 1000 }, { year: 2025, value: 800 }],
      [{ year: 2023, value: 30000 }, { year: 2024, value: 30000 }, { year: 2025, value: 30000 }]
    );
    // Not 2023, which only the state has; no state count for 2025, so no state rate rather than zero
    expect(rows).toEqual([
      { year: 2024, entity: 5, state: 5 },
      { year: 2025, entity: 1.25, state: null },
    ]);
    expect(entityOnly(rows)).toEqual([{ year: 2024, entity: 5 }, { year: 2025, entity: 1.25 }]);
  });

  it('leaves a year without enrollment unrated', () => {
    const rows = ratesByYear([{ year: 2024, value: 7 }], [{ year: 2024, value: 9 }], [], [{ year: 2024, value: 0 }]);
    expect(rows).toEqual([{ year: 2024, entity: null, state: null }]);
  });
});
