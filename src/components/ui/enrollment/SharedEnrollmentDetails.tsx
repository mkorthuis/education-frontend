import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import { ChartHeader } from '@/features/state/components/chartText';
import ChartSelect from '@/features/state/components/ChartSelect';

// Define interface for Grade type
interface Grade {
  id: number;
  name: string;
}

// Define the structure for enrollment row data
interface EnrollmentRow {
  gradeName: string;
  gradeId: number;
  studentCount: number;
}

export interface SharedEnrollmentDetailsProps {
  title: string;
  subtitle?: string;
  enrollmentRows: EnrollmentRow[];
  availableYears: number[];
  selectedYear: number;
  onYearChange: (year: number) => void;
}

const SharedEnrollmentDetails: React.FC<SharedEnrollmentDetailsProps> = ({
  title,
  subtitle,
  enrollmentRows,
  availableYears,
  selectedYear,
  onYearChange
}) => {

  // Calculate total
  const totalStudentCount = enrollmentRows.reduce((sum, row) => sum + row.studentCount, 0);

  const yearOptions = availableYears.map(year => ({ value: year, label: formatFiscalYear(year) ?? String(year) }));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* Titled like the charts, with the same year picker, on phones too */}
      <ChartHeader
        title={title}
        subtitle={subtitle}
        actions={<ChartSelect value={selectedYear} options={yearOptions} onChange={onYearChange} label="School year" />}
      />

      {enrollmentRows.length > 0 ? (
        <TableContainer sx={{ bgcolor: 'grey.100', border: 1, borderColor: 'grey.300', borderRadius: 1 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'grey.200', '& th': { borderBottom: '2px solid', borderColor: 'grey.400', fontWeight: 'bold' } }}>
              <TableRow>
                <TableCell>Grade</TableCell>
                <TableCell align="right">Students</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {enrollmentRows.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.gradeName}</TableCell>
                  <TableCell align="right">{row.studentCount}</TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ bgcolor: 'grey.200', '& td': { borderTop: '2px solid', borderColor: 'grey.400' } }}>
                <TableCell>Total Students</TableCell>
                <TableCell align="right">{totalStudentCount}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body1" color="text.secondary">
            No enrollment data available
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SharedEnrollmentDetails; 