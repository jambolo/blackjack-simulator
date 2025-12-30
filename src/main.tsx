import { createRoot } from 'react-dom/client'
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ErrorBoundary } from "react-error-boundary";

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'
import { appTheme } from './theme.ts'

import "./main.css"
import "./index.css"

createRoot(document.getElementById('root')!).render(
  <ThemeProvider theme={appTheme}>
    <CssBaseline />
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <App />
    </ErrorBoundary>
  </ThemeProvider>
)
