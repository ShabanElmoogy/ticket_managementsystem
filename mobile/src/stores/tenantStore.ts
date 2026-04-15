import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DATE_FORMATS = [
  { value: 'dd/MM/yyyy',  label: 'DD/MM/YYYY',  preview: '31/12/2025' },
  { value: 'MM/dd/yyyy',  label: 'MM/DD/YYYY',  preview: '12/31/2025' },
  { value: 'yyyy-MM-dd',  label: 'YYYY-MM-DD',  preview: '2025-12-31' },
  { value: 'dd-MM-yyyy',  label: 'DD-MM-YYYY',  preview: '31-12-2025' },
  { value: 'MM-dd-yyyy',  label: 'MM-DD-YYYY',  preview: '12-31-2025' },
  { value: 'd MMM yyyy',  label: 'D MMM YYYY',  preview: '31 Dec 2025' },
  { value: 'MMM d, yyyy', label: 'MMM D, YYYY', preview: 'Dec 31, 2025' },
] as const;

export type DateFormatValue = typeof DATE_FORMATS[number]['value'];

interface TenantState {
  dateFormat: DateFormatValue;
  setDateFormat: (fmt: DateFormatValue) => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      dateFormat: 'dd/MM/yyyy',
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
