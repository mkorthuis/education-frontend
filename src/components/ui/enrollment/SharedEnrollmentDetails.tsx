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
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';

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

// Add tableStyles at the top of the file after imports
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Calculate total
  const totalStudentCount = enrollmentRows.reduce((sum, row) => sum + row.studentCount, 0);

  // Handle year selection change
  const handleYearChange = (event: SelectChangeEvent<number>) => {
    onYearChange(Number(event.target.value));
  };

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
                {title}
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
                {title}
              </Typography>
              {subtitle && (
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
                  {subtitle}
                </Typography>
              )}
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