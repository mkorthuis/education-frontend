import React from 'react';
import EntityBullyClassificationTable, { BullyClassificationTableProps } from '@/features/entity/components/safety/category/subCategory/EntityBullyClassificationTable';

const BullyClassificationTable: React.FC<BullyClassificationTableProps> = (props) => <EntityBullyClassificationTable kind="school" {...props} />;

export default BullyClassificationTable;
