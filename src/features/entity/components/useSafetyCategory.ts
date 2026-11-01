import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme, useMediaQuery } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import * as safetySlice from '@/store/slices/safetySlice';

// The selected safety category, synced with the route's `:category?`. Each Safety
// page calls this before its data hook, so this effect runs before the fetch effect.
export function useSafetyCategory() {
  const { category } = useParams<{ category?: string }>();
  // Unused, as in the Safety pages this replaces (it still re-renders them on navigation).
  useNavigate();
  const dispatch = useAppDispatch();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const selectedSafetyPage = useAppSelector(safetySlice.selectSelectedSafetyPage);
  // The URL category the selection was last synced to (null until the first sync)
  const syncedCategory = useRef<{ category?: string } | null>(null);

  // Effect to sync the selected category with the URL. It acts only on mount and when the
  // URL changes, so a card click (which selects and navigates in either order, and the
  // navigation commits as a transition) is never undone by a stale URL.
  useEffect(() => {
    if (syncedCategory.current && syncedCategory.current.category === category) return;
    syncedCategory.current = { category };

    if (!category && selectedSafetyPage) {
      // Clear selected category when visiting base safety page
      dispatch(safetySlice.setSelectedSafetyPage(null));
    } else if (category && category !== selectedSafetyPage) {
      // Only set the category if it's a valid safety page
      const validCategories = ['bullying', 'harassment', 'restraint', 'serious', 'suspension', 'truancy'];
      if (validCategories.includes(category)) {
        dispatch(safetySlice.setSelectedSafetyPage(category as safetySlice.SafetyPage));
      }
    }
  }, [category, selectedSafetyPage, dispatch]);

  return { selectedSafetyPage, isMobile };
}
