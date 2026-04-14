import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TicketView = 'list' | 'grid' | 'compact';
export type Direction  = 'ltr' | 'rtl';
export type ColorMode  = 'light' | 'dark' | 'system';

interface UiState {
  // Ticket list display preference
  ticketView: TicketView;
  setTicketView: (view: TicketView) => void;

  // Theme
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  toggleColorMode: () => void;

  // RTL / LTR — mirrors web themeStore.direction
  direction: Direction;
  setDirection: (dir: Direction) => void;

  // Notification badge count
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  incrementUnread: () => void;
  clearUnread: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      ticketView: 'list',
      setTicketView: (ticketView) => set({ ticketView }),

      colorMode: 'system',
      setColorMode: (colorMode) => set({ colorMode }),
      toggleColorMode: () => {
        const current = get().colorMode;
        set({ colorMode: current === 'light' ? 'dark' : 'light' });
      },

      direction: 'ltr',
      setDirection: (direction) => set({ direction }),

      unreadCount: 0,
      setUnreadCount: (unreadCount) => set({ unreadCount }),
      incrementUnread: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),
      clearUnread: () => set({ unreadCount: 0 }),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Don't persist unreadCount — always starts at 0
      partialize: (state) => ({
        ticketView: state.ticketView,
        colorMode:  state.colorMode,
        direction:  state.direction,
      }),
      onRehydrateStorage: () => (_state) => {
        // direction is applied via DirectionProvider — no I18nManager needed
      },
    }
  )
);
