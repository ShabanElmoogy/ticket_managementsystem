import { AxiosError } from 'axios';

/**
 * Extract error message from axios error
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    if (error.response?.data) {
      const errorData = error.response.data as any;
      return errorData.error || errorData.message || `HTTP error! status: ${error.response.status}`;
    } else if (error.request) {
      return 'Network error - no response received';
    } else {
      return error.message || 'Request failed';
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unknown error occurred';
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: unknown): boolean => {
  return error instanceof AxiosError && !error.response;
};

/**
 * Check if error is a specific HTTP status code
 */
export const isHttpError = (error: unknown, statusCode: number): boolean => {
  return error instanceof AxiosError && error.response?.status === statusCode;
};

/**
 * Check if error is unauthorized (401)
 */
export const isUnauthorizedError = (error: unknown): boolean => {
  return isHttpError(error, 401);
};

/**
 * Check if error is forbidden (403)
 */
export const isForbiddenError = (error: unknown): boolean => {
  return isHttpError(error, 403);
};

/**
 * Check if error is not found (404)
 */
export const isNotFoundError = (error: unknown): boolean => {
  return isHttpError(error, 404);
};

/**
 * Check if error is server error (5xx)
 */
export const isServerError = (error: unknown): boolean => {
  return error instanceof AxiosError && 
         error.response?.status !== undefined && 
         error.response.status >= 500;
};

/**
 * Retry function for failed requests
 */
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: unknown;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx) except 408 (timeout)
      if (error instanceof AxiosError && error.response?.status) {
        const status = error.response.status;
        if (status >= 400 && status < 500 && status !== 408) {
          throw error;
        }
      }
      
      // Don't retry on the last attempt
      if (i === maxRetries) {
        break;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  
  throw lastError;
};