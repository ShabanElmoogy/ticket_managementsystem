import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { http, type ApiError } from './httpClient';
import { requestDeduplicator } from './requestDeduplicator';

// ─────────────────────────────────────────────────────────────────────────────
// Retry config
// ─────────────────────────────────────────────────────────────────────────────

const MAX_ATTEMPTS  = 3;   // total attempts (1 initial + 2 retries)
const BASE_DELAY_MS = 1_000;
const MAX_DELAY_MS  = 10_000;

/**
 * Exponential backoff with full jitter.
 *
 * Formula: random(0, min(cap, base * 2^attempt))
 *
 * Jitter prevents thundering herd — multiple clients retrying simultaneously
 * at the same interval would all hit the server at once. Randomizing spreads
 * the load across the backoff window.
 *
 * Reference: https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
 */
function getBackoffDelay(attempt: number): number {
  const exponential = BASE_DELAY_MS * Math.pow(2, attempt);
  const capped      = Math.min(exponential, MAX_DELAY_MS);
  return Math.floor(Math.random() * capped); // full jitter: [0, capped)
}

// ─────────────────────────────────────────────────────────────────────────────
// Core retry loop
// Deduplication wraps the first attempt only — retries always execute fresh.
// ─────────────────────────────────────────────────────────────────────────────

async function retryRequest<T>(config: AxiosRequestConfig, attempt = 0): Promise<T> {
  try {
    // First attempt goes through the deduplicator — identical in-flight GETs
    // share one Promise. Retries bypass it (the original request already failed,
    // so there's no in-flight entry to share).
    const response: AxiosResponse<T> = attempt === 0
      ? await requestDeduplicator.execute(config, (c) => http.request<T>(c)) as AxiosResponse<T>
      : await http.request<T>(config);

    return response.data;
  } catch (error) {
    const apiError = error as ApiError;

    // Don't retry if: max attempts reached, or error is not retryable
    if (attempt + 1 >= MAX_ATTEMPTS || !apiError.isRetryable) {
      throw error;
    }

    const delay = getBackoffDelay(attempt);

    if (__DEV__) {
      console.warn(
        `⚠️ Retrying request (attempt ${attempt + 1}/${MAX_ATTEMPTS - 1}) ` +
        `after ${delay}ms — ${config.method?.toUpperCase()} ${config.url}`,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryRequest<T>(config, attempt + 1);
  }
}

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  return retryRequest<T>(config);
}
