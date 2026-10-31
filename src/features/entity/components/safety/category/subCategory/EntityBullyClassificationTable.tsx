import React from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectBullyingClassificationTypes } from '@/store/slices/safetySlice';
import SharedBullyClassificationTable from '@/components/ui/safety/BullyClassificationTable';
import { EntityKind, useCurrentEntity } from '@/features/entity/entity';
import { SAFETY, IdFallback, safetyParams } from '@/features/entity/bindings/safety';

const ID_FALLBACK: Record<EntityKind, IdFallback> = { school: 'zero', district: 'none' };

export interface BullyClassificationTableProps {
  selectedYear: string | number;
  onYearChange: (year: string | number) => void;
}

const EntityBullyClassificationTable: React.FC<BullyClassificationTableProps & { kind: EntityKind }> = ({
  kind,
  selectedYear,
  onYearChange
}) => {
  // Get data from store using selectors
  const entity = useCurrentEntity(kind);
  const entityParams = safetyParams(entity, ID_FALLBACK[kind]);

  const entityBullyClassificationData = useAppSelector(state =>
    SAFETY[kind].data.bullyingClassification(state, entityParams));
  const bullyingClassificationTypes = useAppSelector(selectBullyingClassificationTypes);

  return (
    <SharedBullyClassificationTable
      selectedYear={selectedYear}
      onYearChange={onYearChange}
      classificationData={entityBullyClassificationData}
      classificationTypes={bullyingClassificationTypes}
      entityName={entity.name}
      entityType={kind}
    />
  );
};

export default EntityBullyClassificationTable;
