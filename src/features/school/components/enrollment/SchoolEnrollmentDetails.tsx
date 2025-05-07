import React, { useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
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
import { SchoolEnrollmentData } from '@/services/api/endpoints/enrollments';
import { FISCAL_YEAR } from '@/utils/environment';
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

export interface SchoolEnrollmentDetailsProps {
  schoolId?: number;
  enrollmentData?: SchoolEnrollmentData[];
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

/**
 * Component that displays detailed enrollment information for a school
 */
const SchoolEnrollmentDetails: React.FC<SchoolEnrollmentDetailsProps> = ({ 
  schoolId, 
  enrollmentData = []
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // TODO: grades should be pulled from the API.  /api/v1/location/grade
  const grades: Grade[] = [
    { id: 2, name: 'Kindergarten' },
    { id: 3, name: 'Grade 1' },
    { id: 4, name: 'Grade 2' },
    { id: 5, name: 'Grade 3' },
    { id: 6, name: 'Grade 4' },
    { id: 7, name: 'Grade 5' },
    { id: 8, name: 'Grade 6' },
    { id: 9, name: 'Grade 7' },
    { id: 10, name: 'Grade 8' },
    { id: 11, name: 'Grade 9' },
    { id: 12, name: 'Grade 10' },
    { id: 13, name: 'Grade 11' },
    { id: 14, name: 'Grade 12' },
  ];
  
  // Get available years from enrollment data
  const availableYears = [...new Set(enrollmentData.map(item => item.year))].sort((a, b) => b - a);
  const defaultYear = availableYears.length > 0 ? availableYears[0] : parseInt(FISCAL_YEAR);
  
  // State for selected year
  const [selectedYear, setSelectedYear] = React.useState<number>(defaultYear);
  
  // Handle year selection change
  const handleYearChange = (event: SelectChangeEvent<number>) => {
    setSelectedYear(Number(event.target.value));
  };
  
  // Process enrollment data into rows
  const enrollmentRows = useMemo(() => {
    if (!enrollmentData.length) return [];

    // Filter to selected year data
    const yearData = enrollmentData.filter(item => item.year === selectedYear);
    
    // Create a map of grade IDs to enrollment data
    const gradeMap: Record<number, number> = {};
    yearData.forEach(item => {
      if (item.grade_id !== null) {
        if (!gradeMap[item.grade_id]) {
          gradeMap[item.grade_id] = 0;
        }
        gradeMap[item.grade_id] += item.enrollment || 0;
      }
    });
    
    // Create enrollment rows for each grade
    return grades
      .filter(grade => grade.id in gradeMap)
      .map(grade => ({
        gradeName: grade.name,
        gradeId: grade.id,
        studentCount: gradeMap[grade.id] || 0
      }))
      .sort((a, b) => {
        // Sort by grade level
        const aNum = a.gradeName.match(/\d+/);
        const bNum = b.gradeName.match(/\d+/);
        if (aNum && bNum) {
          return parseInt(aNum[0]) - parseInt(bNum[0]);
        }
        // Special case for Kindergarten
        if (a.gradeName === 'Kindergarten') return -1;
        if (b.gradeName === 'Kindergarten') return 1;
        return a.gradeName.localeCompare(b.gradeName);
      });
  }, [enrollmentData, selectedYear, grades]);
  
  // Calculate total
  const totalStudentCount = useMemo(() => 
    enrollmentRows.reduce((sum, row) => sum + row.studentCount, 0),
    [enrollmentRows]
  );

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
                Students By Grade
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
                Students By Grade
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

export default SchoolEnrollmentDetails; 