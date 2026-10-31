import React from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectHarassmentClassification } from '@/store/slices/safetySlice';
import SharedHarassmentDetailsTable from '@/components/ui/safety/HarassmentDetailsTable';
import { EntityKind, useCurrentEntity } from '@/features/entity/entity';
import { SAFETY, IdFallback, safetyParams } from '@/features/entity/bindings/safety';

const ID_FALLBACK: Record<EntityKind, IdFallback> = { school: 'zero', district: 'none' };

const EntityHarassmentDetailsTable: React.FC<{ kind: EntityKind }> = ({ kind }) => {
  // Get data from store using selectors
  const entity = useCurrentEntity(kind);
  const entityParams = safetyParams(entity, ID_FALLBACK[kind]);

  const entityHarassmentData = useAppSelector(state =>
    SAFETY[kind].data.harassment(state, entityParams));
  const harassmentClassifications = useAppSelector(selectHarassmentClassification);

  return (
    <SharedHarassmentDetailsTable
      harassmentData={entityHarassmentData}
      harassmentClassifications={harassmentClassifications}
      entityName={entity.name}
      entityType={kind}
    />
  );
};

export default EntityHarassmentDetailsTable;
