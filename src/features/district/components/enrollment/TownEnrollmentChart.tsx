import React from 'react';
import { TownEnrollmentData, StateTownEnrollmentData } from '@/services/api/endpoints/enrollments';
import { Town } from '@/store/slices/locationSlice';
import SharedSchoolEnrollmentChart from '@/components/ui/enrollment/SharedSchoolEnrollmentChart';

export interface TownEnrollmentChartProps {
  districtId?: number;
  enrollmentData: TownEnrollmentData[];
  stateEnrollmentData: StateTownEnrollmentData[];
  towns: Town[];
}

const ALL_TOWNS_ID = 'all';

const TownEnrollmentChart: React.FC<TownEnrollmentChartProps> = ({
  districtId,
  enrollmentData = [],
  stateEnrollmentData = [],
  towns = []
}) => {
  const [selectedTownId, setSelectedTownId] = React.useState<number | string>(ALL_TOWNS_ID);

  // Process data for the chart
  const chartData = React.useMemo(() => {
    if (!enrollmentData.length) return [];
    
    // Filter data for selected town if one is selected
    const filteredData = selectedTownId !== ALL_TOWNS_ID
      ? enrollmentData.filter(item => item.town_id === selectedTownId)
      : enrollmentData;
    
    // Get available years
    const years = [...new Set(filteredData.map(item => item.year))].sort();
    
    // Create data points for each year
    return years.map(year => {
      // Filter data for the current year
      const yearData = filteredData.filter(item => item.year === year);
      
      // Calculate total enrollment for this year (sum across all grades)
      const totalEnrollment = yearData.reduce((sum, item) => sum + (item.enrollment || 0), 0);
      
      return {
        year: year.toString(),
        formattedYear: year.toString(),
        value: totalEnrollment,
        name: "Total Students"
      };
    }).sort((a, b) => parseInt(a.year) - parseInt(b.year));
  }, [enrollmentData, selectedTownId]);

  // Prepare select options from towns
  const selectOptions = React.useMemo(() => [
    { id: ALL_TOWNS_ID, name: "All Towns" },
    ...towns.map(town => ({
      id: town.id,
      name: town.name
    }))
  ], [towns]);

  return (
    <SharedSchoolEnrollmentChart
      title="Current Students"
      data={chartData}
      valueKey="value"
      valueName="Total Students"
      showSelector={towns.length > 1}
      selectorLabel="Select Town"
      selectOptions={selectOptions}
      selectedValue={selectedTownId}
      onSelectChange={setSelectedTownId}
    />
  );
};

export default TownEnrollmentChart; 