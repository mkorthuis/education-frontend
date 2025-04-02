import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import appReducer from '../appSlice';
import authReducer from '@/features/auth/store/authSlice';
import locationReducer from '@/features/location/store/locationSlice';
import measurementReducer from '@/features/measurement/store/measurementSlice';

export const store = configureStore({
  reducer: {
    app: appReducer,
    auth: authReducer,
    location: locationReducer,
    measurement: measurementReducer
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
