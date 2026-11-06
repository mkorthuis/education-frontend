import React from 'react';
import { Breakpoint, FormControl, MenuItem, Select } from '@mui/material';

interface ChartSelectProps<T extends string | number> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  /** Names the picker for screen readers, e.g. "Show EFA grants as" */
  label: string;
  /** Defaults to the district pages' picker size, a little narrower on phones so it fits beside the title */
  minWidth?: number | Partial<Record<Breakpoint, number>>;
}

/** The picker in a chart's or table's header, e.g. "# of Grants" or "Percentage". */
const ChartSelect = <T extends string | number>({ value, options, onChange, label, minWidth = { xs: 130, sm: 150 } }: ChartSelectProps<T>) => (
  <FormControl size="small" sx={{ minWidth }}>
    <Select value={value} onChange={event => onChange(event.target.value as T)} inputProps={{ 'aria-label': label }}>
      {options.map(option => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
    </Select>
  </FormControl>
);

export default ChartSelect;
