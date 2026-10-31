import React, { useMemo, useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import * as outcomeSlice from '@/store/slices/outcomeSlice';
import { FISCAL_YEAR } from '@/utils/environment';
import { POST_GRADUATION_TYPE_ORDER, POST_GRADUATION_TYPES_WITH_TOOLTIP } from '@/features/district/utils/outcomeDataProcessing';
import PostSecondaryPlansTable, { PostSecondaryPlanRow } from '@/components/ui/outcomes/PostSecondaryPlansTable';
import { EntityKind, ENTITY_LABEL, useRouteId } from '@/features/entity/entity';
import { OUTCOME } from '@/features/entity/bindings/outcome';

const EntityWhatIsNextDetails: React.FC<{ kind: EntityKind }> = ({ kind }) => {
  const entityId = useRouteId();
  const defaultFiscalYear = parseInt(FISCAL_YEAR);
  const [comparisonYear, setComparisonYear] = useState<number>(defaultFiscalYear - 1);
  const [viewMode, setViewMode] = useState<'comparison' | 'state'>('state');

  const postGraduationTypes = useAppSelector(outcomeSlice.selectPostGraduationTypes);
  const entityData = useAppSelector(state => 
    OUTCOME[kind].select.postGraduation(state, OUTCOME[kind].params(entityId)));
  const stateData = useAppSelector(state => 
    outcomeSlice.selectStatePostGraduationData(state, {}));

  // Get available years for comparison, excluding current fiscal year
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    entityData.forEach(item => {
      if (item.year < defaultFiscalYear) {
        years.add(item.year);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [entityData, defaultFiscalYear]);

  // Set initial comparison year to the most recent available year
  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(comparisonYear)) {
      setComparisonYear(availableYears[0]);
    }
  }, [availableYears, comparisonYear]);

  // Process data for the table
  const tableData = useMemo(() => {
    const currentYear = defaultFiscalYear.toString();
    const compareYear = comparisonYear.toString();

    // Calculate entity totals and percentages for both years
    const entityTotals = entityData.reduce((acc, item) => {
      if (!acc[item.year]) {
        acc[item.year] = 0;
      }
      acc[item.year] += item.value;
      return acc;
    }, {} as Record<string, number>);

    // Calculate state totals and percentages
    const stateTotals = stateData.reduce((acc, item) => {
      if (!acc[item.year]) {
        acc[item.year] = 0;
      }
      acc[item.year] += item.value;
      return acc;
    }, {} as Record<string, number>);

    // Create rows for each post-graduation type
    return [...postGraduationTypes]
      .sort((a, b) => {
        const aIndex = POST_GRADUATION_TYPE_ORDER.indexOf(a.name as typeof POST_GRADUATION_TYPE_ORDER[number]);
        const bIndex = POST_GRADUATION_TYPE_ORDER.indexOf(b.name as typeof POST_GRADUATION_TYPE_ORDER[number]);
        return aIndex - bIndex;
      })
      .map(type => {
        const currentItem = entityData.find(
          item => item.year.toString() === currentYear && 
          item.post_graduation_type.id === type.id
        );
        const comparisonItem = viewMode === 'comparison' 
          ? entityData.find(
              item => item.year.toString() === compareYear && 
              item.post_graduation_type.id === type.id
            )
          : stateData.find(
              item => item.year.toString() === currentYear && 
              item.post_graduation_type.id === type.id
            );

        const currentPercentage = currentItem && entityTotals[currentYear] > 0
          ? (currentItem.value / entityTotals[currentYear]) * 100
          : 0;
        const comparisonPercentage = comparisonItem && 
          (viewMode === 'comparison' ? entityTotals[compareYear] : stateTotals[currentYear]) > 0
          ? (comparisonItem.value / (viewMode === 'comparison' ? entityTotals[compareYear] : stateTotals[currentYear])) * 100
          : 0;

        return {
          name: type.name,
          entityPercentage: currentPercentage,
          comparisonPercentage,
          difference: currentPercentage - comparisonPercentage
        } as PostSecondaryPlanRow;
      });
  }, [entityData, stateData, postGraduationTypes, defaultFiscalYear, comparisonYear, viewMode]);

  // Calculate totals
  const totals = useMemo(() => {
    const entityTotal = tableData.reduce((total, item) => total + item.entityPercentage, 0);
    const comparisonTotal = tableData.reduce((total, item) => total + item.comparisonPercentage, 0);
    const differenceTotal = entityTotal - comparisonTotal;

    return {
      entityTotal,
      comparisonTotal,
      differenceTotal
    };
  }, [tableData]);

  // Create tooltip map
  const tooltipMap = useMemo(() => {
    const map = new Map<string, string>();
    postGraduationTypes.forEach(type => {
      if (POST_GRADUATION_TYPES_WITH_TOOLTIP.includes(type.name as any)) {
        map.set(
          type.name, 
          type.description || 'Additional high school for students who need more credits or specific courses to graduate.'
        );
      }
    });
    return map;
  }, [postGraduationTypes]);

  return (
    <PostSecondaryPlansTable
      entityLabel={ENTITY_LABEL[kind]}
      availableYears={availableYears}
      tableData={tableData}
      totalEntityPercentage={totals.entityTotal}
      totalComparisonPercentage={totals.comparisonTotal}
      totalDifference={totals.differenceTotal}
      initialComparisonYear={comparisonYear}
      tooltipMap={tooltipMap}
      onViewModeChange={setViewMode}
      onComparisonYearChange={setComparisonYear}
    />
  );
};

export default EntityWhatIsNextDetails; 