import { configureStore } from '@reduxjs/toolkit';
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
import pageReducer, { 
  createSyncLocationWithPageMiddleware,
  selectDistrict,
  selectSchool,
  selectCurrentPage,
  selectCurrentPageId,
  updateCurrentPage,
  getPageType,
  PageType
} from '@/store/slices/pageSlice';

// Re-export these items to avoid circular dependencies
export {
  selectDistrict,
  selectSchool,
  selectCurrentPage,
  selectCurrentPageId,
  updateCurrentPage,
  getPageType,
  PageType
};

export const store = configureStore({
  reducer: {
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
    getDefaultMiddleware({
      serializableCheck: {
        // These paths no longer need to be ignored since we're only storing IDs
        // Empty objects are kept for easy restoration if needed
        ignoredPaths: [],
        ignoredActionPaths: []
      }
    }).concat(createSyncLocationWithPageMiddleware())
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;