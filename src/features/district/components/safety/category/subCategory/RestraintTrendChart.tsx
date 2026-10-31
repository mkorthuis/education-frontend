import React from 'react';
import EntityRestraintTrendChart from '@/features/entity/components/safety/category/subCategory/EntityRestraintTrendChart';

const RestraintTrendChart: React.FC<{ className?: string }> = ({ className }) =>
  <EntityRestraintTrendChart kind="district" className={className} />;

export default RestraintTrendChart;
