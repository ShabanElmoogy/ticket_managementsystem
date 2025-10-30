// React import not needed with TSX under modern JSX runtime
import CssBaseline from '@mui/material/CssBaseline';
import { CustomThemeProvider } from './components/ThemeProvider';
import { AuthInitializer } from './components/AuthInitializer';
import AppRouter from './components/AppRouter';

function App(): JSX.Element {
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