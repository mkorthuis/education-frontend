import { useParams } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentSchool, selectCurrentDistrict } from '@/store/slices/locationSlice';

// The two entity pages that share components. Each school/district wrapper
// mounts a shared component with a literal kind, so hook order stays stable.
export type EntityKind = 'school' | 'district';

export interface EntityRef {
  kind: EntityKind;
  id: number | undefined;
  name: string | undefined;
}

export const ENTITY_LABEL = { school: 'School', district: 'District' } as const;

export const SELECT_CURRENT_ENTITY = {
  school: selectCurrentSchool,
  district: selectCurrentDistrict
} as const;

export function useCurrentEntity(kind: EntityKind): EntityRef {
  const entity = useAppSelector(SELECT_CURRENT_ENTITY[kind]);
  return { kind, id: entity?.id, name: entity?.name };
}

// The entity id from the route (`/school/:id/...`, `/district/:id/...`), or 0.
export function useRouteId(): number {
  const { id } = useParams<{ id: string }>();
  return id ? parseInt(id) : 0;
}
