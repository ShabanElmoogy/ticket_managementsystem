import type { AxiosError } from 'axios';

export function getErrorMessage(error: unknown, fallback = 'Unexpected error'): string {
  if (!error) return fallback;
  // Axios-style error normalization
  const axiosErr = error as AxiosError<{ message?: string } | string>;
  const data = axiosErr?.response?.data as { message?: string } | string | undefined;
  if (typeof data === 'string' && data) return data;
  if (data && typeof data === 'object' && data.message) return data.message;
  const message = (error as Error)?.message;
  if (typeof message === 'string' && message) return message;
  try {
    return JSON.stringify(error);
  } catch {
    return fallback;
  }
}
