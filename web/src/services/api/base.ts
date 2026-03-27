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

const BASE_URL = import.meta.env.PROD
  ? (import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "/api")
  : "/api"; // Always use Vite proxy in dev — avoids HTTPS/CORS issues

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

    // Add tenant header (multi-tenant)
    // Best practice:
    // - SUPER_ADMIN login is global and can omit tenant.
    // - Tenant users must send X-Tenant-Slug even for /auth/login.
    // We attach tenant slug whenever it exists; backend will ignore it for SUPER_ADMIN.
    const tenantSlug = localStorage.getItem("tenantSlug");
    if (tenantSlug) {
      (config.headers as Record<string, string>)["X-Tenant-Slug"] = tenantSlug;
    }

    // Add request ID for tracing
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    (config.headers as Record<string, string>)["X-Request-ID"] = requestId;

    // Log request in development
    // if (import.meta.env.DEV) {
    //   console.log(
    //     `📤 [${requestId}] ${config.method?.toUpperCase()} ${config.url}`,
    //     config.data ? { data: config.data } : ""
    //   );
    // }

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

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: ApiError) => void;
}> = [];

const processQueue = (error: ApiError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

http.interceptors.response.use(
  (response) => {
    // if (import.meta.env.DEV) {
    //   const requestId = response.config.headers["X-Request-ID"];
    //   console.log(
    //     `📥 [${requestId}] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`
    //   );
    // }
    return response;
  },
  async (error: AxiosError) => {
    const requestId = error.config?.headers?.["X-Request-ID"];

    if (import.meta.env.DEV) {
      console.error(
        `❌ [${requestId}] ${error.response?.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
        error.response?.data || error.message
      );
    }

    const status = error.response?.status;
    const data = error.response?.data as unknown;

    let message = "An unexpected error occurred";
    if (typeof data === "object" && data && "error" in (data as Record<string, unknown>)) {
      message = String((data as Record<string, unknown>).error);
    } else if (typeof data === "object" && data && "message" in (data as Record<string, unknown>)) {
      message = String((data as Record<string, unknown>).message);
    } else if (error.message) {
      message = error.message;
    }

    if (status === 401 && error.config && !error.config.url?.includes("/auth/refresh")) {
      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const refreshToken = localStorage.getItem("refreshToken");

          if (!refreshToken) {
            throw new Error("No refresh token available");
          }

          const response = await http.post<{ token: string; refreshToken?: string }>("/auth/refresh", {
            refreshToken,
          });

          const newToken = response.data.token;
          const newRefreshToken = response.data.refreshToken;

          localStorage.setItem("token", newToken);
          if (newRefreshToken) {
            localStorage.setItem("refreshToken", newRefreshToken);
          }
          (http.defaults.headers.common as Record<string, string>).Authorization = `Bearer ${newToken}`;

          try {
            const { useAuthStore } = await import("../../stores/authStore");
            useAuthStore.getState().setToken(newToken);
            if (newRefreshToken) {
              useAuthStore.getState().setRefreshToken(newRefreshToken);
            }
          } catch (e) {
            console.error("Failed to update auth store:", e);
          }

          if (import.meta.env.DEV) {
            console.log("✅ Token refreshed successfully");
          }

          processQueue(null, newToken);

          if (error.config) {
            error.config.headers = error.config.headers ?? {};
            (error.config.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
            return http.request(error.config);
          }
        } catch (refreshError) {
          const refreshErrorMessage =
            refreshError instanceof Error ? refreshError.message : "Token refresh failed";

          processQueue(
            {
              status: 401,
              message: refreshErrorMessage,
              isRetryable: false,
            },
            null
          );

          try {
            const { useAuthStore } = await import("../../stores/authStore");
            useAuthStore.getState().logout();
          } catch (e) {
            console.error("Failed to logout:", e);
          }

          return Promise.reject({
            status: 401,
            message: "Session expired. Please login again.",
            isRetryable: false,
          });
        } finally {
          isRefreshing = false;
        }
      } else {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (error.config) {
                error.config.headers = error.config.headers ?? {};
                (error.config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
                resolve(http.request(error.config));
              }
            },
            reject: (error: ApiError) => {
              reject(error);
            },
          });
        });
      }
    }

    const isRetryable =
      !error.response ||
      error.response.status === 408 ||
      error.response.status === 429 ||
      (error.response.status >= 500 && error.response.status !== 501);

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
