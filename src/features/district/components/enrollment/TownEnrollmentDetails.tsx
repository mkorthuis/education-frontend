import React, { useMemo } from 'react';
import { TownEnrollmentData, StateTownEnrollmentData } from '@/services/api/endpoints/enrollments';
import { FISCAL_YEAR } from '@/utils/environment';
import { Town } from '@/store/slices/locationSlice';
import SharedEnrollmentDetails from '@/components/ui/enrollment/SharedEnrollmentDetails';

// Define interface for Grade type
interface Grade {
  id: number;
  name: string;
}

export interface TownEnrollmentDetailsProps {
  districtId?: number;
  enrollmentData?: TownEnrollmentData[];
  stateEnrollmentData?: StateTownEnrollmentData[];
  towns?: Town[];
}

/**
 * Component that displays detailed enrollment information for towns in a district
 */
const TownEnrollmentDetails: React.FC<TownEnrollmentDetailsProps> = ({ 
  districtId, 
  enrollmentData = [], 
  stateEnrollmentData = [],
  towns = []
}) => {
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
  
  // Process enrollment data into rows
  const enrollmentRows = useMemo(() => {
    if (!enrollmentData.length) return [];

    // Filter to selected year data
    const yearData = enrollmentData.filter(item => item.year === selectedYear);
    
    // Create a map of grade IDs to aggregated enrollment data across all towns
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

  // Determine title and subtitle based on number of towns
  const title = towns.length === 1 
    ? `${towns[0].name} Students By Grade`
    : 'All District Towns Students By Grade';
  const subtitle = towns.length === 1 
    ? undefined
    : 'In All District Towns';

  return (
    <SharedEnrollmentDetails
      title={title}
      subtitle={subtitle}
      enrollmentRows={enrollmentRows}
      availableYears={availableYears}
      selectedYear={selectedYear}
      onYearChange={setSelectedYear}
    />
  );
};

export default TownEnrollmentDetails; 