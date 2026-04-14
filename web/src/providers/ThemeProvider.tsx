import React from 'react';
import type { ReactNode } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import GlobalStyles from '@mui/material/GlobalStyles';
import { useThemeStore } from '../stores/themeStore';

// ── Theme factory ─────────────────────────────────────────────────────────────

const PALETTE = {
  light: {
    primary:    { main: '#2563eb', light: '#3b82f6', dark: '#1d4ed8', contrastText: '#ffffff' },
    secondary:  { main: '#7c3aed', light: '#8b5cf6', dark: '#6d28d9', contrastText: '#ffffff' },
    success:    { main: '#10b981', light: '#34d399', dark: '#059669' },
    warning:    { main: '#f59e0b', light: '#fbbf24', dark: '#d97706' },
    error:      { main: '#ef4444', light: '#f87171', dark: '#dc2626' },
    background: { default: '#f8fafc', paper: '#ffffff' },
    text:       { primary: '#1e293b', secondary: '#64748b' },
  },
  dark: {
    primary:    { main: '#3b82f6', light: '#60a5fa', dark: '#2563eb', contrastText: '#ffffff' },
    secondary:  { main: '#8b5cf6', light: '#a78bfa', dark: '#7c3aed', contrastText: '#ffffff' },
    success:    { main: '#34d399', light: '#6ee7b7', dark: '#10b981' },
    warning:    { main: '#fbbf24', light: '#fcd34d', dark: '#f59e0b' },
    error:      { main: '#f87171', light: '#fca5a5', dark: '#ef4444' },
    background: { default: '#0f172a', paper: '#1e293b' },
    text:       { primary: '#f1f5f9', secondary: '#cbd5e1' },
  },
};

const buildTheme = (mode: 'light' | 'dark', direction: 'ltr' | 'rtl') =>
  createTheme({
    direction,
    palette: { mode, ...PALETTE[mode] },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 700, fontSize: '2.5rem' },
      h2: { fontWeight: 600, fontSize: '2rem' },
      h3: { fontWeight: 600, fontSize: '1.75rem' },
      h4: { fontWeight: 600, fontSize: '1.5rem' },
      h5: { fontWeight: 600, fontSize: '1.25rem' },
      h6: { fontWeight: 600, fontSize: '1.125rem' },
      body1: { fontSize: '1rem',     lineHeight: 1.6 },
      body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiCard: {
        styleOverrides: {
          root: ({ theme: t }) => ({
            boxShadow: t.palette.mode === 'dark' ? '0px 4px 6px rgba(0,0,0,0.3)' : '0px 4px 6px rgba(0,0,0,0.05)',
            border: `1px solid ${t.palette.divider}`,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              boxShadow: t.palette.mode === 'dark' ? '0px 10px 15px rgba(0,0,0,0.4)' : '0px 10px 15px rgba(0,0,0,0.1)',
              transform: 'translateY(-2px)',
            },
          }),
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: ({ theme: t }) => ({ backgroundImage: 'none', backgroundColor: t.palette.background.paper }),
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 600, borderRadius: 8, padding: '10px 20px', transition: 'all 0.2s ease-in-out' },
          contained: {
            boxShadow: '0px 4px 6px rgba(0,0,0,0.1)',
            '&:hover': { boxShadow: '0px 6px 8px rgba(0,0,0,0.15)', transform: 'translateY(-1px)' },
          },
        },
      },
      MuiChip:   { styleOverrides: { root: { fontWeight: 500, borderRadius: 6 } } },
      MuiAppBar: {
        styleOverrides: {
          root: ({ theme: t }) => ({
            backgroundColor: t.palette.mode === 'dark' ? t.palette.background.paper : undefined,
          }),
        },
      },
    },
  });

// Pre-build all 4 variants at module load — zero cost on toggle
const THEMES = {
  'light-ltr': buildTheme('light', 'ltr'),
  'light-rtl': buildTheme('light', 'rtl'),
  'dark-ltr':  buildTheme('dark',  'ltr'),
  'dark-rtl':  buildTheme('dark',  'rtl'),
} as const;

// ── Provider ──────────────────────────────────────────────────────────────────

interface CustomThemeProviderProps { children: ReactNode; }

export const CustomThemeProvider: React.FC<CustomThemeProviderProps> = ({ children }) => {
  const mode      = useThemeStore((s) => s.mode);
  const direction = useThemeStore((s) => s.direction);

  const theme = THEMES[`${mode}-${direction}` as keyof typeof THEMES];

  const scrollThumb  = mode === 'dark' ? '#334155' : '#cbd5e1';
  const scrollThumbH = mode === 'dark' ? '#475569' : '#94a3b8';
  const scrollBorder = mode === 'dark' ? '#0f172a' : '#f8fafc';

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles styles={{
        '*': { scrollbarWidth: 'thin', scrollbarColor: `${scrollThumb} transparent` },
        '*::-webkit-scrollbar': { width: '6px', height: '6px' },
        '*::-webkit-scrollbar-track': { background: 'transparent' },
        '*::-webkit-scrollbar-thumb': {
          background: scrollThumb, borderRadius: '999px',
          border: `2px solid ${scrollBorder}`, transition: 'background 0.2s',
        },
        '*::-webkit-scrollbar-thumb:hover': { background: scrollThumbH },
        '*::-webkit-scrollbar-corner': { background: 'transparent' },
        html: { scrollbarGutter: 'stable' },
        body: { paddingRight: '0 !important', overflow: 'auto !important' },
      }} />
      {children}
    </ThemeProvider>
  );
};
