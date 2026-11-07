import { AskChart } from '@/services/api/endpoints/ask';
import { formatCompact, formatCompactDollars, formatCount, formatDollars, YearRow } from '@/features/state/utils/stateMetrics';

// How an answer's numbers are shown, by the unit the backend gives each chart or table column

/** "87.5%", "44%": one decimal only when the value isn't whole */
const percent = (value: number) => `${Number.isInteger(value) ? value : value.toFixed(1)}%`;

/** A value as the tooltip and table show it */
export const formatValue = (unit: string | null | undefined, value: number, compactDollars = false): string => {
  if (unit === 'percent') return percent(value);
  if (unit === 'dollars') return compactDollars || Math.abs(value) >= 1e6 ? formatCompactDollars(value) : formatDollars(value);
  if (unit === 'count') return formatCount(value);
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
};

/** A value as an axis tick shows it */
export const formatAxis = (unit: string | null | undefined, value: number): string => {
  if (unit === 'percent') return `${Math.round(value)}%`;
  if (unit === 'dollars') return formatCompactDollars(value);
  if (unit === 'count') return formatCompact(value);
  return String(value);
};

/** A table cell: numbers by unit, the state's "<10%" and other text as sent, "—" when empty */
export const formatCell = (unit: string | null | undefined, value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '—';
  return typeof value === 'number' ? formatValue(unit, value) : value;
};

/** The end year of a school year ("2024-25" -> 2025) or a class ("Class of 2025" -> 2025), else null */
export const yearOf = (label: string): number | null => {
  const schoolYear = /^(\d{4})-(\d{2})$/.exec(label.trim());
  if (schoolYear) return Number(schoolYear[1]) + 1;
  const classYear = /^Class of (\d{4})$/i.exec(label.trim());
  return classYear ? Number(classYear[1]) : null;
};

/**
 * A chart over years goes to the site's line chart; anything else (districts, groups, grades,
 * or a single point) is drawn as a bar list.
 */
export const chartShape = (chart: AskChart): 'years' | 'categories' =>
  chart.points.length > 1 && chart.points.every(point => yearOf(point.label) !== null) ? 'years' : 'categories';

/** A chart over years as the line chart's rows, keyed s0, s1, ... per series */
export const yearRows = (chart: AskChart): YearRow[] =>
  chart.points.map(point => {
    const row: YearRow = { year: yearOf(point.label) as number };
    chart.series.forEach((_, index) => { row[`s${index}`] = point.values[index] ?? null; });
    return row;
  });

/** "cost-per-student-concord" from a title, for CSV file names */
export const slug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'answer';
