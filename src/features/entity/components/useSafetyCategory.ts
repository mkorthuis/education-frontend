import { useEffect } from 'react';
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

  // Effect to sync URL with selected category
  useEffect(() => {
    if (!category && selectedSafetyPage) {
      // Clear selected category when visiting base safety page
      dispatch(safetySlice.setSelectedSafetyPage(null));
    } else if (category && !selectedSafetyPage) {
      // Only set the category if it's a valid safety page
      const validCategories = ['bullying', 'harassment', 'restraint', 'serious', 'suspension', 'truancy'];
      if (validCategories.includes(category)) {
        dispatch(safetySlice.setSelectedSafetyPage(category as safetySlice.SafetyPage));
      }
    }
  }, [category, selectedSafetyPage, dispatch]);

  return { selectedSafetyPage, isMobile };
}
