import React, { useCallback } from "react";
// Inline error handling
function getErrorMessage(error: unknown, fallback: string): string {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as any).message);
  }
  return fallback;
}

export interface ErrorHandlingProps {
  handleError: (error: unknown, fallback: string) => string;
  logError: (operation: string, error: unknown) => void;
}

export function withErrorHandling<P extends object = Record<string, never>>(
  Component: React.ComponentType<P & ErrorHandlingProps>
) {
  const ErrorHandlingWrapper = (props: P) => {
    const handleError = useCallback((error: unknown, fallback: string) => {
      return getErrorMessage(error, fallback);
    }, []);

    const logError = useCallback((operation: string, error: unknown) => {
      console.error(`${operation} failed:`, error);
    }, []);

    const errorProps: ErrorHandlingProps = {
      handleError,
      logError,
    };

    return <Component {...props} {...errorProps} />;
  };

  ErrorHandlingWrapper.displayName = `withErrorHandling(${Component.displayName || Component.name})`;
  return ErrorHandlingWrapper;
}

export default withErrorHandling;