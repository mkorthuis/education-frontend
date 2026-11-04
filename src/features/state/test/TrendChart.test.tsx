import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TrendChart from '../components/TrendChart';
import { downloadCsv } from '../utils/csv';

vi.mock('../utils/csv', () => ({ downloadCsv: vi.fn(), toCsv: vi.fn() }));

const DATA = [
  { year: 2014, math: 60.123, reading: 70 },
  { year: 2015, math: 40, reading: 52.456 },
  { year: 2016, math: 42, reading: null },
];

const renderChart = (props: Partial<React.ComponentProps<typeof TrendChart>> = {}) =>
  render(
    <TrendChart
      title="Percent proficient"
      data={DATA}
      series={[{ key: 'math', name: 'Math' }, { key: 'reading', name: 'Reading' }]}
      format={value => `${value.toFixed(0)}%`}
      csvName="test"
      {...props}
    />
  );

describe('TrendChart', () => {
  it('writes CSV years as text plus a numeric end year, rounded values and units', async () => {
    renderChart({ csvUnit: '% proficient' });
    await userEvent.click(screen.getByRole('button', { name: 'Download Percent proficient as CSV' }));
    expect(downloadCsv).toHaveBeenCalledWith(
      'test',
      ['School year', 'End year', 'Math (% proficient)', 'Reading (% proficient)'],
      [['2013-14', 2014, 60.12, 70], ['2014-15', 2015, 40, 52.46], ['2015-16', 2016, 42, null]]
    );
  });

  it('describes the chart for screen readers and labels the figure with its title', () => {
    renderChart();
    const figure = screen.getByRole('figure', { name: 'Percent proficient' });
    expect(figure).toHaveAccessibleDescription('Line chart. Math: 60% in 2013-14 and 42% in 2015-16. Reading: 70% in 2013-14 and 52% in 2014-15. The table view lists every year.');
    expect(screen.getByText('Percent proficient').tagName).toBe('H2');
  });

  it('says when the axis does not start at zero', () => {
    renderChart({ axis: 'fit' });
    expect(screen.getByText('The vertical axis starts at 30%, not zero.')).toBeInTheDocument();
  });

  it('shows school years and a comparison in the table view', async () => {
    renderChart({ compare: { data: [{ year: 2016, math: 50, reading: 60 }], label: 'All students' } });
    await userEvent.click(screen.getByRole('button', { name: 'Table' }));
    expect(screen.getByRole('columnheader', { name: 'Math, all students' })).toBeInTheDocument();
    const latest = screen.getByText('2015-16').closest('tr')!;
    expect(latest).toHaveTextContent('2015-16' + '42%' + '—' + '50%' + '60%');
  });
});
