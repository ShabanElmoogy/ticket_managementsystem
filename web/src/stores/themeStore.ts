import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type PaletteMode = 'light' | 'dark';

interface ThemeState {
  mode: PaletteMode;
  toggleTheme: () => void;
  setMode: (mode: PaletteMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'dark',

      toggleTheme: () => {
        const currentMode = get().mode;
        set({ mode: currentMode === 'light' ? 'dark' : 'light' });
      },

      setMode: (mode: PaletteMode) => set({ mode }),
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({ mode: state.mode }),
    }
  )
);