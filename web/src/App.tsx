import React from "react";
import CssBaseline from "@mui/material/CssBaseline";
import { CustomThemeProvider } from "./providers/ThemeProvider";
import { AuthInitializer } from "./components/AuthInitializer";
import AppRouter from "./AppRouter";
import I18nProvider from "./providers/I18nProvider";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import './i18n';
import './styles/rtl-transitions.css';

function App(): React.JSX.Element {
  return (
    <I18nProvider>
      <CustomThemeProvider>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
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
