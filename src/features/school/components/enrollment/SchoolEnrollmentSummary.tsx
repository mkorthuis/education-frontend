import React, { useMemo, useEffect } from 'react';
import { SelectChangeEvent } from '@mui/material';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentSchool } from '@/store/slices/locationSlice';
import { selectSchoolEnrollment } from '@/store/slices/enrollmentSlice';
import EnrollmentProjectionTable from '@/components/ui/enrollment/EnrollmentProjectionTable';
import {
  GRADE_IDS,
  EnrollmentProjectionSnapshot,
  projectEnrollment
} from '@/utils/enrollmentProjection';

interface SchoolEnrollmentSummaryProps {
  onDataChange?: (data: EnrollmentProjectionSnapshot) => void;
}

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

  // Only the grades this school offers get a row
  const gradeIds = Object.values(GRADE_IDS).filter(gradeId => supportedGrades.includes(gradeId));

  return (
    <EnrollmentProjectionTable
      projection={projection}
      gradeIds={gradeIds}
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

export default SchoolEnrollmentSummary;
