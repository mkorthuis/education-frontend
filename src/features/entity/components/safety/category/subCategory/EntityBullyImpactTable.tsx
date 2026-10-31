import React from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectBullyingImpactTypes } from '@/store/slices/safetySlice';
import SharedBullyImpactTable from '@/components/ui/safety/BullyImpactTable';
import { EntityKind, useCurrentEntity } from '@/features/entity/entity';
import { SAFETY, IdFallback, safetyParams } from '@/features/entity/bindings/safety';

const ID_FALLBACK: Record<EntityKind, IdFallback> = { school: 'zero', district: 'none' };

export interface BullyImpactTableProps {
  selectedYear: string | number;
  onYearChange: (year: string | number) => void;
}

const EntityBullyImpactTable: React.FC<BullyImpactTableProps & { kind: EntityKind }> = ({
  kind,
  selectedYear,
  onYearChange
}) => {
  // Get data from store using selectors
  const entity = useCurrentEntity(kind);
  const entityParams = safetyParams(entity, ID_FALLBACK[kind]);

  const entityBullyImpactData = useAppSelector(state =>
    SAFETY[kind].data.bullyingImpact(state, entityParams));
  const bullyingImpactTypes = useAppSelector(selectBullyingImpactTypes);

  return (
    <SharedBullyImpactTable
      selectedYear={selectedYear}
      onYearChange={onYearChange}
      impactData={entityBullyImpactData}
      impactTypes={bullyingImpactTypes}
      entityName={entity.name}
      entityType={kind}
    />
  );
};

export default EntityBullyImpactTable;
