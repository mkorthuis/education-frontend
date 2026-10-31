import React from 'react';
import EntityBullyTrendChart from '@/features/entity/components/safety/category/subCategory/EntityBullyTrendChart';

const BullyTrendChart: React.FC<{ className?: string }> = ({ className }) =>
  <EntityBullyTrendChart kind="district" className={className} />;

export default BullyTrendChart;
