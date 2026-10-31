import React from 'react';
import EntityBullyClassificationTable, { BullyClassificationTableProps } from '@/features/entity/components/safety/category/subCategory/EntityBullyClassificationTable';

const BullyClassificationTable: React.FC<BullyClassificationTableProps> = (props) => <EntityBullyClassificationTable kind="district" {...props} />;

export default BullyClassificationTable;
