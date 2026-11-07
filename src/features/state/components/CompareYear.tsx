import React, { useMemo, useState } from 'react';
import ChartSelect from './ChartSelect';
import { StateTableColumn } from './StateTable';
import { formatCount, formatSchoolYear, formatSignedPercent, percentChange, YearRow } from '../utils/stateMetrics';
import { shortYear } from '../utils/phrases';

// The year a compare table starts on until the reader picks another, as the other State pages compare
// with 2014-15; tables whose data starts later start on their earliest year
export const DEFAULT_COMPARE_YEAR = 2015;

/**
 * A compare table's years: every year before the latest, newest first, and the one compared with
 * (the reader's pick, 2014-15, or the earliest year).
 */
export const useCompareYear = (dataYears: number[]) => {
  const yearsKey = dataYears.join(',');
  const years = useMemo(
    () => [...new Set(dataYears)].sort((a, b) => b - a).slice(1),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [yearsKey]
  );
  const [picked, setPicked] = useState<number | null>(null);
  const year = picked !== null && years.includes(picked)
    ? picked
    : years.includes(DEFAULT_COMPARE_YEAR) ? DEFAULT_COMPARE_YEAR : years[years.length - 1] ?? null;
  return { years, year, setYear: setPicked };
};

/** The district Staff page's year picker: "Compare 14/15" */
export const CompareYearPicker: React.FC<{ years: number[]; year: number; onChange: (year: number) => void; label: string }> = ({ years, year, onChange, label }) => (
  <ChartSelect
    value={year}
    options={years.map(option => ({ value: option, label: `Compare ${shortYear(option)}` }))}
    onChange={onChange}
    label={label}
    minWidth={150}
  />
);

/** A compare table's row: a type's count in the latest year and the year compared with */
export interface ComparisonRow {
  type: string;
  count: number;
  before: number | null;
  change: number | null;
}

/**
 * The latest year by type next to an earlier year, with the percent change, like the district Staff
 * page's tables. Types come in `order` when given (names as in the data), otherwise largest first.
 */
export const compareByType = (
  byYear: YearRow[],
  compareYear: number | null,
  label: (type: string) => string,
  totalLabel: string,
  order?: string[]
) => {
  const latest = byYear[byYear.length - 1];
  if (!latest) return { year: null as number | null, rows: [] as ComparisonRow[], total: undefined };
  const earlier = byYear.find(row => row.year === compareYear);
  const types = order ?? Object.keys(latest).filter(key => key !== 'year');
  const rows: ComparisonRow[] = types
    .map(type => {
      const count = latest[type] ?? 0;
      const before = earlier ? earlier[type] ?? null : null;
      return { type: label(type), count, before, change: percentChange(count, before) };
    })
    .sort((a, b) => (order ? 0 : b.count - a.count));
  const count = rows.reduce((sum, row) => sum + row.count, 0);
  const before = earlier ? rows.reduce((sum, row) => sum + (row.before ?? 0), 0) : null;
  const total: ComparisonRow | undefined = rows.length ? { type: totalLabel, count, before, change: percentChange(count, before) } : undefined;
  return { year: latest.year as number | null, rows, total };
};

/**
 * Type, the latest year, the year compared with (a dash where it has no count) and the change.
 * Counts by default; `format` for other values, e.g. dollars.
 */
export const comparisonColumns = <T extends ComparisonRow>(
  typeLabel: string,
  year: number | null,
  compareYear: number | null,
  renderType?: (row: T) => React.ReactNode,
  format: (value: number) => string = formatCount
): StateTableColumn<T>[] => [
  { key: 'type', label: typeLabel, render: renderType },
  ...(year ? [{
    key: 'count',
    label: formatSchoolYear(year),
    shortLabel: shortYear(year),
    align: 'right' as const,
    format: (row: T) => format(row.count),
  }] : []),
  ...(compareYear !== null ? [{
    key: 'before',
    label: formatSchoolYear(compareYear),
    shortLabel: shortYear(compareYear),
    align: 'right' as const,
    format: (row: T) => (row.before === null ? '—' : format(row.before)),
  }] : []),
  { key: 'change', label: '% Change', shortLabel: 'Change', align: 'right', format: row => formatSignedPercent(row.change) },
];
