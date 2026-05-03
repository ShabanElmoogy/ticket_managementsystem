import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from './useToast';
import {
  getErrorMessage,
  isNetworkError,
  isUnauthorizedError,
  isForbiddenError,
  isServerError,
} from '@/src/shared/utils/httpUtils';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ErrorContext {
  feature?:   string;
  operation?: string;
  userId?:    string;
  metadata?:  Record<string, unknown>;
}

export interface ErrorHandlerOptions {
  showToast?:    boolean;
  logToConsole?: boolean;
  /** Whether to forward to the crash reporting service */
  shouldReport?: boolean;
  fallbackMessage?: string;
}

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ClassifiedError {
  message:      string;
  severity:     ErrorSeverity;
  isRetryable:  boolean;
  shouldReport: boolean;
  /**
   * i18n key for network/auth/server errors, or the actual message for
   * validation errors (where the server message is already user-friendly).
   */
  userMessageKey: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Error Classification
// ─────────────────────────────────────────────────────────────────────────────

function classifyError(error: unknown): ClassifiedError {
  if (isNetworkError(error)) {
    return {
      message:        getErrorMessage(error),
      severity:       'medium',
      isRetryable:    true,
      shouldReport:   false,
      userMessageKey: 'errors.network.message',
    };
  }

  if (isUnauthorizedError(error) || isForbiddenError(error)) {
    return {
      message:        getErrorMessage(error),
      severity:       'high',
      isRetryable:    false,
      shouldReport:   false,
      userMessageKey: 'errors.auth.message',
    };
  }

  // 400 / 422 — validation: use the server's message directly
  if (isValidationError(error)) {
    const msg = getErrorMessage(error);
    return {
      message:        msg,
      severity:       'low',
      isRetryable:    false,
      shouldReport:   false,
      userMessageKey: msg,
    };
  }

  if (isServerError(error)) {
    return {
      message:        getErrorMessage(error),
      severity:       'high',
      isRetryable:    true,
      shouldReport:   true,
      userMessageKey: 'errors.server.message',
    };
  }

  if (error instanceof Error) {
    return {
      message:        error.message,
      severity:       'critical',
      isRetryable:    false,
      shouldReport:   true,
      userMessageKey: 'errors.unexpected.message',
    };
  }

  return {
    message:        String(error),
    severity:       'medium',
    isRetryable:    false,
    shouldReport:   true,
    userMessageKey: 'errors.unknown.message',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Local type guard — not in httpUtils (400/422 are business logic errors)
// ─────────────────────────────────────────────────────────────────────────────

function isValidationError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null) {
    const status = (error as Record<string, unknown>).status;
    return status === 400 || status === 422;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Error Reporting (placeholder — wire to Sentry/Crashlytics when ready)
// ─────────────────────────────────────────────────────────────────────────────

function reportErrorToService(
  error: unknown,
  context: ErrorContext,
  classified: ClassifiedError,
): void {
  if (__DEV__) {
    console.error('[ErrorHandler] Reportable error:', {
      error,
      context,
      classified,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // TODO: wire to crash reporting service
  // Sentry.captureException(error, {
  //   tags: { feature: context.feature, operation: context.operation },
  //   extra: { context, classified },
  // });
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useErrorHandler() {
  const { t }  = useTranslation();
  const toast  = useToast();

  const handleError = useCallback(
    (
      error:   unknown,
      context?: ErrorContext,
      options: ErrorHandlerOptions = {},
    ) => {
      const {
        showToast    = true,
        logToConsole = true,
        shouldReport = true,
        fallbackMessage,
      } = options;

      const classified = classifyError(error);

      if (logToConsole && __DEV__) {
        console.error('[ErrorHandler]', {
          error,
          context,
          classified,
          timestamp: new Date().toISOString(),
        });
      }

      if (showToast) {
        const userMessage =
          fallbackMessage ||
          t(classified.userMessageKey) ||
          classified.message;

        if (classified.severity === 'critical' || classified.severity === 'high') {
          toast.error(userMessage);
        } else {
          toast.info(userMessage);
        }
      }

      if (shouldReport && classified.shouldReport) {
        reportErrorToService(error, context ?? {}, classified);
      }

      return classified;
    },
    [t, toast]
  );

  const handleAsyncError = useCallback(
    async (
      asyncOperation: () => Promise<void>,
      context?:       ErrorContext,
      options?:       ErrorHandlerOptions,
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
    (context: ErrorContext, options?: ErrorHandlerOptions) =>
      (error: unknown) => handleError(error, context, options),
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
