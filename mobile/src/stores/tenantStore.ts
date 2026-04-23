import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BaseApiService } from '../services/api/base';

// ── Format definitions — date-fns tokens (same as API + web) ─────────────────

export const DATE_FORMATS = [
  { value: 'dd/MM/yyyy',  label: 'DD/MM/YYYY',  preview: '31/12/2025' },
  { value: 'MM/dd/yyyy',  label: 'MM/DD/YYYY',  preview: '12/31/2025' },
  { value: 'yyyy-MM-dd',  label: 'YYYY-MM-DD',  preview: '2025-12-31' },
  { value: 'dd-MM-yyyy',  label: 'DD-MM-YYYY',  preview: '31-12-2025' },
  { value: 'MM-dd-yyyy',  label: 'MM-DD-YYYY',  preview: '12-31-2025' },
  { value: 'd MMM yyyy',  label: 'D MMM YYYY',  preview: '31 Dec 2025' },
  { value: 'MMM d, yyyy', label: 'MMM D, YYYY', preview: 'Dec 31, 2025' },
] as const;

/** date-fns format token — exactly what the API stores and returns */
export type DateFormatValue = typeof DATE_FORMATS[number]['value'];

// ── date-fns → dayjs token map ────────────────────────────────────────────────
// The API and web use date-fns tokens (lowercase dd/MM/yyyy).
// dayjs uses different tokens (uppercase DD/MM/YYYY).
// Convert only at the point of formatting — store the date-fns value.

const DATE_FNS_TO_DAYJS: Record<string, string> = {
  'dd/MM/yyyy':  'DD/MM/YYYY',
  'MM/dd/yyyy':  'MM/DD/YYYY',
  'yyyy-MM-dd':  'YYYY-MM-DD',
  'dd-MM-yyyy':  'DD-MM-YYYY',
  'MM-dd-yyyy':  'MM-DD-YYYY',
  'd MMM yyyy':  'D MMM YYYY',
  'MMM d, yyyy': 'MMM D, YYYY',
};

/** Convert stored date-fns format to dayjs format for use with dayjs() */
export const toDayjsFormat = (dateFnsFormat: string): string =>
  DATE_FNS_TO_DAYJS[dateFnsFormat] ?? 'DD/MM/YYYY';

// ── Store ─────────────────────────────────────────────────────────────────────

interface TenantState {
  /** Stored as date-fns format token — same as API (e.g. 'dd/MM/yyyy') */
  dateFormat: DateFormatValue;
  setDateFormat: (fmt: string) => void;
  /** Fetch dateFormat from API and sync to store */
  syncDateFormat: () => Promise<void>;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      dateFormat: 'dd/MM/yyyy',

      /** Accept any format string — validates against known formats, falls back to default */
      setDateFormat: (fmt) => {
        const known = DATE_FORMATS.find((f) => f.value === fmt);
        set({ dateFormat: known ? fmt as DateFormatValue : 'dd/MM/yyyy' });
      },

      syncDateFormat: async () => {
        try {
          const api  = new BaseApiService();
          const data = await (api as any).get<{ dateFormat: string }>('/reminders/date-format-settings');
          if (data?.dateFormat) {
            const known = DATE_FORMATS.find((f) => f.value === data.dateFormat);
            const fmt   = known ? data.dateFormat as DateFormatValue : 'dd/MM/yyyy';
            set({ dateFormat: fmt });
            if (__DEV__) console.log('📅 dateFormat synced:', fmt);
          }
        } catch {
          if (__DEV__) console.warn('📅 dateFormat sync failed — using stored value');
        }
      },
    }),
    {
      name: 'tenant-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/**
 * Read the current date format as a **date-fns token** (e.g. 'dd/MM/yyyy').
 * Used by dateUtils — converts to dayjs format internally.
 */
export const getDateFormat = (): DateFormatValue =>
  useTenantStore.getState().dateFormat;

/**
 * Read the current date format as a **dayjs token** (e.g. 'DD/MM/YYYY').
 * Use this when calling dayjs().format().
 */
export const getDayjsFormat = (): string =>
  toDayjsFormat(useTenantStore.getState().dateFormat);
