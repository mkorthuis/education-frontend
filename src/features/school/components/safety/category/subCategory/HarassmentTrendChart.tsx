import React from 'react';
import EntityHarassmentTrendChart from '@/features/entity/components/safety/category/subCategory/EntityHarassmentTrendChart';

const HarassmentTrendChart: React.FC<{ className?: string }> = ({ className }) =>
  <EntityHarassmentTrendChart kind="school" className={className} />;

export default HarassmentTrendChart;
