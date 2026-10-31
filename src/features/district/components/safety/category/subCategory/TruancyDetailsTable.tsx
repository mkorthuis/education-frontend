import React from 'react';
import EntityTruancyDetailsTable from '@/features/entity/components/safety/category/subCategory/EntityTruancyDetailsTable';

const TruancyDetailsTable: React.FC<{ className?: string }> = ({ className }) =>
  <EntityTruancyDetailsTable kind="district" className={className} />;

export default TruancyDetailsTable;
