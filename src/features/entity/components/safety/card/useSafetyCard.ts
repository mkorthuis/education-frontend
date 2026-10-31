import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { SafetyPage, selectSelectedSafetyPage, setSelectedSafetyPage } from '@/store/slices/safetySlice';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import { EntityKind } from '@/features/entity/entity';

// Click order kept per kind: school navigates and then selects the page,
// district selects the page and then navigates.
const SELECT_PAGE_FIRST: Record<EntityKind, boolean> = { school: false, district: true };

// Selection state and click handler shared by the safety cards.
export function useSafetyCard(kind: EntityKind, page: SafetyPage) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const selectedSafetyPage = useAppSelector(selectSelectedSafetyPage);
  const isSelected = selectedSafetyPage === page;

  const handleClick = () => {
    const path = PAGE_REGISTRY[kind].safety.urlPatterns[0].replace(':id', id || '').replace(':category?', page);
    if (SELECT_PAGE_FIRST[kind]) {
      dispatch(setSelectedSafetyPage(page));
      navigate(path);
    } else {
      navigate(path);
      dispatch(setSelectedSafetyPage(page));
    }
  };

  return { isSelected, handleClick };
}
