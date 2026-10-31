import React, { useState, useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';
import * as outcomeSlice from '@/store/slices/outcomeSlice';
import SharedGraduationRateChart, { MetricType, ChartDataPoint } from '@/components/ui/outcomes/GraduationRateChart';
import { EntityKind, ENTITY_LABEL, useRouteId } from '@/features/entity/entity';
import { OUTCOME } from '@/features/entity/bindings/outcome';

interface EntityGraduationRateChartProps {
  kind: EntityKind;
  className?: string;
}

const EntityGraduationRateChart: React.FC<EntityGraduationRateChartProps> = ({ kind, className }) => {
  const entityId = useRouteId();
  const entityParams = OUTCOME[kind].params(entityId);
  const stateParams = {};

  const [selectedMetric, setSelectedMetric] = useState<MetricType>('graduate');

  const entityData = useAppSelector(state =>
    OUTCOME[kind].select.graduationCohort(state, entityParams));
  const stateData = useAppSelector(state =>
    outcomeSlice.selectStateGraduationCohortData(state, stateParams));

  // Process data for the chart
  const chartData = useMemo(() => {
    return entityData.map(entityItem => {
      const stateItem = stateData.find(state => state.year === entityItem.year);
      const entityPercentage = (entityItem[selectedMetric] / entityItem.cohort_size) * 100;
      const statePercentage = stateItem ? (stateItem[selectedMetric] / stateItem.cohort_size) * 100 : 0;

      return {
        year: entityItem.year.toString(),
        formattedYear: `'${entityItem.year.toString().slice(-2)}`,
        entity: Number(entityPercentage.toFixed(1)),
        state: Number(statePercentage.toFixed(1))
      } as ChartDataPoint;
    }).sort((a, b) => parseInt(a.year) - parseInt(b.year));
  }, [entityData, stateData, selectedMetric]);

  const handleMetricChange = (metric: MetricType) => {
    setSelectedMetric(metric);
  };

  return (
    <SharedGraduationRateChart
      className={className}
      entityLabel={ENTITY_LABEL[kind]}
      chartData={chartData}
      initialMetric={selectedMetric}
      onMetricChange={handleMetricChange}
    />
  );
};

export default EntityGraduationRateChart;
