import React, { useMemo, useEffect } from 'react';
import { Box, Typography, FormControl, Select, MenuItem, SelectChangeEvent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,Dialog, DialogTitle, DialogContent, IconButton, Divider, useTheme, useMediaQuery } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentDistrict } from '@/store/slices/locationSlice';
import {
  selectTownEnrollment,
  selectStateTownEnrollment,
} from '@/store/slices/enrollmentSlice';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';

// Grade ID constants
const GRADE_IDS = {
  KINDERGARTEN: 2,
  GRADE_1: 3,
  GRADE_2: 4,
  GRADE_3: 5,
  GRADE_4: 6,
  GRADE_5: 7,
  GRADE_6: 8,
  GRADE_7: 9,
  GRADE_8: 10,
  GRADE_9: 11,
  GRADE_10: 12,
  GRADE_11: 13,
  GRADE_12: 14,
} as const;

// Grade name mapping
const GRADE_NAMES: { [key: number]: string } = {
  [GRADE_IDS.KINDERGARTEN]: 'Kindergarten',
  [GRADE_IDS.GRADE_1]: 'Grade 1',
  [GRADE_IDS.GRADE_2]: 'Grade 2',
  [GRADE_IDS.GRADE_3]: 'Grade 3',
  [GRADE_IDS.GRADE_4]: 'Grade 4',
  [GRADE_IDS.GRADE_5]: 'Grade 5',
  [GRADE_IDS.GRADE_6]: 'Grade 6',
  [GRADE_IDS.GRADE_7]: 'Grade 7',
  [GRADE_IDS.GRADE_8]: 'Grade 8',
  [GRADE_IDS.GRADE_9]: 'Grade 9',
  [GRADE_IDS.GRADE_10]: 'Grade 10',
  [GRADE_IDS.GRADE_11]: 'Grade 11',
  [GRADE_IDS.GRADE_12]: 'Grade 12',
};

interface EnrollmentSummaryProps {
  onDataChange?: (data: {
    currentClassSizes: { [key: number]: number };
    projectedClassSizes: { [key: number]: number };
    endYear: number;
    futureYear: number;
  }) => void;
}

// Helper function to calculate average
const calculateAverage = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
};

