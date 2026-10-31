import React, { useMemo, useEffect } from 'react';
import { Box, Typography, FormControl, Select, MenuItem, SelectChangeEvent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, IconButton, Divider, useTheme, useMediaQuery, SxProps, Theme } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentSchool } from '@/store/slices/locationSlice';
import { selectSchoolEnrollment } from '@/store/slices/enrollmentSlice';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import {
  GRADE_IDS,
  EnrollmentProjectionSnapshot,
  formatChange,
  projectEnrollment
} from '@/utils/enrollmentProjection';

interface SchoolEnrollmentSummaryProps {
  onDataChange?: (data: EnrollmentProjectionSnapshot) => void;
}

// Shared styles for the three year dropdowns
const yearFormControlSx: SxProps<Theme> = { minWidth: 40, '& .MuiSelect-select': { textAlign: 'right' } };
const yearSelectSx: SxProps<Theme> = {
  color: (theme: Theme) => theme.palette.primary.main,
  marginTop: '5px',
  fontWeight: 500,
  height: '20px',
  '&:hover': {
    color: (theme: Theme) => theme.palette.primary.dark
  },
  '& .MuiSvgIcon-root': {
    color: (theme: Theme) => theme.palette.primary.main,
    '&:hover': {
      color: (theme: Theme) => theme.palette.primary.dark
    }
  }
};
const yearMenuProps = {
  PaperProps: {
    sx: { maxHeight: 300 }
  }
};
const yearMenuItemSx = {
  fontWeight: 500,
  '&.Mui-disabled': {
    opacity: 0.5
  }
};

// Green for growth, red for decline
const changeColorSx = (change: number): SxProps<Theme> => ({
  color: (theme: Theme) => {
    if (change > 0) return theme.palette.success.main;
    if (change < 0) return theme.palette.error.main;
    return 'inherit';
  }
});

// Inline label: body1 on desktop, italic body2 on mobile
const responsiveLabel = (text: string) => (
  <>
    <Typography
      variant="body1"
      sx={{
        display: { xs: 'none', sm: 'block' }
      }}
    >
      {text}
    </Typography>
    <Typography
      variant="body2"
      sx={{
        display: { xs: 'block', sm: 'none' },
        fontStyle: 'italic'
      }}
    >
      {text}
    </Typography>
  </>
);

// Full name on desktop, short name on mobile
const gradeLabel = (full: React.ReactNode, short: React.ReactNode) => (
  <>
    <Box sx={{ display: { xs: 'none', sm: 'block' } }}>{full}</Box>
    <Box sx={{ display: { xs: 'block', sm: 'none' } }}>{short}</Box>
  </>
);

interface ProjectionRowProps {
  key?: React.Key;
  sx?: SxProps<Theme>;
  label: React.ReactNode;
  current: number;
  projected: string;
  change: number;
}

const projectionRow = ({ key, sx, label, current, projected, change }: ProjectionRowProps) => (
  <TableRow key={key} sx={sx}>
    <TableCell>{label}</TableCell>
    <TableCell align="right">{Math.round(current)}</TableCell>
    <TableCell align="right">{projected}</TableCell>
    <TableCell
      align="right"
      sx={changeColorSx(change)}
    >
      {formatChange(change)}
    </TableCell>
  </TableRow>
);

