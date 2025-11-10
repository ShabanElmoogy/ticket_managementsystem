// React import not needed with TSX under modern JSX runtime
import React from "react";
import CssBaseline from "@mui/material/CssBaseline";
import { CustomThemeProvider } from "./components/ThemeProvider";
import { AuthInitializer } from "./components/AuthInitializer";
import AppRouter from "./components/AppRouter";
import I18nProvider from "./providers/I18nProvider";
import './i18n'; // Initialize i18n
import './styles/rtl-transitions.css'; // RTL transitions

function App(): React.JSX.Element {
  return (
    <I18nProvider>
      <CustomThemeProvider>
        <CssBaseline />
        <AuthInitializer>
          <AppRouter />
        </AuthInitializer>
      </CustomThemeProvider>
    </I18nProvider>
  );
}

export default App;
