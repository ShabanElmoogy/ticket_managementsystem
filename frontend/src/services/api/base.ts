import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse } from "axios";

/**
 * API Base Service - Centralized HTTP client with best practices
 * Features:
 * - Single axios instance with consistent configuration
 * - Automatic token injection from auth store
 * - Comprehensive error handling and normalization
 * - Request/response interceptors for logging and debugging
 * - Type-safe API methods
 * - Retry logic for failed requests
 */

// ============================================================================
// Configuration
// ============================================================================

const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  (import.meta.env.PROD ? "/api" : "http://localhost:3001/api");

const REQUEST_TIMEOUT = 15000; // 15 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// ============================================================================
// Error Types
// ============================================================================

export type ApiError = {
  status?: number;
  message: string;
  details?: unknown;
  code?: string;
  isRetryable?: boolean;
};

// ============================================================================
// Axios Instance Setup
// ============================================================================

const http = axios.create({
  baseURL: BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================================================
// Request Interceptor - Add Authorization Token
// ============================================================================

http.interceptors.request.use(
  (config) => {
    // Get token from localStorage (synced by auth store)
    const token = localStorage.getItem("token");

    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }

    // Add request ID for tracing
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    (config.headers as Record<string, string>)["X-Request-ID"] = requestId;

    // Log request in development
    if (import.meta.env.DEV) {
      console.log(
        `📤 [${requestId}] ${config.method?.toUpperCase()} ${config.url}`,
        config.data ? { data: config.data } : ""
      );
    }

    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// ============================================================================
// Response Interceptor - Error Normalization & Logging
// ============================================================================

http.interceptors.response.use(
  (response) => {
    // Log successful response in development
    if (import.meta.env.DEV) {
      const requestId = response.config.headers["X-Request-ID"];
      console.log(
        `📥 [${requestId}] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`
      );
    }
    return response;
  },
  (error: AxiosError) => {
    const requestId = error.config?.headers?.["X-Request-ID"];

    // Log error in development
    if (import.meta.env.DEV) {
      console.error(
        `❌ [${requestId}] ${error.response?.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
        error.response?.data || error.message
      );
    }

    // Normalize error response
    const status = error.response?.status;
    const data = error.response?.data as unknown;

    // Extract error message
    let message = "An unexpected error occurred";
    if (typeof data === "object" && data && "error" in (data as Record<string, unknown>)) {
      message = String((data as Record<string, unknown>).error);
    } else if (typeof data === "object" && data && "message" in (data as Record<string, unknown>)) {
      message = String((data as Record<string, unknown>).message);
    } else if (error.message) {
      message = error.message;
    }

    // Determine if error is retryable
    const isRetryable =
      !error.response || // Network error
      error.response.status === 408 || // Request timeout
      error.response.status === 429 || // Too many requests
      error.response.status >= 500; // Server error

    const normalized: ApiError = {
      status,
      message,
      details: data,
      code: error.code,
      isRetryable,
    };

    return Promise.reject(normalized);
  }
);

// ============================================================================
// Retry Logic
// ============================================================================

/**
 * Retry a failed request with exponential backoff
 */
async function retryRequest<T>(
  config: AxiosRequestConfig,
  retryCount: number = 0
): Promise<T> {
  try {
    const response: AxiosResponse<T> = await http.request<T>(config);
    return response.data;
  } catch (error) {
    const apiError = error as ApiError;

    // Don't retry if max retries reached or error is not retryable
    if (retryCount >= MAX_RETRIES || !apiError.isRetryable) {
      throw error;
    }

    // Calculate exponential backoff delay
    const delay = RETRY_DELAY * Math.pow(2, retryCount);

    if (import.meta.env.DEV) {
      console.warn(
        `⚠️ Retrying request (attempt ${retryCount + 1}/${MAX_RETRIES}) after ${delay}ms`
      );
    }

    // Wait before retrying
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Retry the request
    return retryRequest<T>(config, retryCount + 1);
  }
}

// ============================================================================
// Core Request Function
// ============================================================================

/**
 * Make an HTTP request with automatic retry logic
 */
async function request<T>(config: AxiosRequestConfig): Promise<T> {
  return retryRequest<T>(config);
}

// ============================================================================
// Public API
// ============================================================================

export const api = {
  /**
   * GET request
   */
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    request<T>({ url, method: "GET", ...config }),

  /**
   * POST request
   */
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ url, method: "POST", data, ...config }),

  /**
   * PUT request
   */
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ url, method: "PUT", data, ...config }),

  /**
   * PATCH request
   */
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ url, method: "PATCH", data, ...config }),

  /**
   * DELETE request
   */
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    request<T>({ url, method: "DELETE", ...config }),

  /**
   * Set authorization token in default headers
   * (Useful for programmatic token updates)
   */
  setAuthToken: (token?: string | null) => {
    if (!token) {
      delete (http.defaults.headers.common as Record<string, string>).Authorization;
      return;
    }
    (http.defaults.headers.common as Record<string, string>).Authorization = `Bearer ${token}`;
  },

  /**
   * Clear authorization token
   */
  clearAuthToken: () => {
    delete (http.defaults.headers.common as Record<string, string>).Authorization;
  },

  /**
   * Get current base URL
   */
  getBaseUrl: () => BASE_URL,

  /**
   * Get axios instance for advanced usage
   */
  getHttpClient: () => http,
};

// ============================================================================
// Base Service Class
// ============================================================================

/**
 * Base class for API services
 * Provides common HTTP methods for domain-specific services
 */
export class BaseApiService {
  protected get = api.get;
  protected post = api.post;
  protected put = api.put;
  protected patch = api.patch;
  protected delete = api.delete;

  /**
   * Get the base URL
   */
  protected getBaseUrl = api.getBaseUrl;

  /**
   * Get the axios instance for advanced usage
   */
  protected getHttpClient = api.getHttpClient;
}

// ============================================================================
// Exports
// ============================================================================

export type { AxiosRequestConfig };
