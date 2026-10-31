import React from 'react';
import EntitySuspensionTrendChart from '@/features/entity/components/safety/category/subCategory/EntitySuspensionTrendChart';

const SuspensionTrendChart: React.FC<{ className?: string }> = ({ className }) =>
  <EntitySuspensionTrendChart kind="school" className={className} />;

export default SuspensionTrendChart;
