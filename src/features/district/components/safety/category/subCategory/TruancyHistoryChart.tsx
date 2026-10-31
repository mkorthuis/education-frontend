import React from 'react';
import EntityTruancyHistoryChart from '@/features/entity/components/safety/category/subCategory/EntityTruancyHistoryChart';

const TruancyHistoryChart: React.FC<{ className?: string }> = ({ className }) =>
  <EntityTruancyHistoryChart kind="district" className={className} />;

export default TruancyHistoryChart;