const EnrollmentSummary: React.FC<EnrollmentSummaryProps> = ({ onDataChange }) => {
  // Get district data from Redux store
  const district = useAppSelector(selectCurrentDistrict);
  const districtId = district?.id;
  
  // State for showing all grades
  const [showAllGrades, setShowAllGrades] = React.useState(false);
  
  // Get the already fetched enrollment data
  const townEnrollmentData = useAppSelector(state => 
    selectTownEnrollment(state, { district_id: districtId }));

  // Get available years from enrollment data
  const availableYears = useMemo(() => 
    [...new Set(townEnrollmentData.map(item => item.year))].sort((a, b) => b - a),
    [townEnrollmentData]
  );

  // State for selected years
  const [startYear, setStartYear] = React.useState<number>(() => {
    const latestYear = availableYears[0] || 0;
    return Math.max(latestYear - 5, availableYears[availableYears.length - 1] || 0);
  });
  const [endYear, setEndYear] = React.useState<number>(availableYears[0] || 0);
  const [futureYear, setFutureYear] = React.useState<number>(() => {
    const latestYear = availableYears[0] || 0;
    return latestYear + 1;
  });

  // State for opening methodology dialog
  const [openMethodology, setOpenMethodology] = React.useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Handle year selection changes
  const handleStartYearChange = (event: SelectChangeEvent<number>) => {
    const newStartYear = Number(event.target.value);
    setStartYear(newStartYear);
    // Ensure end year is not before start year
    if (newStartYear > endYear) {
      setEndYear(newStartYear);
    }
  };

  const handleEndYearChange = (event: SelectChangeEvent<number>) => {
    const newEndYear = Number(event.target.value);
    setEndYear(newEndYear);
    // Ensure start year is not after end year
    if (newEndYear < startYear) {
      setStartYear(newEndYear);
    }
  };

  const handleFutureYearChange = (event: SelectChangeEvent<number>) => {
    setFutureYear(Number(event.target.value));
  };

  // Generate future years for dropdown
  const futureYears = useMemo(() => {
    const latestYear = availableYears[0] || 0;
    return Array.from({ length: 15 }, (_, i) => latestYear + i + 1);
  }, [availableYears]);

  // Calculate average class sizes
  const calculateClassSizes = useMemo(() => {
    // Filter data for the selected year range
    const yearRangeData = townEnrollmentData.filter(
      item => item.year >= startYear && item.year <= endYear
    );

    // Calculate average Kindergarten class size across all towns
    const kindergartenData = yearRangeData.filter(item => item.grade_id === GRADE_IDS.KINDERGARTEN);
    const avgKindergartenSize = kindergartenData.length > 0
      ? kindergartenData.reduce((sum, item) => sum + (item.enrollment || 0), 0) / (endYear - startYear + 1)
      : 0;

    // Calculate average incoming (Grade 1) class size across all towns
    const grade1Data = yearRangeData.filter(item => item.grade_id === GRADE_IDS.GRADE_1);
    const avgGrade1Size = grade1Data.length > 0
      ? grade1Data.reduce((sum, item) => sum + (item.enrollment || 0), 0) / (endYear - startYear + 1)
      : 0;

    // Calculate average outgoing (Grade 12) class size across all towns
    const grade12Data = yearRangeData.filter(item => item.grade_id === GRADE_IDS.GRADE_12);
    const avgGrade12Size = grade12Data.length > 0
      ? grade12Data.reduce((sum, item) => sum + (item.enrollment || 0), 0) / (endYear - startYear + 1)
      : 0;

    return {
      avgKindergartenSize: Number(avgKindergartenSize.toFixed(2)),
      avgGrade1Size: Number(avgGrade1Size.toFixed(2)),
      avgGrade12Size: Number(avgGrade12Size.toFixed(2))
    };
  }, [townEnrollmentData, startYear, endYear]);

  // Calculate cohort changes
  const calculateCohortChanges = useMemo(() => {
    const changes: { [key: string]: number[] } = {};
    
    // Initialize changes object for each grade transition
    for (let grade = GRADE_IDS.GRADE_1; grade < GRADE_IDS.GRADE_12; grade++) {
      changes[`grade${grade}To${grade + 1}`] = [];
    }

    // For each year in the range (except the last year)
    for (let year = startYear; year < endYear; year++) {
      // For each grade transition
      for (let grade = GRADE_IDS.GRADE_1; grade < GRADE_IDS.GRADE_12; grade++) {
        // Get current year's enrollment for the next grade across all towns
        const currentYearNextGrade = townEnrollmentData
          .filter(item => item.year === year + 1 && item.grade_id === grade + 1)
          .reduce((sum, item) => sum + (item.enrollment || 0), 0);
        
        // Get previous year's enrollment for current grade across all towns
        const previousYearCurrentGrade = townEnrollmentData
          .filter(item => item.year === year && item.grade_id === grade)
          .reduce((sum, item) => sum + (item.enrollment || 0), 0);

        if (currentYearNextGrade > 0 && previousYearCurrentGrade > 0) {
          const change = currentYearNextGrade - previousYearCurrentGrade;
          changes[`grade${grade}To${grade + 1}`].push(change);
        }
      }
    }

    // Calculate averages for each transition
    const averages: { [key: string]: number } = {};
    Object.entries(changes).forEach(([key, values]) => {
      if (values.length > 0) {
        const average = values.reduce((sum, val) => sum + val, 0) / values.length;
        averages[key] = Number(average.toFixed(2));
      } else {
        averages[key] = 0;
      }
    });

    return averages;
  }, [townEnrollmentData, startYear, endYear]);


  // Helper function to format grade transition text
  const formatGradeTransition = (key: string) => {
    const [fromGrade, toGrade] = key.replace('grade', '').split('To');
    return `${GRADE_NAMES[Number(fromGrade)]} to ${GRADE_NAMES[Number(toGrade)]}`;
  };

  // Calculate enrollment projections
  const calculateProjections = useMemo(() => {
    // Get current year data and aggregate across towns
    const currentYearData = townEnrollmentData
      .filter(item => item.year === endYear)
      .reduce((acc, item) => {
        if (!acc[item.grade_id]) {
          acc[item.grade_id] = 0;
        }
        acc[item.grade_id] += item.enrollment || 0;
        return acc;
      }, {} as { [key: number]: number });
    
    // Calculate current class sizes
    const currentClassSizes: { [key: number]: number } = {};
    Object.entries(currentYearData).forEach(([gradeId, enrollment]) => {
      currentClassSizes[Number(gradeId)] = enrollment;
    });

    // Calculate average class sizes for K and G1 across all towns
    const avgKClass = calculateAverage(
      Object.values(townEnrollmentData
        .filter(item => 
          item.year >= startYear && 
          item.year <= endYear && 
          item.grade_id === GRADE_IDS.KINDERGARTEN
        )
        .reduce((acc, item) => {
          if (!acc[item.year]) {
            acc[item.year] = 0;
          }
          acc[item.year] += item.enrollment || 0;
          return acc;
        }, {} as { [key: number]: number }))
    );

    const avgG1Class = calculateAverage(
      Object.values(townEnrollmentData
        .filter(item => 
          item.year >= startYear && 
          item.year <= endYear && 
          item.grade_id === GRADE_IDS.GRADE_1
        )
        .reduce((acc, item) => {
          if (!acc[item.year]) {
            acc[item.year] = 0;
          }
          acc[item.year] += item.enrollment || 0;
          return acc;
        }, {} as { [key: number]: number }))
    );

    // Calculate projected class sizes
    const projectedClassSizes: { [key: number]: number } = {};
    const gradeChanges: { [key: number]: number } = {};

    // Calculate how many years to project
    const yearsToProject = futureYear - endYear;

    // Start with current enrollment
    let currentProjections = { ...currentClassSizes };

    // Project forward for each year
    for (let year = 0; year < yearsToProject; year++) {
      const nextYearProjections: { [key: number]: number } = {};

      // Use averages for K and G1
      nextYearProjections[GRADE_IDS.KINDERGARTEN] = avgKClass;
      nextYearProjections[GRADE_IDS.GRADE_1] = avgG1Class;

      // Project grades 2-12 using current grade-1 numbers plus cohort changes
      for (let grade = GRADE_IDS.GRADE_1; grade < GRADE_IDS.GRADE_12; grade++) {
        const currentGradeEnrollment = currentProjections[grade] || 0;
        const changeKey = `grade${grade}To${grade + 1}`;
        const cohortChange = calculateCohortChanges[changeKey] || 0;
        nextYearProjections[grade + 1] = currentGradeEnrollment + cohortChange;
      }

      // Update current projections for next iteration
      currentProjections = nextYearProjections;
    }

    // Store final projections
    Object.assign(projectedClassSizes, currentProjections);

    // Calculate total enrollment
    const currentTotalEnrollment = Object.values(currentClassSizes).reduce((sum, val) => sum + val, 0);
    const projectedTotalEnrollment = Object.values(projectedClassSizes).reduce((sum, val) => sum + val, 0);

    return {
      avgKClass,
      avgG1Class,
      projectedClassSizes,
      gradeChanges,
      projectedTotalEnrollment,
      currentG12Class: currentClassSizes[GRADE_IDS.GRADE_12] || 0,
      currentTotalEnrollment,
      currentClassSizes
    };
  }, [townEnrollmentData, endYear, startYear, futureYear, calculateCohortChanges]);

  const handleOpenMethodology = () => setOpenMethodology(true);
  const handleCloseMethodology = () => setOpenMethodology(false);

  // Update parent component when data changes
  useEffect(() => {
    if (onDataChange) {
      onDataChange({
        currentClassSizes: calculateProjections.currentClassSizes,
        projectedClassSizes: calculateProjections.projectedClassSizes,
        endYear,
        futureYear
      });
    }
  }, [calculateProjections, endYear, futureYear, onDataChange, startYear]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* New Enrollment Projections Table */}
      <Box sx={{ mt: 2 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'left', 
          mb: 1,
          flexWrap: 'wrap',
          gap: 0.5
        }}>
          <Typography variant="body1">
            Projected Students in
          </Typography>
          <FormControl size="small" sx={{ minWidth: 40, '& .MuiSelect-select': { textAlign: 'right' } }}>
            <Select
              value={futureYear}
              onChange={handleFutureYearChange}
              variant="standard"
              sx={{
                color: (theme) => theme.palette.primary.main,
                marginTop: '5px',
                fontWeight: 500,
                height: '20px',
                '&:hover': {
                  color: (theme) => theme.palette.primary.dark
                },
                '& .MuiSvgIcon-root': {
                  color: (theme) => theme.palette.primary.main,
                  '&:hover': {
                    color: (theme) => theme.palette.primary.dark
                  }
                }
              }}
              MenuProps={{
                PaperProps: {
                  sx: { maxHeight: 300 }
                }
              }}
            >
              {futureYears.map((year) => (
                <MenuItem 
                  key={year} 
                  value={year}
                  sx={{ fontWeight: 500 }}
                >
                  {formatFiscalYear(year)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
            <Typography 
              variant="body1" 
              sx={{ 
                display: { xs: 'none', sm: 'block' }
              }}
            >
              Based on
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                display: { xs: 'block', sm: 'none' },
                fontStyle: 'italic'
              }}
            >
              Based on
            </Typography>
            <FormControl size="small" sx={{ minWidth: 40, '& .MuiSelect-select': { textAlign: 'right' } }}>
              <Select
                value={startYear}
                onChange={handleStartYearChange}
                variant="standard"
                sx={{
                  color: (theme) => theme.palette.primary.main,
                  marginTop: '5px',
                  fontWeight: 500,
                  height: '20px',
                  '&:hover': {
                    color: (theme) => theme.palette.primary.dark
                  },
                  '& .MuiSvgIcon-root': {
                    color: (theme) => theme.palette.primary.main,
                    '&:hover': {
                      color: (theme) => theme.palette.primary.dark
                    }
                  }
                }}
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
                    disabled={year > endYear}
                    sx={{ 
                      fontWeight: 500,
                      '&.Mui-disabled': {
                        opacity: 0.5
                      }
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
                display: { xs: 'none', sm: 'block' }
              }}
            >
              to
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                display: { xs: 'block', sm: 'none' },
                fontStyle: 'italic'
              }}
            >
              to
            </Typography>
            <FormControl size="small" sx={{ minWidth: 40, '& .MuiSelect-select': { textAlign: 'right' } }}>
              <Select
                value={endYear}
                onChange={handleEndYearChange}
                variant="standard"
                sx={{
                  color: (theme) => theme.palette.primary.main,
                  marginTop: '5px',
                  fontWeight: 500,
                  height: '20px',
                  '&:hover': {
                    color: (theme) => theme.palette.primary.dark
                  },
                  '& .MuiSvgIcon-root': {
                    color: (theme) => theme.palette.primary.main,
                    '&:hover': {
                      color: (theme) => theme.palette.primary.dark
                    }
                  }
                }}
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
                    disabled={year < startYear}
                    sx={{ 
                      fontWeight: 500,
                      '&.Mui-disabled': {
                        opacity: 0.5
                      }
                    }}
                  >
                    {formatFiscalYear(year)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography 
                variant="body1" 
                sx={{ 
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                Averages
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  display: { xs: 'block', sm: 'none' },
                  fontStyle: 'italic'
                }}
              >
                Averages
              </Typography>
              <IconButton
                onClick={handleOpenMethodology}
                sx={{ 
                  p: 0.5,
                  color: 'primary.main',
                  '&:hover': {
                    color: 'primary.dark'
                  }
                }}
              >
                <InfoOutlinedIcon sx={{ fontSize: '1.25rem' }} />
              </IconButton>
            </Box>
          </Box>
        </Box>
        <TableContainer component={Paper} sx={{ bgcolor: 'grey.100', border: 1, borderColor: 'grey.300', borderRadius: 1 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'grey.200', '& th': { borderBottom: '2px solid', borderColor: 'grey.400', fontWeight: 'bold' } }}>
              <TableRow>
                <TableCell></TableCell>
                <TableCell align="right">
                  <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Current ({formatFiscalYear(endYear)})</Box>
                  <Box sx={{ display: { xs: 'block', sm: 'none' } }}>{formatFiscalYear(endYear)}</Box>
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Projected ({formatFiscalYear(futureYear)})</Box>
                  <Box sx={{ display: { xs: 'block', sm: 'none' } }}>{formatFiscalYear(futureYear)}</Box>
                </TableCell>
                <TableCell align="right">Change</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>
                  <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Kindergarten</Box>
                  <Box sx={{ display: { xs: 'block', sm: 'none' } }}>K</Box>
                </TableCell>
                <TableCell align="right">
                  {(() => {
                    const current = townEnrollmentData
                      .filter(item => item.year === endYear && item.grade_id === GRADE_IDS.KINDERGARTEN)
                      .reduce((sum, item) => sum + (item.enrollment || 0), 0);
                    return Math.round(current);
                  })()}
                </TableCell>
                <TableCell align="right">{calculateProjections.avgKClass.toFixed(2)}</TableCell>
                <TableCell 
                  align="right"
                  sx={{
                    color: (theme) => {
                      const current = townEnrollmentData
                        .filter(item => item.year === endYear && item.grade_id === GRADE_IDS.KINDERGARTEN)
                        .reduce((sum, item) => sum + (item.enrollment || 0), 0);
                      const change = calculateProjections.avgKClass - current;
                      if (change > 0) return theme.palette.success.main;
                      if (change < 0) return theme.palette.error.main;
                      return 'inherit';
                    }
                  }}
                >
                  {(() => {
                    const current = townEnrollmentData
                      .filter(item => item.year === endYear && item.grade_id === GRADE_IDS.KINDERGARTEN)
                      .reduce((sum, item) => sum + (item.enrollment || 0), 0);
                    const change = calculateProjections.avgKClass - current;
                    return change !== 0 ? `${change > 0 ? '+' : ''}${change.toFixed(2)}` : '-';
                  })()}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Grade 1</Box>
                  <Box sx={{ display: { xs: 'block', sm: 'none' } }}>G1</Box>
                </TableCell>
                <TableCell align="right">
                  {(() => {
                    const current = townEnrollmentData
                      .filter(item => item.year === endYear && item.grade_id === GRADE_IDS.GRADE_1)
                      .reduce((sum, item) => sum + (item.enrollment || 0), 0);
                    return Math.round(current);
                  })()}
                </TableCell>
                <TableCell align="right">{calculateProjections.avgG1Class.toFixed(2)}</TableCell>
                <TableCell 
                  align="right"
                  sx={{
                    color: (theme) => {
                      const current = townEnrollmentData
                        .filter(item => item.year === endYear && item.grade_id === GRADE_IDS.GRADE_1)
                        .reduce((sum, item) => sum + (item.enrollment || 0), 0);
                      const change = calculateProjections.avgG1Class - current;
                      if (change > 0) return theme.palette.success.main;
                      if (change < 0) return theme.palette.error.main;
                      return 'inherit';
                    }
                  }}
                >
                  {(() => {
                    const current = townEnrollmentData
                      .filter(item => item.year === endYear && item.grade_id === GRADE_IDS.GRADE_1)
                      .reduce((sum, item) => sum + (item.enrollment || 0), 0);
                    const change = calculateProjections.avgG1Class - current;
                    return change !== 0 ? `${change > 0 ? '+' : ''}${change.toFixed(2)}` : '-';
                  })()}
                </TableCell>
              </TableRow>
              {showAllGrades && (
                <>
                  {[4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((gradeId) => (
                    <TableRow key={gradeId}>
                      <TableCell>
                        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Grade {gradeId - 2}</Box>
                        <Box sx={{ display: { xs: 'block', sm: 'none' } }}>G{gradeId - 2}</Box>
                      </TableCell>
                      <TableCell align="right">
                        {(() => {
                          const current = townEnrollmentData
                            .filter(item => item.year === endYear && item.grade_id === gradeId)
                            .reduce((sum, item) => sum + (item.enrollment || 0), 0);
                          return Math.round(current);
                        })()}
                      </TableCell>
                      <TableCell align="right">
                        {calculateProjections.projectedClassSizes[gradeId]?.toFixed(2) || '-'}
                      </TableCell>
                      <TableCell 
                        align="right"
                        sx={{
                          color: (theme) => {
                            const current = townEnrollmentData
                              .filter(item => item.year === endYear && item.grade_id === gradeId)
                              .reduce((sum, item) => sum + (item.enrollment || 0), 0);
                            const projected = calculateProjections.projectedClassSizes[gradeId] || 0;
                            const change = projected - current;
                            if (change > 0) return theme.palette.success.main;
                            if (change < 0) return theme.palette.error.main;
                            return 'inherit';
                          }
                        }}
                      >
                        {(() => {
                          const current = townEnrollmentData
                            .filter(item => item.year === endYear && item.grade_id === gradeId)
                            .reduce((sum, item) => sum + (item.enrollment || 0), 0);
                          const projected = calculateProjections.projectedClassSizes[gradeId] || 0;
                          const change = projected - current;
                          return change !== 0 ? `${change > 0 ? '+' : ''}${change.toFixed(2)}` : '-';
                        })()}
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              )}
              <TableRow>
                <TableCell>
                  <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                    Grade 12
                    <Typography
                      component="button"
                      onClick={() => setShowAllGrades(!showAllGrades)}
                      sx={{
                        color: 'primary.main',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        border: 'none',
                        background: 'none',
                        padding: 0,
                        font: 'inherit',
                        ml: 1,
                        '&:hover': {
                          color: 'primary.dark',
                        },
                      }}
                    >
                      ({showAllGrades ? 'Show Less' : 'Show All Grades'})
                    </Typography>
                  </Box>
                  <Box sx={{ display: { xs: 'block', sm: 'none' } }}>G12</Box>
                  <Box sx={{ display: { xs: 'block', sm: 'none' }, mt: 0.5 }}>
                    <Typography
                      component="button"
                      onClick={() => setShowAllGrades(!showAllGrades)}
                      sx={{
                        color: 'primary.main',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        border: 'none',
                        background: 'none',
                        padding: 0,
                        font: 'inherit',
                        '&:hover': {
                          color: 'primary.dark',
                        },
                      }}
                    >
                      ({showAllGrades ? 'Show Less' : 'Show All'})
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  {(() => {
                    const current = townEnrollmentData
                      .filter(item => item.year === endYear && item.grade_id === GRADE_IDS.GRADE_12)
                      .reduce((sum, item) => sum + (item.enrollment || 0), 0);
                    return Math.round(current);
                  })()}
                </TableCell>
                <TableCell align="right">{calculateProjections.projectedClassSizes[GRADE_IDS.GRADE_12].toFixed(2)}</TableCell>
                <TableCell 
                  align="right"
                  sx={{
                    color: (theme) => {
                      const current = townEnrollmentData
                        .filter(item => item.year === endYear && item.grade_id === GRADE_IDS.GRADE_12)
                        .reduce((sum, item) => sum + (item.enrollment || 0), 0);
                      const change = calculateProjections.projectedClassSizes[GRADE_IDS.GRADE_12] - current;
                      if (change > 0) return theme.palette.success.main;
                      if (change < 0) return theme.palette.error.main;
                      return 'inherit';
                    }
                  }}
                >
                  {(() => {
                    const current = townEnrollmentData
                      .filter(item => item.year === endYear && item.grade_id === GRADE_IDS.GRADE_12)
                      .reduce((sum, item) => sum + (item.enrollment || 0), 0);
                    const change = calculateProjections.projectedClassSizes[GRADE_IDS.GRADE_12] - current;
                    return change !== 0 ? `${change > 0 ? '+' : ''}${change.toFixed(2)}` : '-';
                  })()}
                </TableCell>
              </TableRow>
              <TableRow
                sx={{
                  '& td': {
                    borderTop: '2px solid',
                    borderColor: 'grey.400',
                    fontWeight: 'bold'
                  }
                }}
              >
                <TableCell>
                  <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Total Students</Box>
                  <Box sx={{ display: { xs: 'block', sm: 'none' } }}>Total</Box>
                </TableCell>
                <TableCell align="right">{Math.round(calculateProjections.currentTotalEnrollment)}</TableCell>
                <TableCell align="right">{calculateProjections.projectedTotalEnrollment.toFixed(2)}</TableCell>
                <TableCell 
                  align="right"
                  sx={{
                    color: (theme) => {
                      const change = calculateProjections.projectedTotalEnrollment - calculateProjections.currentTotalEnrollment;
                      if (change > 0) return theme.palette.success.main;
                      if (change < 0) return theme.palette.error.main;
                      return 'inherit';
                    }
                  }}
                >
                  {(() => {
                    const change = calculateProjections.projectedTotalEnrollment - calculateProjections.currentTotalEnrollment;
                    return change !== 0 ? `${change > 0 ? '+' : ''}${change.toFixed(2)}` : '-';
                  })()}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Dialog 
        open={openMethodology} 
        onClose={handleCloseMethodology}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          m: 0, 
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ width: '100%' }}>
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ 
                fontWeight: 500,
                mt: isMobile ? 0 : 1,
                mb: isMobile ? 0 : 0.5,
                lineHeight: isMobile ? 1.2 : 1.5,
                color: 'text.primary'
              }}
            >
              Enrollment Projection Methodology
            </Typography>
            {!isMobile && <Divider sx={{ mb: 2 }} />}
          </Box>
          <IconButton
            aria-label="close"
            onClick={handleCloseMethodology}
            sx={{
              color: (theme) => theme.palette.grey[500],
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Projections are calculated using a defined date/year range. Within that range:
          </Typography>
          
          <Box sx={{ mb: 4 }}>
            <Typography variant="body1" sx={{ 
              mb: 2,
              fontWeight: 'bold'
            }}>
              Kindergarten and Grade 1 Projections
            </Typography>
            <Typography variant="body1" sx={{ pl: 2 }}>
              Based on historical averages of kindergarten and grade 1 enrollment numbers. For example, if the average number of grade 1 students has been 50, the model assumes 50 for future projections.
            </Typography>
          </Box>

          <Box>
            <Typography variant="body1" sx={{ 
              mb: 2,
              fontWeight: 'bold'
            }}>
              Higher Grade Projections
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, pl: 2 }}>
              Calculated in two steps:
            </Typography>
            <Box sx={{ pl: 4 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                1. First, we determine the average change in enrollment as students matriculate to the next grade. For example, if there were 50 5th graders in 2022 but 53 6th graders in 2023, we assume future 5th grade classes will increase by 3 students as they move to grade 6.
              </Typography>
              <Typography variant="body1">
                2. Then, we apply these matriculation patterns to current enrollment counts to project future years.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default EnrollmentSummary; 