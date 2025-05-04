import { createTheme } from '@mui/material/styles';

// Use default MUI primary color (blue)
const PRIMARY_COLOR = {
  main: '#1976d2', // Default MUI blue
  light: '#42a5f5',
  dark: '#1565c0',
  contrastText: '#ffffff',
};

// Custom colors for specific components
const CUSTOM_COLORS = {
  secondaryNav: {
    background: '#E8E8E8',
    text: '#333333', // Dark text for light background
  },
  footer: {
    background: '#505050',
    text: '#ffffff', // Light text for dark background
  }
};

// Custom theme declaration to add our custom properties
declare module '@mui/material/styles' {
  interface Palette {
    custom: typeof CUSTOM_COLORS;
  }
  interface PaletteOptions {
    custom?: typeof CUSTOM_COLORS;
  }
}

// Create the theme
const theme = createTheme({
  palette: {
    primary: PRIMARY_COLOR,
    // Add custom colors to the theme
    custom: CUSTOM_COLORS,
  },
  components: {
    // Component style overrides can be added here later
  },
  typography: {
    // Typography customizations can be added here later
  },
});

export default theme; 