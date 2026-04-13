import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TicketView = 'list' | 'grid' | 'compact';

interface UiState {
  ticketView: TicketView;
  setTicketView: (view: TicketView) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      ticketView: 'list',
      setTicketView: (ticketView) => set({ ticketView }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ ticketView: state.ticketView }),
    }
  )
);
