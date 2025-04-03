import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';

export type ThemeMode = 'light' | 'dark';

export interface CommunityFeedData {
  feed: Array<any>; // You might want to define a more specific type here
}

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
  reducers: {
    changeThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.themeMode = action.payload == 'light'? 'dark': 'light';
    },
  },
});

export const { 
  changeThemeMode, 
} = appSlice.actions;

export const selectThemeMode = (state: RootState) => state.app.themeMode;

export default appSlice.reducer; 