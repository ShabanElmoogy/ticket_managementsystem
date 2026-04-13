import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const DATE_FORMATS = [
  { value: 'dd/MM/yyyy',   label: 'DD/MM/YYYY  (31/12/2025)' },
  { value: 'MM/dd/yyyy',   label: 'MM/DD/YYYY  (12/31/2025)' },
  { value: 'yyyy-MM-dd',   label: 'YYYY-MM-DD  (2025-12-31)' },
  { value: 'dd-MM-yyyy',   label: 'DD-MM-YYYY  (31-12-2025)' },
  { value: 'MM-dd-yyyy',   label: 'MM-DD-YYYY  (12-31-2025)' },
  { value: 'd MMM yyyy',   label: 'D MMM YYYY  (31 Dec 2025)' },
  { value: 'MMM d, yyyy',  label: 'MMM D, YYYY  (Dec 31, 2025)' },
] as const;

/**
 * Map date-fns format tokens → dayjs/MUI DatePicker format tokens.
 * date-fns uses lowercase dd/MM, dayjs uses uppercase DD/MM.
 */
const DATE_FNS_TO_DAYJS: Record<string, string> = {
  'dd/MM/yyyy':  'DD/MM/YYYY',
  'MM/dd/yyyy':  'MM/DD/YYYY',
  'yyyy-MM-dd':  'YYYY-MM-DD',
  'dd-MM-yyyy':  'DD-MM-YYYY',
  'MM-dd-yyyy':  'MM-DD-YYYY',
  'd MMM yyyy':  'D MMM YYYY',
  'MMM d, yyyy': 'MMM D, YYYY',
};

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
    { name: 'tenant-settings' }
  )
);

/** Read the current date format (date-fns tokens) — used in dateUtils */
export const getDateFormat = (): DateFormatValue =>
  useTenantStore.getState().dateFormat;

/** Read the current date format in dayjs/MUI DatePicker tokens */
export const getPickerDateFormat = (): string =>
  DATE_FNS_TO_DAYJS[useTenantStore.getState().dateFormat] ?? 'DD/MM/YYYY';
