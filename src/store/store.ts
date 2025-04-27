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
    enrollment: enrollmentReducer
  },
  middleware: getDefaultMiddleware =>
      getDefaultMiddleware()
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