const SchoolEnrollmentSummary: React.FC<SchoolEnrollmentSummaryProps> = ({ onDataChange }) => {
  // Get school data from Redux store
  const school = useAppSelector(selectCurrentSchool);
  const schoolId = school?.id;

  // Get supported grades from school data
  const supportedGrades = useMemo(() => {
    if (!school?.grades) return [];
    return school.grades.map(grade => grade.id);
  }, [school?.grades]);

  // Get the already fetched enrollment data
  const schoolEnrollmentData = useAppSelector(state =>
    selectSchoolEnrollment(state, { schoolId: schoolId || 0 }));

  // Get available years from enrollment data
  const availableYears = useMemo(() =>
    [...new Set(schoolEnrollmentData.map(item => item.year))].sort((a, b) => b - a),
    [schoolEnrollmentData]
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

  // Project enrollment for this school's grades (school rules)
  const projection = useMemo(
    () => projectEnrollment(schoolEnrollmentData, { startYear, endYear, futureYear }, supportedGrades),
    [schoolEnrollmentData, startYear, endYear, futureYear, supportedGrades]
  );

  const handleOpenMethodology = () => setOpenMethodology(true);
  const handleCloseMethodology = () => setOpenMethodology(false);

  // Update parent component when data changes
  useEffect(() => {
    if (onDataChange) {
      onDataChange({
        currentClassSizes: projection.currentClassSizes,
        projectedClassSizes: projection.projectedClassSizes,
        endYear,
        futureYear
      });
    }
  }, [projection, endYear, futureYear, onDataChange, startYear]);

  const kCurrent = projection.currentSum(GRADE_IDS.KINDERGARTEN);
  const g1Current = projection.currentSum(GRADE_IDS.GRADE_1);
  const g12Current = projection.currentSum(GRADE_IDS.GRADE_12);
  const g12Projected = projection.projectedClassSizes[GRADE_IDS.GRADE_12];

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
          <FormControl size="small" sx={yearFormControlSx}>
            <Select
              value={futureYear}
              onChange={handleFutureYearChange}
              variant="standard"
              sx={yearSelectSx}
              MenuProps={yearMenuProps}
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
            {responsiveLabel('Based on')}
            <FormControl size="small" sx={yearFormControlSx}>
              <Select
                value={startYear}
                onChange={handleStartYearChange}
                variant="standard"
                sx={yearSelectSx}
                MenuProps={yearMenuProps}
              >
                {availableYears.map((year) => (
                  <MenuItem
                    key={year}
                    value={year}
                    disabled={year > endYear}
                    sx={yearMenuItemSx}
                  >
                    {formatFiscalYear(year)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {responsiveLabel('to')}
            <FormControl size="small" sx={yearFormControlSx}>
              <Select
                value={endYear}
                onChange={handleEndYearChange}
                variant="standard"
                sx={yearSelectSx}
                MenuProps={yearMenuProps}
              >
                {availableYears.map((year) => (
                  <MenuItem
                    key={year}
                    value={year}
                    disabled={year < startYear}
                    sx={yearMenuItemSx}
                  >
                    {formatFiscalYear(year)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {responsiveLabel('Averages')}
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
              {/* Only the grades this school offers get a row */}
              {supportedGrades.includes(GRADE_IDS.KINDERGARTEN) && projectionRow({
                label: gradeLabel('Kindergarten', 'K'),
                current: kCurrent,
                projected: projection.avgKClass.toFixed(2),
                change: projection.avgKClass - kCurrent
              })}
              {supportedGrades.includes(GRADE_IDS.GRADE_1) && projectionRow({
                label: gradeLabel('Grade 1', 'G1'),
                current: g1Current,
                projected: projection.avgG1Class.toFixed(2),
                change: projection.avgG1Class - g1Current
              })}
              {[4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((gradeId) => {
                if (!supportedGrades.includes(gradeId)) return false;
                const current = projection.currentSum(gradeId);
                return projectionRow({
                  key: gradeId,
                  label: gradeLabel(<>Grade {gradeId - 2}</>, <>G{gradeId - 2}</>),
                  current,
                  projected: projection.projectedClassSizes[gradeId]?.toFixed(2) || '-',
                  change: (projection.projectedClassSizes[gradeId] || 0) - current
                });
              })}
              {supportedGrades.includes(GRADE_IDS.GRADE_12) && projectionRow({
                label: gradeLabel('Grade 12', 'G12'),
                current: g12Current,
                projected: g12Projected.toFixed(2),
                change: g12Projected - g12Current
              })}
              {projectionRow({
                sx: {
                  '& td': {
                    borderTop: '2px solid',
                    borderColor: 'grey.400',
                    fontWeight: 'bold'
                  }
                },
                label: gradeLabel('Total Students', 'Total'),
                current: projection.currentTotalEnrollment,
                projected: projection.projectedTotalEnrollment.toFixed(2),
                change: projection.projectedTotalEnrollment - projection.currentTotalEnrollment
              })}
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

export default SchoolEnrollmentSummary;
