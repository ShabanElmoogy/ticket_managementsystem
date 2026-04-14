import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type PaletteMode = 'light' | 'dark';
type Direction   = 'ltr' | 'rtl';

interface ThemeState {
  mode:            PaletteMode;
  direction:       Direction;
  toggleTheme:     () => void;
  setMode:         (mode: PaletteMode) => void;
  toggleDirection: () => void;
  setDirection:    (dir: Direction) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode:      'dark',
      direction: 'ltr',

      toggleTheme: () => {
        const currentMode = get().mode;
        set({ mode: currentMode === 'light' ? 'dark' : 'light' });
      },

      setMode: (mode) => set({ mode }),

      toggleDirection: () => {
        const next = get().direction === 'ltr' ? 'rtl' : 'ltr';
        document.documentElement.dir = next;
        set({ direction: next });
      },

      setDirection: (direction) => {
        document.documentElement.dir = direction;
        set({ direction });
      },
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({ mode: state.mode, direction: state.direction }),
      onRehydrateStorage: () => (state) => {
        // Restore direction on page load
        if (state?.direction) document.documentElement.dir = state.direction;
      },
    }
  )
);