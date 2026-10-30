import { createSlice } from '@reduxjs/toolkit';

export type ThemeMode = 'light' | 'dark';

export interface AppState {
  themeMode: ThemeMode;
}

const initialState: AppState = {
  themeMode: 'light',
};

// TODO Break this out into more reducers.
export const appSlice = createSlice({
  name: 'app',
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {},
});

export default appSlice.reducer; 