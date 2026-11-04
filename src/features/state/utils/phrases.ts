import { calculateInflationAdjustedAmount } from '@/utils/calculations';
import { Change, describeChange, formatSchoolYear } from './stateMetrics';

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
