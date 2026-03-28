import React from "react";
import CssBaseline from "@mui/material/CssBaseline";
import { CustomThemeProvider } from "./components/ThemeProvider";
import { AuthInitializer } from "./components/AuthInitializer";
import AppRouter from "./components/AppRouter";
import I18nProvider from "./providers/I18nProvider";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import GlobalStyles from '@mui/material/GlobalStyles';
import './i18n';
import './styles/rtl-transitions.css';

function App(): React.JSX.Element {
  return (
    <I18nProvider>
      <CustomThemeProvider>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <GlobalStyles styles={{ 'body': { paddingRight: '0 !important', overflow: 'auto !important' } }} />
          <CssBaseline />
          <AuthInitializer>
            <AppRouter />
          </AuthInitializer>
        </LocalizationProvider>
      </CustomThemeProvider>
    </I18nProvider>
  );
}

export default App;
