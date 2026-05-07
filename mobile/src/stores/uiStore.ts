import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import type { PaletteOption } from '@/src/constants/tokens';

export type TicketView = 'list' | 'grid' | 'compact';
export type Direction  = 'ltr' | 'rtl';
export type ColorMode  = 'light' | 'dark' | 'system';

export type AdminView = 'table' | 'grid' | 'compact';

// Re-export PaletteOption for convenience
export type { PaletteOption };

interface UiState {
  ticketView: TicketView;
  setTicketView: (view: TicketView) => void;

  adminViews: Record<string, AdminView>;
  setAdminView: (screen: string, view: AdminView) => void;
  getAdminView: (screen: string) => AdminView;

  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  toggleColorMode: () => void;

  direction: Direction;
  setDirection: (dir: Direction) => void;

  paletteOption: PaletteOption;
  setPaletteOption: (option: PaletteOption) => void;

  unreadCount: number;
  setUnreadCount: (count: number) => void;
  incrementUnread: () => void;
  clearUnread: () => void;

  activityFeedOpen: boolean;
  setActivityFeedOpen: (open: boolean) => void;
  toggleActivityFeed: () => void;
}

/** Sync Appearance API so navigation theme + status bar follow uiStore */
function applyColorMode(mode: ColorMode) {
  Appearance.setColorScheme(mode === 'system' ? null : mode);
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      ticketView: 'list',
      setTicketView: (ticketView) => set({ ticketView }),

      adminViews: {},
      setAdminView: (screen, view) =>
        set((s) => ({ adminViews: { ...s.adminViews, [screen]: view } })),
      getAdminView: (screen) => get().adminViews[screen] ?? 'table',

      colorMode: 'system',
      setColorMode: (colorMode) => {
        applyColorMode(colorMode);
        set({ colorMode });
      },
      toggleColorMode: () => {
        const next = get().colorMode === 'light' ? 'dark' : 'light';
        applyColorMode(next);
        set({ colorMode: next });
      },

      direction: 'ltr',
      setDirection: (direction) => set({ direction }),

      paletteOption: 'blue',
      setPaletteOption: (paletteOption) => set({ paletteOption }),

      unreadCount: 0,
      setUnreadCount: (unreadCount) => set({ unreadCount }),
      incrementUnread: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),
      clearUnread: () => set({ unreadCount: 0 }),

      activityFeedOpen: false,
      setActivityFeedOpen: (activityFeedOpen) => set({ activityFeedOpen }),
      toggleActivityFeed: () => set((s) => ({ activityFeedOpen: !s.activityFeedOpen })),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        ticketView: state.ticketView,
        adminViews: state.adminViews,
        colorMode:  state.colorMode,
        paletteOption: state.paletteOption,
        // direction is NOT persisted — always derived from language at boot
      }),
      onRehydrateStorage: () => (state) => {
        // Re-apply persisted colorMode to Appearance after rehydration
        if (state?.colorMode) applyColorMode(state.colorMode);
      },
    }
  )
);
