import { createSlice } from '@reduxjs/toolkit';
import { Appearance } from 'react-native';

const themeSlice = createSlice({
  name: 'theme',
  initialState: {
    // Phone ki current setting utha lega (dark ya light)
    mode: Appearance.getColorScheme() || 'dark'
  },
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
    },
  },
});

export const { toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
