import { calculateInflationAdjustedAmount } from '@/utils/calculations';
import { Change, describeChange, formatDollars, formatSchoolYear } from './stateMetrics';
import type { TileDelta } from '@/components/ds';

// Plain-language wording for changes, shared by the overview tiles and each page's key figures

export const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** "Down 12% since 2014-15" */
export const changeText = (change: Change | null): string | undefined =>
  change ? `${capitalize(describeChange(change.percentChange))} since ${formatSchoolYear(change.from.year)}` : undefined;

/** Change in percentage points, for rates: "Up 2 percentage points since the class of 2015" */
export const pointChangeText = (change: Change | null, since: string): string | undefined => {
  if (!change) return undefined;
  const points = Math.round(change.change);
  if (points === 0) return `Unchanged since ${since}`;
  return `${points > 0 ? 'Up' : 'Down'} ${Math.abs(points)} percentage point${Math.abs(points) === 1 ? '' : 's'} since ${since}`;
};

/** Percent change once the earlier amount is restated in the later year's dollars. */
export const realPercentChange = (change: Change): number => {
  const adjustedFrom = calculateInflationAdjustedAmount(change.from.value, change.from.year, change.to.year);
  return ((change.to.value - adjustedFrom) / adjustedFrom) * 100;
};

/** "Up 16% after inflation" */
export const realChangeText = (change: Change | null): string | undefined =>
  change ? `${capitalize(describeChange(realPercentChange(change)))} after inflation` : undefined;

/** "24/25", the short school-year form the district pages use. */
export const shortYear = (year: number): string => `${String(year - 1).slice(-2)}/${String(year).slice(-2)}`;

/** Tile dollar amounts, short enough to leave room for the change: "$4.14B", "$110.2M", "$22,699" */
export const formatDollarsShort = (value: number, digits?: number): string => {
  if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(digits ?? 2)}B`;
  if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(digits ?? 1)}M`;
  return formatDollars(value);
};

/** Phone tiles' values in thousands: 149,403 reads "149K"; with one decimal, 12,500 reads "12.5K" */
export const formatThousands = (value: number, decimals = 0): string =>
  `${(value / 1000).toFixed(decimals).replace(/\.0$/, '')}K`;

/**
 * A change for an overview tile: the direction, the size shown beside the arrow ("4%"), the
 * comparison year shown under it ("17/18", or a class year such as "2015") and the whole change
 * in words for screen readers. Rates change in percentage points, also shown with "%".
 */
export const tileDelta = (
  change: Change | null,
  {
    unit,
    classYears = false,
    higherIsBetter,
  }: {
    unit: 'percent' | 'points';
    classYears?: boolean;
    /** Set only where a rise is generally good (true) or bad (false); otherwise the change is neutral */
    higherIsBetter?: boolean;
  }
): TileDelta | undefined => {
  if (!change) return undefined;
  const signed = Math.round(unit === 'percent' ? change.percentChange : change.change);
  const size = Math.abs(signed);
  const since = classYears ? String(change.from.year) : shortYear(change.from.year);
  const spokenSince = classYears ? `the class of ${change.from.year}` : formatSchoolYear(change.from.year);
  if (size === 0) return { direction: 'flat', tone: 'neutral', amount: '0%', since, spoken: `No change since ${spokenSince}` };
  const direction = signed > 0 ? 'up' : 'down';
  const tone = higherIsBetter === undefined ? 'neutral' : (direction === 'up') === higherIsBetter ? 'good' : 'bad';
  const spokenSize = unit === 'percent' ? `${size}%` : `${size} percentage point${size === 1 ? '' : 's'}`;
  return { direction, tone, amount: `${size}%`, since, spoken: `${direction === 'up' ? 'Up' : 'Down'} ${spokenSize} since ${spokenSince}` };
};
