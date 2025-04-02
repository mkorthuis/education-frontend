import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '@store/store';

interface AuthState { }

const initialState: AuthState = { };

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearUser: (state) => {
        sessionStorage.removeItem('user');
    }
  }
});

export const {
  clearUser
} = authSlice.actions;

export default authSlice.reducer;