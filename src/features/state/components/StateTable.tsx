import React from 'react';
import { Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { downloadCsv } from '../utils/csv';

export interface StateTableColumn<T> {
  key: string;
  label: string;
  align?: 'left' | 'right';
  /** Display text; the CSV gets the raw value */
  format?: (row: T) => string;
  value?: (row: T) => unknown;
}

interface StateTableProps<T> {
  title?: string;
  subtitle?: string;
  columns: StateTableColumn<T>[];
  rows: T[];
  csvName?: string;
  emptyMessage?: string;
}

// Same look as the district EFA and staff tables
const tableStyles = {
  container: {
    backgroundColor: 'grey.100',
    border: 1,
    borderColor: 'grey.300',
    borderRadius: 1,
    overflowX: 'auto',
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

const rawValue = <T,>(column: StateTableColumn<T>, row: T) =>
  column.value ? column.value(row) : (row as Record<string, unknown>)[column.key];

function StateTable<T>({ title, subtitle, columns, rows, csvName, emptyMessage = 'No data available' }: StateTableProps<T>) {
  const handleDownload = () => {
    if (!csvName) return;
    downloadCsv(csvName, columns.map(column => column.label), rows.map(row => columns.map(column => rawValue(column, row))));
  };

  return (
    <Box>
      {(title || csvName) && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 1, flexWrap: 'wrap' }}>
          <Box>
            {title && <Typography variant="body1" sx={{ fontWeight: 'medium' }}>{title}</Typography>}
            {subtitle && (
              <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>{subtitle}</Typography>
            )}
          </Box>
          {csvName && rows.length > 0 && (
            <Button size="small" startIcon={<DownloadIcon fontSize="small" />} onClick={handleDownload}>
              CSV
            </Button>
          )}
        </Box>
      )}
      <TableContainer sx={tableStyles.container}>
        <Table size="small">
          <TableHead sx={tableStyles.head}>
            <TableRow>
              {columns.map(column => (
                <TableCell key={column.key} align={column.align ?? 'left'}>{column.label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody sx={tableStyles.body}>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ color: 'text.secondary' }}>{emptyMessage}</TableCell>
              </TableRow>
            ) : rows.map((row, index) => (
              <TableRow key={index}>
                {columns.map(column => (
                  <TableCell key={column.key} align={column.align ?? 'left'}>
                    {column.format ? column.format(row) : String(rawValue(column, row) ?? '')}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default StateTable;
