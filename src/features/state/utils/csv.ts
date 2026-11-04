// CSV export for the State pages' charts and tables

const escapeCell = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const toCsv = (header: string[], rows: unknown[][]): string =>
  [header, ...rows].map(row => row.map(escapeCell).join(',')).join('\n');

export const downloadCsv = (filename: string, header: string[], rows: unknown[][]) => {
  const blob = new Blob([toCsv(header, rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
