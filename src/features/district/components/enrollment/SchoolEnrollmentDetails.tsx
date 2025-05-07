import React, { useMemo, useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, useTheme, useMediaQuery, FormControl, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import { FISCAL_YEAR } from '@/utils/environment';
import { 
  ENROLLMENT_MEASUREMENT_TYPES, 
  ENROLLMENT_MEASUREMENT_TYPE_NAMES, 
  ENROLLMENT_MEASUREMENT_TYPE_ORDER,
  processEnrollmentMeasurements
} from '@/features/district/utils/enrollmentDataProcessing';
import { Measurement } from '@/store/slices/measurementSlice';

// Add tableStyles
const tableStyles = {
  yearSelect: {
    minWidth: 40,
    '& .MuiSelect-select': {
      textAlign: 'right',
    }
  },
  selectInput: (theme: any) => ({
    color: theme.palette.primary.main,
    marginTop: '5px',
    fontWeight: 500,
    height: '20px',
    '&:hover': {
      color: theme.palette.primary.dark
    },
    '& .MuiSvgIcon-root': {
      color: theme.palette.primary.main,
      '&:hover': {
        color: theme.palette.primary.dark
      }
    }
  })
};

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

  // Handle year change
  const handleYearChange = (event: SelectChangeEvent<number>) => {
    setSelectedYear(Number(event.target.value));
  };

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
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row', 
        alignItems: isMobile ? 'center' : 'center', 
        justifyContent: 'space-between',
        mb: 2 
      }}>
        <Box sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: isMobile ? 'row' : 'column',
          alignItems: isMobile ? 'center' : 'flex-start',
          mb: isMobile ? 0 : 0,
          width: '100%'
        }}>
          {isMobile ? (
            <>
              <FormControl 
                size="small" 
                sx={{ 
                  minWidth: 50,
                  mr: 1
                }}
              >
                <Select
                  value={selectedYear}
                  onChange={handleYearChange}
                  variant="standard"
                  sx={tableStyles.selectInput(theme)}
                  MenuProps={{
                    PaperProps: {
                      sx: { maxHeight: 300 }
                    }
                  }}
                >
                  {availableYears.map((year) => (
                    <MenuItem 
                      key={year} 
                      value={year}
                      sx={{
                        fontWeight: 500
                      }}
                    >
                      {formatFiscalYear(year)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontWeight: 'medium'
                }} 
              >
                District School Enrollment Breakdown
              </Typography>
            </>
          ) : (
            <>
              <Typography 
                variant="body1" 
                sx={{ 
                  textAlign: "left",
                  width: "100%",
                  fontWeight: 'medium'
                }} 
              >
                District School Enrollment
              </Typography>
              <Typography
                variant="body2" 
                sx={{ 
                  textAlign: "left",
                  width: "100%",
                  fontWeight: 'medium',
                  fontStyle: 'italic',
                  color: 'text.secondary'
                }}
              >
                By Category
              </Typography>
            </>
          )}
        </Box>

        {!isMobile && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            width: 'auto',
            flexDirection: 'row',
            justifyContent: 'flex-end'
          }}>
            <FormControl 
              size="small" 
              sx={{ 
                minWidth: 150,
                ml: 2,
              }}
            >
              <Select
                value={selectedYear}
                onChange={handleYearChange}
                sx={{ 
                  bgcolor: 'rgba(0, 0, 0, 0.08)',
                  '&.Mui-focused': {
                    bgcolor: 'rgba(0, 0, 0, 0.08)'
                  },
                  border: '1px solid rgba(0, 0, 0, 0.12)',
                  borderRadius: '4px',
                  '& .MuiOutlinedInput-notchedOutline': { 
                    border: 'none' 
                  },
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.12)'
                  }
                }}
              >
                {availableYears.map((year) => (
                  <MenuItem 
                    key={year} 
                    value={year}
                    sx={{
                      fontWeight: 500
                    }}
                  >
                    {formatFiscalYear(year)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}
      </Box>

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