import React, { useState, useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';
import * as outcomeSlice from '@/store/slices/outcomeSlice';
import PostSecondaryPlansChart, { PostSecondaryPlanType } from '@/components/ui/outcomes/PostSecondaryPlansChart';
import { EntityKind, ENTITY_LABEL, useRouteId } from '@/features/entity/entity';
import { OUTCOME } from '@/features/entity/bindings/outcome';

interface ChartDataPoint {
  year: string;
  formattedYear: string;
  entity: number;
  state: number;
  total: number;
}

const EntityWhatIsNextChart: React.FC<{ kind: EntityKind }> = ({ kind }) => {
  const entityId = useRouteId();

  const postGraduationTypes = useAppSelector(outcomeSlice.selectPostGraduationTypes);
  const entityData = useAppSelector(state =>
    OUTCOME[kind].select.postGraduation(state, OUTCOME[kind].params(entityId)));
  const stateData = useAppSelector(state =>
    outcomeSlice.selectStatePostGraduationData(state, {}));

  // Set initial selected type to "4 year college"
  const [selectedType, setSelectedType] = useState<string>(() => {
    const fourYearCollege = postGraduationTypes.find(type =>
      type.name.toLowerCase().includes('4 year') ||
      type.name.toLowerCase().includes('four year')
    );
    return fourYearCollege?.id.toString() || postGraduationTypes[0]?.id.toString() || '';
  });

  // Process data for the chart
  const chartData = useMemo(() => {
    // Group data by year
    const yearGroups = entityData.reduce((acc, item) => {
      if (!acc[item.year]) {
        acc[item.year] = {
          year: item.year.toString(),
          formattedYear: `'${item.year.toString().slice(-2)}`,
          entity: 0,
          state: 0,
          total: 0
        };
      }
      acc[item.year].total = (acc[item.year].total as number) + item.value;
      return acc;
    }, {} as Record<string, ChartDataPoint>);

    // Calculate entity percentages
    entityData.forEach(item => {
      const yearData = yearGroups[item.year];
      if (yearData && (yearData.total as number) > 0) {
        const percentage = (item.value / (yearData.total as number)) * 100;
        if (item.post_graduation_type.id.toString() === selectedType) {
          yearData.entity = Number(percentage.toFixed(1));
        }
      }
    });

    // Calculate state percentages
    stateData.forEach(item => {
      const yearData = yearGroups[item.year];
      if (yearData && item.post_graduation_type.id.toString() === selectedType) {
        const stateTotal = stateData
          .filter(stateItem => stateItem.year === item.year)
          .reduce((sum, stateItem) => sum + stateItem.value, 0);

        if (stateTotal > 0) {
          const percentage = (item.value / stateTotal) * 100;
          yearData.state = Number(percentage.toFixed(1));
        }
      }
    });

    // Ensure all years have data points, even if no data exists
    const allYears = new Set([
      ...entityData.map(item => item.year),
      ...stateData.map(item => item.year)
    ]);

    allYears.forEach(year => {
      if (!yearGroups[year]) {
        yearGroups[year] = {
          year: year.toString(),
          formattedYear: `'${year.toString().slice(-2)}`,
          entity: 0,
          state: 0,
          total: 0
        };
      }
    });

    return Object.values(yearGroups)
      .sort((a, b) => parseInt(a.year) - parseInt(b.year));
  }, [entityData, stateData, selectedType]);

  // Handle type change
  const handleTypeChange = (typeId: string) => {
    setSelectedType(typeId);
  };

  return (
    <PostSecondaryPlansChart
      entityLabel={ENTITY_LABEL[kind]}
      postGraduationTypes={postGraduationTypes as PostSecondaryPlanType[]}
      chartData={chartData}
      defaultSelectedTypeId={selectedType}
      onTypeChange={handleTypeChange}
    />
  );
};

export default EntityWhatIsNextChart;
