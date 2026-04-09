import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type PaletteMode = 'light' | 'dark';
export type TicketView = 'list' | 'grid' | 'compact';

interface ThemeState {
  mode: PaletteMode;
  ticketView: TicketView;
  toggleTheme: () => void;
  setMode: (mode: PaletteMode) => void;
  setTicketView: (view: TicketView) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'dark',
      ticketView: 'list',

      toggleTheme: () => {
        const currentMode = get().mode;
        const newMode = currentMode === 'light' ? 'dark' : 'light';
        set({ mode: newMode });
      },

      setMode: (mode: PaletteMode) => {
        set({ mode });
      },

      setTicketView: (view: TicketView) => {
        set({ ticketView: view });
      },
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({ mode: state.mode, ticketView: state.ticketView }),
    }
  )
);