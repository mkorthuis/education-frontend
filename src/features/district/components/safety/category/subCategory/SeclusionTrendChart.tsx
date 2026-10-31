import React from 'react';
import EntitySeclusionTrendChart from '@/features/entity/components/safety/category/subCategory/EntitySeclusionTrendChart';

const SeclusionTrendChart: React.FC<{ className?: string }> = ({ className }) =>
  <EntitySeclusionTrendChart kind="district" className={className} />;

export default SeclusionTrendChart;
