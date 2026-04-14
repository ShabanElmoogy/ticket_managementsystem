import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { http, type ApiError } from './httpClient';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1_000;

async function retryRequest<T>(config: AxiosRequestConfig, attempt = 0): Promise<T> {
  try {
    const response: AxiosResponse<T> = await http.request<T>(config);
    return response.data;
  } catch (error) {
    const apiError = error as ApiError;

    if (attempt >= MAX_RETRIES || !apiError.isRetryable) {
      throw error;
    }

    const delay = RETRY_DELAY_MS * Math.pow(2, attempt);

    if (__DEV__) {
      console.warn(`⚠️ Retrying request (attempt ${attempt + 1}/${MAX_RETRIES}) after ${delay}ms`);
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryRequest<T>(config, attempt + 1);
  }
}

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  return retryRequest<T>(config);
}
