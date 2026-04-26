import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from './useToast';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ErrorContext {
  feature?: string;
  operation?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logToConsole?: boolean;
  reportToCrashlytics?: boolean;
  fallbackMessage?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Error Classification
// ─────────────────────────────────────────────────────────────────────────────

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ClassifiedError {
  message: string;
  severity: ErrorSeverity;
  isRetryable: boolean;
  shouldReport: boolean;
  userMessage: string;
}

function classifyError(error: unknown, context?: ErrorContext): ClassifiedError {
  // Network errors
  if (isNetworkError(error)) {
    return {
      message: getErrorMessage(error),
      severity: 'medium',
      isRetryable: true,
      shouldReport: false,
      userMessage: 'errors.network.message',
    };
  }

  // Authentication errors
  if (isAuthError(error)) {
    return {
      message: getErrorMessage(error),
      severity: 'high',
      isRetryable: false,
      shouldReport: false,
      userMessage: 'errors.auth.message',
    };
  }

  // Validation errors
  if (isValidationError(error)) {
    return {
      message: getErrorMessage(error),
      severity: 'low',
      isRetryable: false,
      shouldReport: false,
      userMessage: getErrorMessage(error), // Use actual validation message
    };
  }

  // Server errors
  if (isServerError(error)) {
    return {
      message: getErrorMessage(error),
      severity: 'high',
      isRetryable: true,
      shouldReport: true,
      userMessage: 'errors.server.message',
    };
  }

  // JavaScript errors (likely bugs)
  if (error instanceof Error) {
    return {
      message: error.message,
      severity: 'critical',
      isRetryable: false,
      shouldReport: true,
      userMessage: 'errors.unexpected.message',
    };
  }

  // Unknown errors
  return {
    message: String(error),
    severity: 'medium',
    isRetryable: false,
    shouldReport: true,
    userMessage: 'errors.unknown.message',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Error Type Guards
// ─────────────────────────────────────────────────────────────────────────────

function isNetworkError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null) {
    const e = error as Record<string, unknown>;
    return (
      e.code === 'NETWORK_ERROR' ||
      e.code === 'ECONNABORTED' ||
      e.code === 'ERR_NETWORK' ||
      e.message === 'Network Error' ||
      e.status === 0
    );
  }
  return false;
}

function isAuthError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null) {
    const e = error as Record<string, unknown>;
    return e.status === 401 || e.status === 403;
  }
  return false;
}

function isValidationError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null) {
    const e = error as Record<string, unknown>;
    return e.status === 400 || e.status === 422;
  }
  return false;
}

function isServerError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null) {
    const e = error as Record<string, unknown>;
    const status = e.status as number;
    return status >= 500 && status < 600;
  }
  return false;
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null) {
    const e = error as Record<string, unknown>;
    return String(e.message || e.error || 'Unknown error');
  }
  return 'Unknown error';
}

// ─────────────────────────────────────────────────────────────────────────────
// Error Reporting (placeholder for crash reporting service)
// ─────────────────────────────────────────────────────────────────────────────

function reportError(
  error: unknown,
  context: ErrorContext,
  classified: ClassifiedError
): void {
  if (!classified.shouldReport) return;

  // In development, just log to console
  if (__DEV__) {
    console.error('Error reported:', {
      error,
      context,
      classified,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // In production, send to crash reporting service
  // Example: Sentry, Bugsnag, Firebase Crashlytics, etc.
  try {
    // Sentry.captureException(error, {
    //   tags: {
    //     feature: context.feature,
    //     operation: context.operation,
    //     severity: classified.severity,
    //   },
    //   extra: {
    //     context,
    //     classified,
    //   },
    // });
  } catch (reportingError) {
    console.error('Failed to report error:', reportingError);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useErrorHandler() {
  const { t } = useTranslation();
  const toast = useToast();

  const handleError = useCallback(
    (
      error: unknown,
      context?: ErrorContext,
      options: ErrorHandlerOptions = {}
    ) => {
      const {
        showToast = true,
        logToConsole = true,
        reportToCrashlytics = true,
        fallbackMessage,
      } = options;

      const classified = classifyError(error, context);

      // Log to console in development
      if (logToConsole && __DEV__) {
        console.error('Error handled:', {
          error,
          context,
          classified,
          timestamp: new Date().toISOString(),
        });
      }

      // Show user-friendly toast
      if (showToast) {
        const userMessage = 
          fallbackMessage || 
          t(classified.userMessage) || 
          classified.message;

        if (classified.severity === 'critical' || classified.severity === 'high') {
          toast.error(userMessage);
        } else {
          toast.info(userMessage);
        }
      }

      // Report to crash reporting service
      if (reportToCrashlytics && classified.shouldReport) {
        reportError(error, context || {}, classified);
      }

      return classified;
    },
    [t, toast]
  );

  const handleAsyncError = useCallback(
    async (
      asyncOperation: () => Promise<void>,
      context?: ErrorContext,
      options?: ErrorHandlerOptions
    ) => {
      try {
        await asyncOperation();
      } catch (error) {
        handleError(error, context, options);
      }
    },
    [handleError]
  );

  const createErrorHandler = useCallback(
    (context: ErrorContext, options?: ErrorHandlerOptions) => {
      return (error: unknown) => handleError(error, context, options);
    },
    [handleError]
  );

  return {
    handleError,
    handleAsyncError,
    createErrorHandler,
    classifyError,
  };
}

export default useErrorHandler;