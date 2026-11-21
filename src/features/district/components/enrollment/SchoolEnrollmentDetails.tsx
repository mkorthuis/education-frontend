import React, { useMemo, useState } from 'react';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, useTheme, useMediaQuery } from '@mui/material';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import { ChartHeader } from '@/features/state/components/chartText';
import ChartSelect from '@/features/state/components/ChartSelect';
import { FISCAL_YEAR } from '@/utils/environment';
import { 
  ENROLLMENT_MEASUREMENT_TYPES, 
  ENROLLMENT_MEASUREMENT_TYPE_NAMES, 
  ENROLLMENT_MEASUREMENT_TYPE_ORDER,
  processEnrollmentMeasurements
} from '@/features/district/utils/enrollmentDataProcessing';
import { Measurement } from '@/store/slices/measurementSlice';

interface SchoolEnrollmentDetailsProps {
  measurements?: Measurement[];
}

const MOBILE_NAMES = {
  [ENROLLMENT_MEASUREMENT_TYPES.TOTAL_ENROLLMENT]: 'Total Enrollment',
  [ENROLLMENT_MEASUREMENT_TYPES.ECONOMICALLY_DISADVANTAGED]: 'Low Income',
  [ENROLLMENT_MEASUREMENT_TYPES.ENGLISH_LANGUAGE_LEARNER]: 'ELL',
  [ENROLLMENT_MEASUREMENT_TYPES.STUDENTS_WITH_DISABILITY]: 'Student w/Disability'
} as const;

const SchoolEnrollmentDetails: React.FC<SchoolEnrollmentDetailsProps> = ({ 
  measurements = []
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const defaultFiscalYear = parseInt(FISCAL_YEAR);

  // Get available years
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    measurements.forEach(item => {
      years.add(parseInt(item.year));
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [measurements]);

  // State for selected year
  const [selectedYear, setSelectedYear] = useState<number>(defaultFiscalYear);

  const yearOptions = availableYears.map(year => ({ value: year, label: formatFiscalYear(year) ?? String(year) }));

  // Process data for the table
  const tableData = useMemo(() => {
    return ENROLLMENT_MEASUREMENT_TYPE_ORDER.map(typeId => {
      const item = measurements.find(
        item => parseInt(item.year) === selectedYear && 
        Number(item.measurement_type.id) === typeId
      );

      const value = item?.value || 0;

      return {
        name: isMobile 
          ? MOBILE_NAMES[typeId as keyof typeof MOBILE_NAMES]
          : ENROLLMENT_MEASUREMENT_TYPE_NAMES[typeId as keyof typeof ENROLLMENT_MEASUREMENT_TYPE_NAMES],
        value,
        isPercentage: typeId !== ENROLLMENT_MEASUREMENT_TYPES.TOTAL_ENROLLMENT,
        formatValue: (value: number) => {
          if (typeId === ENROLLMENT_MEASUREMENT_TYPES.TOTAL_ENROLLMENT) {
            return value.toLocaleString();
          }
          if (value <= 10) {
            return `<10%`;
          }
          if (value >= 90) {
            return `>90%`;
          }
          return `${value.toFixed(1)}%`;
        }
      };
    });
  }, [measurements, selectedYear, isMobile]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* Titled like the charts, with the same year picker, on phones too */}
      <ChartHeader
        title="District School Enrollment"
        shortTitle="School Enrollment"
        subtitle="By Category"
        actions={<ChartSelect value={selectedYear} options={yearOptions} onChange={setSelectedYear} label="School year" />}
      />

      <TableContainer component={Paper} sx={{ bgcolor: 'grey.100', border: 1, borderColor: 'grey.300', borderRadius: 1 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: 'grey.200', '& th': { borderBottom: '2px solid', borderColor: 'grey.400' } }}>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell align="right">Students</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tableData.map((row, index) => (
              <TableRow key={index}>
                <TableCell sx={{ 
                  fontWeight: row.name === 'Total Enrollment' ? 'bold' : 'normal',
                  fontStyle: row.name === 'Total Enrollment' ? 'normal' : 'italic'
                }}>
                  {row.name}
                </TableCell>
                <TableCell align="right" sx={{ 
                  fontWeight: row.name === 'Total Enrollment' ? 'bold' : 'normal',
                  fontStyle: row.name === 'Total Enrollment' ? 'normal' : 'italic'
                }}>
                  {row.formatValue(row.value)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default SchoolEnrollmentDetails; 