import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DATE_FORMATS = [
  { value: 'DD/MM/YYYY',  label: 'DD/MM/YYYY  (31/12/2025)' },
  { value: 'MM/DD/YYYY',  label: 'MM/DD/YYYY  (12/31/2025)' },
  { value: 'YYYY-MM-DD',  label: 'YYYY-MM-DD  (2025-12-31)' },
  { value: 'DD-MM-YYYY',  label: 'DD-MM-YYYY  (31-12-2025)' },
  { value: 'MM-DD-YYYY',  label: 'MM-DD-YYYY  (12-31-2025)' },
  { value: 'D MMM YYYY',  label: 'D MMM YYYY  (31 Dec 2025)' },
  { value: 'MMM D, YYYY', label: 'MMM D, YYYY  (Dec 31, 2025)' },
] as const;

export type DateFormatValue = typeof DATE_FORMATS[number]['value'];

interface TenantState {
  dateFormat: DateFormatValue;
  setDateFormat: (fmt: DateFormatValue) => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      dateFormat: 'DD/MM/YYYY',
      setDateFormat: (dateFormat) => set({ dateFormat }),
    }),
    {
      name: 'tenant-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/** Read the current dayjs date format — used in dateUtils */
export const getDateFormat = (): DateFormatValue =>
  useTenantStore.getState().dateFormat;
