import React, { useMemo, useState } from 'react';
import { FormControl, MenuItem, Select } from '@mui/material';
import { shortYear } from '../utils/phrases';

// The year a compare table starts on until the reader picks another, as the other State pages compare
// with 2014-15; tables whose data starts later start on their earliest year
const DEFAULT_COMPARE_YEAR = 2015;

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
  <FormControl size="small" sx={{ minWidth: 150 }}>
    <Select value={year} onChange={event => onChange(Number(event.target.value))} inputProps={{ 'aria-label': label }}>
      {years.map(option => (
        <MenuItem key={option} value={option}>Compare {shortYear(option)}</MenuItem>
      ))}
    </Select>
  </FormControl>
);
