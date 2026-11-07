import React, { useEffect, useId, useRef, useState } from 'react';
import { Box, Button, ButtonBase, SxProps, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Theme, Typography, useMediaQuery, useTheme } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { downloadCsv } from '../utils/csv';
import { ChartHeader, ChartNote, keepYearsTogether, visuallyHidden } from './chartText';

export interface StateTableColumn<T> {
  key: string;
  label: string;
  /** A shorter header for phones, e.g. "Total" for "Estimated Total"; the CSV keeps the label */
  shortLabel?: string;
  align?: 'left' | 'right';
  /** Display text; the CSV gets the raw value */
  format?: (row: T) => string;
  /** Shorter display text for phones, e.g. "$54.4M" for "$54.4 million" */
  shortFormat?: (row: T) => string;
  /** Display content beyond text, e.g. a name with a help icon; takes the place of format */
  render?: (row: T) => React.ReactNode;
  value?: (row: T) => unknown;
  /** Left out on phones to keep the table on screen; it stays in the CSV */
  hideOnPhone?: boolean;
}

interface StateTableProps<T> {
  title?: string;
  /** The title's heading level; h2 on the State pages, h3 inside an answer under its own h2 */
  titleComponent?: React.ElementType;
  /** A shorter title for phones, e.g. with the short year */
  shortTitle?: string;
  subtitle?: string;
  /** A shorter subtitle for phones */
  shortSubtitle?: string;
  /** Table caption for screen readers when there's no visible title (e.g. a chart's table view) */
  caption?: string;
  columns: StateTableColumn<T>[];
  rows: T[];
  /** A bold last row, e.g. the total */
  totalRow?: T;
  /** Groups rows under subheadings, e.g. "Race and ethnicity"; rows must already be in group order */
  sectionOf?: (row: T) => string;
  /**
   * Makes each section an accordion: its subheading becomes a row of the section's totals (this
   * row, from the section's rows) that opens to show the rows themselves. Sections start closed.
   */
  sectionSummary?: (section: string, rows: T[]) => T;
  /** Rows shown as subtotals: semibold, with a rule above (the total row stays heavier) */
  isSubtotal?: (row: T) => boolean;
  /** A leading row the others are read against, e.g. all students: bold, with a rule below */
  isHighlighted?: (row: T) => boolean;
  csvName?: string;
  emptyMessage?: string;
  note?: React.ReactNode;
  /** Narrow tables read better than ones stretched across the page */
  maxWidth?: number;
  /** A control shown before the CSV button, e.g. a picker for the year to compare with */
  control?: React.ReactNode;
}

// The same grey as the district tables
const SURFACE = '#f5f5f5';
const tableStyles = {
  container: {
    border: 1,
    borderColor: 'grey.300',
    borderRadius: 1,
    overflowX: 'auto',
    backgroundColor: SURFACE,
  },
  head: {
    backgroundColor: 'grey.200',
    '& th': {
      borderBottom: '2px solid',
      borderColor: 'grey.400',
      fontWeight: 'bold',
    },
  },
  body: {
    '& td': { fontVariantNumeric: 'tabular-nums' },
  },
};

// On phones: narrower cell padding, phone-hidden columns left out, and the row labels stay in view
// while a wide table scrolls
const cellSx = <T,>(column: StateTableColumn<T>, columnIndex: number, extra: SxProps<Theme> = {}): SxProps<Theme> => ({
  px: { xs: 1, sm: 2 },
  ...(column.hideOnPhone ? { display: { xs: 'none', sm: 'table-cell' } } : {}),
  ...(columnIndex === 0 ? { position: 'sticky', left: 0, zIndex: 1, backgroundColor: 'inherit' } : {}),
  ...(extra as object),
});

const rawValue = <T,>(column: StateTableColumn<T>, row: T) =>
  column.value ? column.value(row) : (row as Record<string, unknown>)[column.key];

// CSV values at two decimals at most, so shares don't come out as 64.51234567
const csvValue = (value: unknown) =>
  typeof value === 'number' && !Number.isInteger(value) ? Number(value.toFixed(2)) : value;

