/**
 * paginationStore — tenant-aware pagination state.
 *
 * Loaded once after login from GET /tenants/pagination-settings.
 * Persisted to AsyncStorage so it survives app restarts.
 *
 * Mode behavior:
 *   SERVER — send ?page=X&limit=Y to API, render server-paginated results
 *   CLIENT — fetch all data (up to maxClientRecords), paginate locally
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Types ─────────────────────────────────────────────────────────────────────

export type PaginationMode = 'SERVER' | 'CLIENT';

export interface TenantPaginationSettings {
  paginationMode:    PaginationMode;
  defaultPageSize:   number;
  maxPageSize:       number;
  allowUserOverride: boolean;
  maxClientRecords:  number;
}

interface PaginationState extends TenantPaginationSettings {
  /** User-selected page size (persisted). Null = use tenant default. */
  userPageSize: number | null;

  setSettings:  (s: TenantPaginationSettings) => void;
  setUserPageSize: (size: number | null) => void;

  /** Resolved page size — respects allowUserOverride and maxPageSize */
  getEffectivePageSize: () => number;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const usePaginationStore = create<PaginationState>()(
  persist(
    (set, get) => ({
      // Defaults — overwritten after login
      paginationMode:    'SERVER',
      defaultPageSize:   20,
      maxPageSize:       100,
      allowUserOverride: true,
      maxClientRecords:  500,
      userPageSize:      null,

      setSettings: (s) => set({ ...s }),

      setUserPageSize: (size) => set({ userPageSize: size }),

      getEffectivePageSize: () => {
        const { allowUserOverride, userPageSize, defaultPageSize, maxPageSize } = get();
        if (!allowUserOverride || userPageSize === null) return defaultPageSize;
        return Math.min(userPageSize, maxPageSize);
      },
    }),
    {
      name:    'pagination-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

// ── Selectors ─────────────────────────────────────────────────────────────────

export const usePaginationMode      = () => usePaginationStore((s) => s.paginationMode);
export const useEffectivePageSize   = () => usePaginationStore((s) => s.getEffectivePageSize());
export const useMaxClientRecords    = () => usePaginationStore((s) => s.maxClientRecords);
export const useAllowUserOverride   = () => usePaginationStore((s) => s.allowUserOverride);
