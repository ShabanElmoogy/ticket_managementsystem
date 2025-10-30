// React import not needed with TSX under modern JSX runtime
import React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { CustomThemeProvider } from './components/ThemeProvider';
import { AuthInitializer } from './components/AuthInitializer';
import AppRouter from './components/AppRouter';

function App(): React.JSX.Element {
  return (
    <CustomThemeProvider>
      <CssBaseline />
      <AuthInitializer>
        <AppRouter />
      </AuthInitializer>
    </CustomThemeProvider>
  );
}

export default App;