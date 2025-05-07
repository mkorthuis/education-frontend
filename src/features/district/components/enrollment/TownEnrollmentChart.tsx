import React from 'react';
import { TownEnrollmentData } from '@/services/api/endpoints/enrollments';
import SharedSchoolEnrollmentChart from '@/components/ui/enrollment/SharedSchoolEnrollmentChart';

export interface TownEnrollmentChartProps {
  townId?: number;
  enrollmentData?: TownEnrollmentData[];
}

const TownEnrollmentChart: React.FC<TownEnrollmentChartProps> = ({
  townId,
  enrollmentData = []
}) => {
  // Process data for the chart
  const chartData = React.useMemo(() => {
    if (!enrollmentData.length) return [];
    
    // Get available years
    const years = [...new Set(enrollmentData.map(item => item.year))].sort();
    
    // Create data points for each year
    return years.map(year => {
      // Filter data for the current year
      const yearData = enrollmentData.filter(item => item.year === year);
      
      // Calculate total enrollment for this year (sum across all grades)
      const totalEnrollment = yearData.reduce((sum, item) => sum + (item.enrollment || 0), 0);
      
      return {
        year: year.toString(),
        formattedYear: year.toString(),
        value: totalEnrollment,
        name: "Total Students"
      };
    }).sort((a, b) => parseInt(a.year) - parseInt(b.year));
  }, [enrollmentData]);

  return (
    <SharedSchoolEnrollmentChart
      title="Current Students"
      data={chartData}
      valueKey="value"
      valueName="Total Students"
    />
  );
};

export default TownEnrollmentChart; 