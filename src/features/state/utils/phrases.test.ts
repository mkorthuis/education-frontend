import { describe, expect, it } from 'vitest';
import { shortYear, tileDelta } from './phrases';

const change = (fromYear: number, from: number, to: number) => ({
  from: { year: fromYear, value: from },
  to: { year: 2025, value: to },
  change: to - from,
  percentChange: ((to - from) / from) * 100,
});

describe('overview tile changes', () => {
  it('writes school years in the short form', () => {
    expect(shortYear(2026)).toBe('25/26');
    expect(shortYear(2000)).toBe('99/00');
  });

  it('gives amounts as a percent change since the short comparison year', () => {
    expect(tileDelta(change(2015, 14000, 21000), { unit: 'percent' }))
      .toEqual({ direction: 'up', tone: 'neutral', amount: '50%', since: '14/15', spoken: 'Up 50% since 2014-15' });
  });

  it('marks a change good or bad only where higher is generally better or worse', () => {
    expect(tileDelta(change(2018, 48, 44), { unit: 'points', higherIsBetter: true })).toMatchObject({ direction: 'down', tone: 'bad' });
    expect(tileDelta(change(2018, 44, 48), { unit: 'points', higherIsBetter: true })).toMatchObject({ direction: 'up', tone: 'good' });
    expect(tileDelta(change(2018, 10, 8), { unit: 'percent', higherIsBetter: false })).toMatchObject({ direction: 'down', tone: 'good' });
    expect(tileDelta(change(2018, 44, 44), { unit: 'points', higherIsBetter: true })).toMatchObject({ direction: 'flat', tone: 'neutral' });
  });

  it('gives rates in percentage points, shown with "%" and spoken in full', () => {
    expect(tileDelta(change(2018, 48, 44), { unit: 'points' }))
      .toEqual({ direction: 'down', tone: 'neutral', amount: '4%', since: '17/18', spoken: 'Down 4 percentage points since 2017-18' });
    expect(tileDelta(change(2015, 88, 89), { unit: 'points', classYears: true }))
      .toEqual({ direction: 'up', tone: 'neutral', amount: '1%', since: '2015', spoken: 'Up 1 percentage point since the class of 2015' });
  });

  it('shows no change as flat, and nothing without a change', () => {
    expect(tileDelta(change(2015, 100, 100.2), { unit: 'percent' })).toMatchObject({ direction: 'flat', amount: '0%' });
    expect(tileDelta(null, { unit: 'percent' })).toBeUndefined();
  });
});
