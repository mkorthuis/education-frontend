import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import appReducer from '@/store/slices/appSlice';
import authReducer from '@/features/auth/store/authSlice';
import locationReducer from '@/store/slices/locationSlice';
import measurementReducer from '@/store/slices/measurementSlice';
import financeReducer from '@/store/slices/financeSlice';
import assessmentReducer from '@/store/slices/assessmentSlice';
import safetyReducer from '@/store/slices/safetySlice';
import efaReducer from '@/store/slices/efaSlice';
import enrollmentReducer from '@/store/slices/enrollmentSlice';
import outcomeReducer from '@/store/slices/outcomeSlice';
import staffReducer from '@/store/slices/staffSlice';
import classSizeReducer from '@/store/slices/classSizeSlice';
import pageReducer, { createSyncLocationWithPageMiddleware } from '@/store/slices/pageSlice';

// Re-export selectors from pageSlice.  Avoids circular dependency.
export {
  selectDistrict,
  selectSchool,
  selectCurrentPage,
  selectShowSecondaryNav
} from '@/store/slices/pageSlice';

export const store = configureStore({
  reducer: {
    app: appReducer,
    auth: authReducer,
    location: locationReducer,
    measurement: measurementReducer,
    finance: financeReducer,
    assessment: assessmentReducer,
    safety: safetyReducer,
    efa: efaReducer,
    enrollment: enrollmentReducer,
    outcomes: outcomeReducer,
    staff: staffReducer,
    classSize: classSizeReducer,
    page: pageReducer
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(createSyncLocationWithPageMiddleware())
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>; 