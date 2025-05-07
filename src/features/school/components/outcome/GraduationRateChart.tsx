import React, { useState, useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';
import * as outcomeSlice from '@/store/slices/outcomeSlice';
import { useParams } from 'react-router-dom';
import SharedGraduationRateChart, { MetricType, ChartDataPoint } from '@/components/ui/outcomes/GraduationRateChart';

interface GraduationRateChartProps {
  className?: string;
}

const GraduationRateChart: React.FC<GraduationRateChartProps> = ({ className }) => {
  const { id } = useParams<{ id: string }>();
  const schoolId = id ? parseInt(id) : 0;
  const schoolParams = { school_id: schoolId };
  const stateParams = {};

  const [selectedMetric, setSelectedMetric] = useState<MetricType>('graduate');

  const schoolData = useAppSelector(state => 
    outcomeSlice.selectSchoolGraduationCohortData(state, schoolParams));
  const stateData = useAppSelector(state => 
    outcomeSlice.selectStateGraduationCohortData(state, stateParams));

  // Process data for the chart
  const chartData = useMemo(() => {
    return schoolData.map(schoolItem => {
      const stateItem = stateData.find(state => state.year === schoolItem.year);
      const schoolPercentage = (schoolItem[selectedMetric] / schoolItem.cohort_size) * 100;
      const statePercentage = stateItem ? (stateItem[selectedMetric] / stateItem.cohort_size) * 100 : 0;

      return {
        year: schoolItem.year.toString(),
        formattedYear: `'${schoolItem.year.toString().slice(-2)}`,
        entity: Number(schoolPercentage.toFixed(1)),
        state: Number(statePercentage.toFixed(1))
      } as ChartDataPoint;
    }).sort((a, b) => parseInt(a.year) - parseInt(b.year));
  }, [schoolData, stateData, selectedMetric]);

  const handleMetricChange = (metric: MetricType) => {
    setSelectedMetric(metric);
  };

  return (
    <SharedGraduationRateChart
      className={className}
      entityLabel="School"
      chartData={chartData}
      initialMetric={selectedMetric}
      onMetricChange={handleMetricChange}
    />
  );
};

export default GraduationRateChart; 