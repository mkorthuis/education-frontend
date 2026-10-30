import { Suspense } from 'react';
import { CssBaseline, ThemeProvider } from "@mui/material";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import { RouterProvider } from "react-router-dom";
import router from "@routes/index";
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import theme from './theme';

const App = () => {
  return (
    <ErrorBoundary>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <div className="App" style={{ width: '100%' }}>
            <Suspense fallback={<div>Loading...</div>}>
              <RouterProvider 
                router={router} 
                future={{
                  v7_startTransition: true
                }}
              />
            </Suspense>
          </div>
        </ThemeProvider>
      </LocalizationProvider>
    </ErrorBoundary>
  )
}

export default App