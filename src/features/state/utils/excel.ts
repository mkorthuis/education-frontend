// Excel export for a whole State page: one workbook, a sheet per chart or table. The library loads
// only when someone downloads, so it isn't part of the page's own download.
import { trackEvent } from '@/utils/analytics';

export type ExcelValue = string | number | null | undefined;

export interface ExcelColumn {
  header: string;
  /** In characters; defaults to fit the header */
  width?: number;
  /** An Excel number format, e.g. "#,##0", "$#,##0" or "0.0%" (percentages as fractions: 0.231) */
  format?: string;
  /** Wrap long text, and line breaks ("\n"), within the column's width */
  wrap?: boolean;
}

export interface ExcelSheet {
  /** At most 31 characters, without : \ / ? * [ ] */
  name: string;
  /** Shown large above the table; defaults to the sheet name */
  title?: string;
  /** One line under the title saying what the table holds */
  subtitle?: string;
  columns: ExcelColumn[];
  rows: ExcelValue[][];
  /** Indexes of rows (in `rows`) shown as subtotals, in bold */
  subtotalRows?: number[];
  /** A bold last row, e.g. the total */
  totalRow?: ExcelValue[];
}

export const COUNT = '#,##0';
export const DOLLARS = '$#,##0';
export const PERCENT = '0.0%';

/** A percentage (23.1) as the fraction a PERCENT column takes (0.231); null when it isn't a number. */
export const asFraction = (value: unknown): number | null => (typeof value === 'number' ? value / 100 : null);

/**
 * The last sheet of a page's workbook: where and when it was downloaded, then `paragraphs` on the
 * sources and what the figures mean, in one wrapped cell, a paragraph per line.
 */
export const notesSheet = (subtitle: string, paragraphs: string[]): ExcelSheet => ({
  name: 'Notes',
  title: 'About This Data',
  subtitle,
  columns: [{ header: 'Notes', width: 100, wrap: true }],
  rows: [[[
    `From NH Education Facts (${window.location.href}), downloaded ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.`,
    ...paragraphs,
  ].join('\n\n')]],
});

// The site's colors: brand blue headers, light grey rules and bands
const BRAND = '#1976d2';
const RULE = '#d9d9d9';
const BAND = '#f5f8fc';
const TOTAL_FILL = '#eeeeee';
const MUTED = '#666666';

// Excel's default row height, in points, for one line of 11pt text
const LINE_HEIGHT = 15;

/** Lines a wrapped text takes in a column this many characters wide (a rough fit; Excel's own varies). */
const wrappedLines = (text: string, width: number) =>
  text.split('\n').reduce((lines, paragraph) => lines + Math.max(1, Math.ceil((paragraph.length * 1.1) / width)), 0);

const ruled = { borderStyle: 'thin', borderColor: RULE } as const;

const cell = (value: ExcelValue, column: ExcelColumn | undefined, style: Record<string, unknown> = {}) => {
  if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
    return { value: null, ...ruled, ...style };
  }
  if (typeof value === 'number') return { value, type: Number, format: column?.format, ...ruled, ...style };
  // Wrapped text gets a row tall enough to show all of it: Excel doesn't resize rows it opens
  const wrap = column?.wrap
    ? { wrap: true, alignVertical: 'top', height: LINE_HEIGHT * wrappedLines(value, column.width ?? 12) }
    : {};
  return { value, type: String, ...ruled, ...wrap, ...style };
};

// Title and subtitle sit in the first cell and run on over the empty cells to their right (merged
// cells would cut a long subtitle off at the table's edge)
const titleRows = (sheet: ExcelSheet) => {
  const filler = Array(sheet.columns.length - 1).fill(null);
  return [
    [{ value: sheet.title ?? sheet.name, type: String, fontSize: 14, fontWeight: 'bold', height: 22 }, ...filler],
    ...(sheet.subtitle ? [[{ value: sheet.subtitle, type: String, textColor: MUTED, fontStyle: 'italic' }, ...filler]] : []),
    [null, ...filler],
  ];
};

const header = (sheet: ExcelSheet) => sheet.columns.map(column => ({
  value: column.header,
  type: String,
  fontWeight: 'bold',
  textColor: '#ffffff',
  backgroundColor: BRAND,
  borderStyle: 'thin',
  borderColor: BRAND,
  wrap: true,
  alignVertical: 'center',
  // Number columns' headers line up with their numbers
  align: column.format ? 'right' : 'left',
  height: 32,
}));

/** Saves the sheets as one .xlsx file: a title over each table, headers that stay put while scrolling. */
export const downloadWorkbook = async (fileName: string, sheets: ExcelSheet[]) => {
  trackEvent('file_download', { file_name: fileName, file_extension: 'xlsx', page_path: window.location.pathname });
  const { default: writeExcelFile } = await import('write-excel-file/browser');
  await writeExcelFile(sheets.map(sheet => {
    const titles = titleRows(sheet);
    return {
      sheet: sheet.name,
      columns: sheet.columns.map(column => ({ width: column.width ?? Math.max(12, column.header.length + 2) })),
      stickyRowsCount: titles.length + 1,
      showGridLines: false,
      data: [
        ...titles,
        header(sheet),
        // Every other row banded, so long tables are easy to follow across
        ...sheet.rows.map((row, rowIndex) => row.map((value, index) =>
          cell(value, sheet.columns[index], {
            ...(rowIndex % 2 ? { backgroundColor: BAND } : {}),
            ...(sheet.subtotalRows?.includes(rowIndex) ? { fontWeight: 'bold' } : {}),
          }))),
        ...(sheet.totalRow
          ? [sheet.totalRow.map((value, index) => cell(value, sheet.columns[index], {
            fontWeight: 'bold', backgroundColor: TOTAL_FILL, topBorderStyle: 'medium', topBorderColor: '#999999',
          }))]
          : []),
      ],
    };
  }), { fontFamily: 'Calibri', fontSize: 11 }).toFile(fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`);
};
