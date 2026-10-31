import React, { useMemo, useEffect } from 'react';
import { Box, Typography, SelectChangeEvent } from '@mui/material';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentDistrict } from '@/store/slices/locationSlice';
import { selectTownEnrollment } from '@/store/slices/enrollmentSlice';
import EnrollmentProjectionTable from '@/components/ui/enrollment/EnrollmentProjectionTable';
import {
  GRADE_IDS,
  EnrollmentProjectionSnapshot,
  projectEnrollment
} from '@/utils/enrollmentProjection';

interface EnrollmentSummaryProps {
  onDataChange?: (data: EnrollmentProjectionSnapshot) => void;
}

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

  // Project enrollment across all towns (district rules)
  const projection = useMemo(
    () => projectEnrollment(townEnrollmentData, { startYear, endYear, futureYear }, null),
    [townEnrollmentData, startYear, endYear, futureYear]
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

  // K, G1 and G12 by default; every grade from K to G12 when expanded
  const gradeIds: number[] = showAllGrades
    ? Object.values(GRADE_IDS)
    : [GRADE_IDS.KINDERGARTEN, GRADE_IDS.GRADE_1, GRADE_IDS.GRADE_12];

  return (
    <EnrollmentProjectionTable
      projection={projection}
      gradeIds={gradeIds}
      gradeLabels={{
        [GRADE_IDS.GRADE_12]: (
          <>
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
          </>
        )
      }}
      availableYears={availableYears}
      startYear={startYear}
      endYear={endYear}
      futureYear={futureYear}
      onStartYearChange={handleStartYearChange}
      onEndYearChange={handleEndYearChange}
      onFutureYearChange={handleFutureYearChange}
      openMethodology={openMethodology}
      onOpenMethodology={handleOpenMethodology}
      onCloseMethodology={handleCloseMethodology}
    />
  );
};

export default EnrollmentSummary;
