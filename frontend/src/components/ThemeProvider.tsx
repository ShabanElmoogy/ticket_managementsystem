import React from 'react';
import type { ReactNode } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useThemeStore } from '../stores/themeStore';

interface CustomThemeProviderProps {
  children: ReactNode;
}

export const CustomThemeProvider: React.FC<CustomThemeProviderProps> = ({ children }) => {
  const { mode } = useThemeStore();

  const theme = createTheme({
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            // Light theme colors
            primary: {
              main: '#2563eb',
              light: '#3b82f6',
              dark: '#1d4ed8',
              contrastText: '#ffffff',
            },
            secondary: {
              main: '#7c3aed',
              light: '#8b5cf6',
              dark: '#6d28d9',
              contrastText: '#ffffff',
            },
            success: {
              main: '#10b981',
              light: '#34d399',
              dark: '#059669',
            },
            warning: {
              main: '#f59e0b',
              light: '#fbbf24',
              dark: '#d97706',
            },
            error: {
              main: '#ef4444',
              light: '#f87171',
              dark: '#dc2626',
            },
            background: {
              default: '#f8fafc',
              paper: '#ffffff',
            },
            text: {
              primary: '#1e293b',
              secondary: '#64748b',
            },
          }
        : {
            // Dark theme colors
            primary: {
              main: '#3b82f6',
              light: '#60a5fa',
              dark: '#2563eb',
              contrastText: '#ffffff',
            },
            secondary: {
              main: '#8b5cf6',
              light: '#a78bfa',
              dark: '#7c3aed',
              contrastText: '#ffffff',
            },
            success: {
              main: '#34d399',
              light: '#6ee7b7',
              dark: '#10b981',
            },
            warning: {
              main: '#fbbf24',
              light: '#fcd34d',
              dark: '#f59e0b',
            },
            error: {
              main: '#f87171',
              light: '#fca5a5',
              dark: '#ef4444',
            },
            background: {
              default: '#0f172a',
              paper: '#1e293b',
            },
            text: {
              primary: '#f1f5f9',
              secondary: '#cbd5e1',
            },
          }),
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
        fontSize: '2.5rem',
      },
      h2: {
        fontWeight: 600,
        fontSize: '2rem',
      },
      h3: {
        fontWeight: 600,
        fontSize: '1.75rem',
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.5rem',
      },
      h5: {
        fontWeight: 600,
        fontSize: '1.25rem',
      },
      h6: {
        fontWeight: 600,
        fontSize: '1.125rem',
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: () => ({
            boxShadow: mode === 'dark'
              ? '0px 4px 6px rgba(0, 0, 0, 0.3)'
              : '0px 4px 6px rgba(0, 0, 0, 0.05)',
            border: mode === 'dark'
              ? '1px solid #334155'
              : '1px solid #e2e8f0',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              boxShadow: mode === 'dark'
                ? '0px 10px 15px rgba(0, 0, 0, 0.4)'
                : '0px 10px 15px rgba(0, 0, 0, 0.1)',
              transform: 'translateY(-2px)',
            },
          }),
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: () => ({
            backgroundImage: 'none',
            backgroundColor: mode === 'dark' ? '#1e293b' : '#ffffff',
            // Enhanced Kanban column backgrounds
            '&.kanban-column': {
              backgroundColor: mode === 'dark'
                ? 'rgba(30, 41, 59, 0.8)'
                : 'rgba(248, 250, 252, 0.8)',
              backdropFilter: 'blur(8px)',
              border: mode === 'dark'
                ? '1px solid rgba(51, 65, 85, 0.3)'
                : '1px solid rgba(226, 232, 240, 0.3)',
            },
            '&.kanban-column-open': {
              backgroundColor: mode === 'dark'
                ? 'rgba(59, 130, 246, 0.08)'
                : 'rgba(219, 234, 254, 0.6)',
              borderLeft: `4px solid ${mode === 'dark' ? '#3b82f6' : '#2563eb'}`,
            },
            '&.kanban-column-in-progress': {
              backgroundColor: mode === 'dark'
                ? 'rgba(245, 158, 11, 0.08)'
                : 'rgba(255, 237, 213, 0.6)',
              borderLeft: `4px solid ${mode === 'dark' ? '#f59e0b' : '#d97706'}`,
            },
            '&.kanban-column-resolved': {
              backgroundColor: mode === 'dark'
                ? 'rgba(16, 185, 129, 0.08)'
                : 'rgba(209, 250, 229, 0.6)',
              borderLeft: `4px solid ${mode === 'dark' ? '#10b981' : '#059669'}`,
            },
            '&.kanban-column-closed': {
              backgroundColor: mode === 'dark'
                ? 'rgba(107, 114, 128, 0.08)'
                : 'rgba(243, 244, 246, 0.6)',
              borderLeft: `4px solid ${mode === 'dark' ? '#6b7280' : '#4b5563'}`,
            },
          }),
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 8,
            padding: '10px 20px',
            transition: 'all 0.2s ease-in-out',
          },
          contained: {
            boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
            '&:hover': {
              boxShadow: '0px 6px 8px rgba(0, 0, 0, 0.15)',
              transform: 'translateY(-1px)',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 500,
            borderRadius: 6,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: () => ({
            backgroundColor: mode === 'dark' ? '#1e293b' : undefined,
          }),
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  );
};