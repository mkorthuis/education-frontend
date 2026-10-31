import React, { useMemo } from 'react';
import { Box, Typography, FormControl, Select, MenuItem, SelectChangeEvent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, IconButton, Divider, useTheme, useMediaQuery, SxProps, Theme } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import {
  GRADE_IDS,
  EnrollmentProjection,
  formatChange
} from '@/utils/enrollmentProjection';

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

// Default row label for a grade id (2 = Kindergarten ... 14 = Grade 12)
const defaultGradeLabel = (gradeId: number) => {
  if (gradeId === GRADE_IDS.KINDERGARTEN) return gradeLabel('Kindergarten', 'K');
  if (gradeId === GRADE_IDS.GRADE_1) return gradeLabel('Grade 1', 'G1');
  if (gradeId === GRADE_IDS.GRADE_12) return gradeLabel('Grade 12', 'G12');
  return gradeLabel(<>Grade {gradeId - 2}</>, <>G{gradeId - 2}</>);
};

// Current, projected text and change for one grade row.
// K and G1 always show the historical averages and G12 always reads its projection:
// projectedClassSizes only matches them when futureYear is after endYear, which
// stale year state (e.g. futureYear 1 from an empty first mount) does not guarantee.
const gradeRowValues = (projection: EnrollmentProjection, gradeId: number) => {
  const current = projection.currentSum(gradeId);
  if (gradeId === GRADE_IDS.KINDERGARTEN) {
    return { current, projected: projection.avgKClass.toFixed(2), change: projection.avgKClass - current };
  }
  if (gradeId === GRADE_IDS.GRADE_1) {
    return { current, projected: projection.avgG1Class.toFixed(2), change: projection.avgG1Class - current };
  }
  const projectedValue = projection.projectedClassSizes[gradeId];
  if (gradeId === GRADE_IDS.GRADE_12) {
    return { current, projected: projectedValue.toFixed(2), change: projectedValue - current };
  }
  return {
    current,
    projected: projectedValue?.toFixed(2) || '-',
    change: (projectedValue || 0) - current
  };
};

export interface EnrollmentProjectionTableProps {
  projection: EnrollmentProjection;
  /** Grade ids to show a row for, in display order (2 = Kindergarten ... 14 = Grade 12). */
  gradeIds: readonly number[];
  /** Replaces the default label of a grade's row. */
  gradeLabels?: { [gradeId: number]: React.ReactNode };
  /** Years with enrollment data, latest first. */
  availableYears: readonly number[];
  startYear: number;
  endYear: number;
  futureYear: number;
  onStartYearChange: (event: SelectChangeEvent<number>) => void;
  onEndYearChange: (event: SelectChangeEvent<number>) => void;
  onFutureYearChange: (event: SelectChangeEvent<number>) => void;
  openMethodology: boolean;
  onOpenMethodology: () => void;
  onCloseMethodology: () => void;
}

const EnrollmentProjectionTable: React.FC<EnrollmentProjectionTableProps> = ({
  projection,
  gradeIds,
  gradeLabels,
  availableYears,
  startYear,
  endYear,
  futureYear,
  onStartYearChange,
  onEndYearChange,
  onFutureYearChange,
  openMethodology,
  onOpenMethodology,
  onCloseMethodology
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Generate future years for dropdown
  const futureYears = useMemo(() => {
    const latestYear = availableYears[0] || 0;
    return Array.from({ length: 15 }, (_, i) => latestYear + i + 1);
  }, [availableYears]);

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
              onChange={onFutureYearChange}
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
                onChange={onStartYearChange}
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
                onChange={onEndYearChange}
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
                onClick={onOpenMethodology}
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
              {gradeIds.map((gradeId) => projectionRow({
                key: gradeId,
                label: gradeLabels?.[gradeId] ?? defaultGradeLabel(gradeId),
                ...gradeRowValues(projection, gradeId)
              }))}
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
        onClose={onCloseMethodology}
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
            onClick={onCloseMethodology}
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

export default EnrollmentProjectionTable;
