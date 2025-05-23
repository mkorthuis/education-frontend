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
  const districtId = id ? parseInt(id) : 0;
  const districtParams = { district_id: districtId };
  const stateParams = {};

  const [selectedMetric, setSelectedMetric] = useState<MetricType>('graduate');

  const districtData = useAppSelector(state => 
    outcomeSlice.selectDistrictGraduationCohortData(state, districtParams));
  const stateData = useAppSelector(state => 
    outcomeSlice.selectStateGraduationCohortData(state, stateParams));

  // Process data for the chart
  const chartData = useMemo(() => {
    return districtData.map(districtItem => {
      const stateItem = stateData.find(state => state.year === districtItem.year);
      const districtPercentage = (districtItem[selectedMetric] / districtItem.cohort_size) * 100;
      const statePercentage = stateItem ? (stateItem[selectedMetric] / stateItem.cohort_size) * 100 : 0;

      return {
        year: districtItem.year.toString(),
        formattedYear: `'${districtItem.year.toString().slice(-2)}`,
        entity: Number(districtPercentage.toFixed(1)),
        state: Number(statePercentage.toFixed(1))
      } as ChartDataPoint;
    }).sort((a, b) => parseInt(a.year) - parseInt(b.year));
  }, [districtData, stateData, selectedMetric]);

  const handleMetricChange = (metric: MetricType) => {
    setSelectedMetric(metric);
  };

  return (
    <SharedGraduationRateChart
      className={className}
      entityLabel="District"
      chartData={chartData}
      initialMetric={selectedMetric}
      onMetricChange={handleMetricChange}
    />
  );
};

export default GraduationRateChart; 