const cellText = <T,>(column: StateTableColumn<T>, row: T): React.ReactNode => {
  if (column.render) return column.render(row);
  const text = column.format ? column.format(row) : String(rawValue(column, row) ?? '');
  const short = column.shortFormat?.(row);
  // One text when the phone text is the same, e.g. a plan name that's already short
  if (short === undefined || short === text) return text;
  return (
    <>
      <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{text}</Box>
      <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>{short}</Box>
    </>
  );
};

function StateTable<T>({
  title,
  titleComponent,
  shortTitle,
  subtitle,
  shortSubtitle,
  caption,
  columns,
  rows,
  totalRow,
  sectionOf,
  sectionSummary,
  isSubtotal,
  isHighlighted,
  csvName,
  emptyMessage = 'No data available',
  note,
  maxWidth,
  control,
}: StateTableProps<T>) {
  const titleId = useId();
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));
  const allRows = totalRow ? [...rows, totalRow] : rows;

  // Say so when the table is wider than the screen; row labels stay put while it scrolls
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrolls, setScrolls] = useState(false);
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const measure = () => setScrolls(element.scrollWidth > element.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [rows.length, columns.length]);

  const handleDownload = () => {
    if (!csvName) return;
    const header = sectionOf ? ['Group', ...columns.map(column => column.label)] : columns.map(column => column.label);
    downloadCsv(csvName, header, allRows.map(row => [
      ...(sectionOf ? [row === totalRow ? '' : sectionOf(row)] : []),
      ...columns.map(column => csvValue(rawValue(column, row))),
    ]));
  };

  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const toggleSection = (name: string) => setOpenSections(open => {
    const next = new Set(open);
    if (next.has(name)) next.delete(name); else next.add(name);
    return next;
  });

  const bodyRows: React.ReactNode[] = [];
  let section: string | null = null;
  rows.forEach((row, index) => {
    const rowSection = sectionOf?.(row) ?? null;
    const accordion = Boolean(sectionSummary && rowSection);
    if (sectionOf && rowSection !== section) {
      section = rowSection;
      if (accordion && rowSection) {
        // The section's totals, its name a button that opens and closes the section
        const name = rowSection;
        const open = openSections.has(name);
        const summary = sectionSummary!(name, rows.filter(item => sectionOf(item) === name));
        bodyRows.push(
          <TableRow key={`section-${index}`} sx={{ backgroundColor: 'grey.100', '& td, & th': { fontWeight: 600 } }}>
            {columns.map((column, columnIndex) => (
              <TableCell
                key={column.key}
                align={column.align ?? 'left'}
                component={columnIndex === 0 ? 'th' : 'td'}
                scope={columnIndex === 0 ? 'row' : undefined}
                sx={cellSx(column, columnIndex, { whiteSpace: column.align === 'right' ? 'nowrap' : undefined })}
              >
                {columnIndex === 0 ? (
                  <ButtonBase
                    onClick={() => toggleSection(name)}
                    aria-expanded={open}
                    sx={{ font: 'inherit', fontWeight: 600, textAlign: 'left', gap: 0.5, ml: -0.5, borderRadius: 0.5 }}
                  >
                    <ExpandMoreIcon fontSize="small" sx={{ transition: 'transform 150ms', transform: open ? 'none' : 'rotate(-90deg)', color: 'text.secondary' }} />
                    {cellText(column, summary)}
                  </ButtonBase>
                ) : cellText(column, summary)}
              </TableCell>
            ))}
          </TableRow>
        );
      // An empty section name (e.g. "All students" at the top) gets no subheading
      } else if (rowSection) bodyRows.push(
        <TableRow key={`section-${index}`}>
          <TableCell component="th" scope="colgroup" colSpan={columns.length} sx={{ fontWeight: 600, backgroundColor: 'grey.100', color: 'text.secondary', py: 0.75, px: { xs: 1, sm: 2 } }}>
            {/* Stays in view while the table scrolls sideways */}
            <Box component="span" sx={{ position: 'sticky', left: { xs: 8, sm: 16 } }}>{rowSection}</Box>
          </TableCell>
        </TableRow>
      );
    }
    // A closed accordion section's rows stay out of the table
    if (accordion && rowSection && !openSections.has(rowSection)) return;
    const subtotal = isSubtotal?.(row) ?? false;
    const highlighted = isHighlighted?.(row) ?? false;
    bodyRows.push(
      <TableRow
        key={index}
        sx={{
          backgroundColor: SURFACE,
          ...(subtotal && { '& td, & th': { fontWeight: 600, borderTop: '1px solid', borderTopColor: 'grey.400' } }),
          // A thinner, darker rule than the header's, so the two don't read as the same line
          ...(highlighted && { '& td, & th': { fontWeight: 600, borderBottom: '1px solid', borderBottomColor: 'grey.500' } }),
        }}
      >
        {columns.map((column, columnIndex) => (
          <TableCell
            key={column.key}
            align={column.align ?? 'left'}
            component={columnIndex === 0 ? 'th' : 'td'}
            scope={columnIndex === 0 ? 'row' : undefined}
            sx={cellSx(column, columnIndex, {
              whiteSpace: column.key === 'year' || column.align === 'right' ? 'nowrap' : undefined,
              fontWeight: subtotal || highlighted ? 600 : 'normal',
              // Row labels keep a readable width when a wide table scrolls on a phone
              minWidth: columnIndex === 0 && columns.length > 3 ? 140 : undefined,
              // An accordion's rows sit in from its name
              ...(accordion && columnIndex === 0 ? { pl: { xs: 4, sm: 5 } } : {}),
            })}
          >
            {cellText(column, row)}
          </TableCell>
        ))}
      </TableRow>
    );
  });

  return (
    <Box sx={{ maxWidth, minWidth: 0 }}>
      {title && (
        <ChartHeader
          titleId={titleId}
          title={title ?? ''}
          component={titleComponent}
          shortTitle={shortTitle}
          subtitle={subtitle}
          shortSubtitle={shortSubtitle}
          // No CSV on phones, where a download is little use
          actions={control || (csvName && allRows.length > 0 && !isMobile) ? (
            <>
              {control}
              {csvName && allRows.length > 0 && !isMobile && (
                <Button
                  size="small"
                  startIcon={<DownloadIcon fontSize="small" />}
                  onClick={handleDownload}
                  aria-label={`Download ${title ?? 'table'} as CSV`}
                >
                  CSV
                </Button>
              )}
            </>
          ) : undefined}
        />
      )}
      {scrolls && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          Swipe the table sideways to see more columns <span aria-hidden>→</span>
        </Typography>
      )}
      <TableContainer ref={containerRef} sx={tableStyles.container}>
        <Table size="small" aria-labelledby={title ? titleId : undefined}>
          {!title && caption && <Box component="caption" sx={visuallyHidden}>{caption}</Box>}
          <TableHead sx={tableStyles.head}>
            <TableRow>
              {columns.map((column, columnIndex) => (
                <TableCell
                  key={column.key}
                  align={column.align ?? 'left'}
                  scope="col"
                  sx={cellSx(column, columnIndex, {
                    whiteSpace: column.align === 'right' && column.label.length <= 12 ? 'nowrap' : undefined,
                    // The sticky corner cell needs the header's own background, or scrolled columns show through
                    ...(columnIndex === 0 ? { backgroundColor: 'grey.200', zIndex: 2 } : {}),
                  })}
                >
                  {column.shortLabel ? (
                    <>
                      <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{keepYearsTogether(column.label)}</Box>
                      <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>{column.shortLabel}</Box>
                    </>
                  ) : keepYearsTogether(column.label)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody sx={tableStyles.body}>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ color: 'text.secondary' }}>{emptyMessage}</TableCell>
              </TableRow>
            ) : bodyRows}
            {totalRow && rows.length > 0 && (
              <TableRow sx={{ backgroundColor: SURFACE, '& td, & th': { fontWeight: 600, borderTop: '2px solid', borderTopColor: 'grey.400' } }}>
                {columns.map((column, columnIndex) => (
                  <TableCell
                    key={column.key}
                    align={column.align ?? 'left'}
                    component={columnIndex === 0 ? 'th' : 'td'}
                    scope={columnIndex === 0 ? 'row' : undefined}
                    sx={cellSx(column, columnIndex, { whiteSpace: column.align === 'right' ? 'nowrap' : undefined })}
                  >
                    {cellText(column, totalRow)}
                  </TableCell>
                ))}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {note && <ChartNote>{note}</ChartNote>}
    </Box>
  );
}

export default StateTable;
