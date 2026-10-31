import React from 'react';
import EntityRestraintTrendChart from '@/features/entity/components/safety/category/subCategory/EntityRestraintTrendChart';

const RestraintTrendChart: React.FC<{ className?: string }> = ({ className }) =>
  <EntityRestraintTrendChart kind="school" className={className} />;

export default RestraintTrendChart;
