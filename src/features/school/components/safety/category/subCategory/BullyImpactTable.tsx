import React from 'react';
import EntityBullyImpactTable, { BullyImpactTableProps } from '@/features/entity/components/safety/category/subCategory/EntityBullyImpactTable';

const BullyImpactTable: React.FC<BullyImpactTableProps> = (props) => <EntityBullyImpactTable kind="school" {...props} />;

export default BullyImpactTable;
