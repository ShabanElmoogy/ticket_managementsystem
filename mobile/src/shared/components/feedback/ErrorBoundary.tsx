/**
 * ErrorBoundary — feature-level error boundary for the mobile app.
 *
 * Uses a class component because only class components can implement
 * componentDidCatch. React 19 @types/react declares Component inside the
 * React namespace (export = React). With esModuleInterop the default import
 * IS the namespace at runtime; we cast it to access Component.
 */
import React from 'react';
import type { ReactNode } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';
import { useTranslation } from 'react-i18next';

// Access Component from the React namespace (works at runtime with esModuleInterop)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactComponent = (React as any).Component as new <P, S>(props: P) => {
  props: P;
  state: S;
  setState(state: Partial<S> | ((prev: S) => Partial<S>)): void;
  forceUpdate(): void;
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ErrorInfo {
  componentStack: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export interface ErrorBoundaryProps {
  children?: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  level?: 'app' | 'feature' | 'component';
  featureName?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function generateErrorId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dev-only collapsible stack trace (functional — can use hooks)
// ─────────────────────────────────────────────────────────────────────────────

function ErrorDetails({ error, errorInfo, errorId }: {
  error: Error;
  errorInfo: ErrorInfo;
  errorId: string;
}) {
  const { t } = useTranslation();
  const c = useThemeColors();
  const [expanded, setExpanded] = React.useState(false);

  return (
    <View>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={({ pressed }: { pressed: boolean }) => ({
          backgroundColor: pressed ? c.surface.elevated : c.surface.tertiary,
          borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center' as const,
        })}
      >
        <Text style={{ color: c.text.secondary, fontSize: 14, fontWeight: '500' }}>
          {expanded ? '▼' : '▶'} {t('errors.actions.showDetails')}
        </Text>
      </Pressable>

      {expanded && (
        <ScrollView
          style={{
            maxHeight: 200, backgroundColor: c.surface.tertiary,
            borderRadius: 8, marginTop: 8, padding: 12,
          }}
        >
          <Text style={{ fontSize: 12, color: c.intent.error, fontFamily: 'monospace', lineHeight: 16 }}>
            {error.name}: {error.message}
          </Text>
          {!!error.stack && (
            <Text style={{ fontSize: 11, color: c.text.secondary, fontFamily: 'monospace', lineHeight: 15, marginTop: 6 }}>
              {error.stack}
            </Text>
          )}
          <Text style={{ fontSize: 11, color: c.text.muted, fontFamily: 'monospace', marginTop: 6 }}>
            {t('errors.errorId')}: {errorId}
          </Text>
          <Text style={{ fontSize: 11, color: c.text.muted, fontFamily: 'monospace', marginTop: 4 }}>
            {errorInfo.componentStack}
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Default fallback UI (functional — can use hooks)
// ─────────────────────────────────────────────────────────────────────────────

function DefaultErrorUI({ error, errorInfo, errorId, onRetry, level, featureName }: {
  error: Error;
  errorInfo: ErrorInfo;
  errorId: string;
  onRetry: () => void;
  level: 'app' | 'feature' | 'component';
  featureName?: string;
}) {
  const { t } = useTranslation();
  const c = useThemeColors();

  const title =
    level === 'app'     ? t('errors.app.title') :
    level === 'feature' ? t('errors.feature.title', { feature: featureName ?? 'Feature' }) :
                          t('errors.component.title');

  const message =
    level === 'app'     ? t('errors.app.message') :
    level === 'feature' ? t('errors.feature.message') :
                          t('errors.component.message');

  return (
    <View style={{ flex: 1, backgroundColor: c.surface.primary, padding: 20, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{
        backgroundColor: c.surface.secondary, borderRadius: 12, padding: 24,
        width: '100%', maxWidth: 400,
        borderStartWidth: 4, borderStartColor: c.intent.error,
      }}>
        <View style={{
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: c.intent.errorSurface,
          justifyContent: 'center', alignItems: 'center',
          alignSelf: 'center', marginBottom: 16,
        }}>
          <Text style={{ fontSize: 22 }}>⚠️</Text>
        </View>

        <Text style={{ fontSize: 17, fontWeight: '600', color: c.text.primary, textAlign: 'center', marginBottom: 8 }}>
          {title}
        </Text>

        <Text style={{ fontSize: 14, color: c.text.secondary, textAlign: 'center', lineHeight: 20, marginBottom: 16 }}>
          {message}
        </Text>

        <View style={{ backgroundColor: c.surface.tertiary, borderRadius: 6, padding: 8, marginBottom: 20 }}>
          <Text style={{ fontSize: 11, color: c.text.muted, textAlign: 'center', fontFamily: 'monospace' }}>
            {t('errors.errorId')}: {errorId}
          </Text>
        </View>

        <Pressable
          onPress={onRetry}
          style={({ pressed }: { pressed: boolean }) => ({
            backgroundColor: pressed ? c.interactive.primaryPressed : c.interactive.primary,
            borderRadius: 8, paddingVertical: 12, alignItems: 'center' as const, marginBottom: 12,
          })}
        >
          <Text style={{ color: c.text.inverse, fontSize: 15, fontWeight: '600' }}>
            {t('errors.actions.retry')}
          </Text>
        </Pressable>

        {__DEV__ && (
          <ErrorDetails error={error} errorInfo={errorInfo} errorId={errorId} />
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Class component — must be a class to use componentDidCatch
// ─────────────────────────────────────────────────────────────────────────────

export class ErrorBoundary extends ReactComponent<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorId: null,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error, errorId: generateErrorId() };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId ?? generateErrorId();
    this.setState({ errorInfo, errorId });

    if (__DEV__) {
      console.error('[ErrorBoundary] caught:', {
        error, errorInfo, errorId,
        level: this.props.level,
        feature: this.props.featureName,
      });
    }

    this.props.onError?.(error, errorInfo, errorId);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, errorId: null });
  };

  render() {
    const { hasError, error, errorInfo, errorId } = this.state;

    if (hasError && error && errorInfo && errorId) {
      if (this.props.fallback) {
        return this.props.fallback(error, errorInfo, this.handleRetry);
      }
      return (
        <DefaultErrorUI
          error={error}
          errorInfo={errorInfo}
          errorId={errorId}
          onRetry={this.handleRetry}
          level={this.props.level ?? 'component'}
          featureName={this.props.featureName}
        />
      );
    }

    return this.props.children;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience wrappers
// ─────────────────────────────────────────────────────────────────────────────

export const AppErrorBoundary: React.FC<{ children?: ReactNode }> = ({ children }) => (
  <ErrorBoundary level="app">{children}</ErrorBoundary>
);

export const FeatureErrorBoundary: React.FC<{
  children?: ReactNode;
  featureName: string;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
}> = ({ children, featureName, onError }) => (
  <ErrorBoundary level="feature" featureName={featureName} onError={onError}>
    {children}
  </ErrorBoundary>
);

export const ComponentErrorBoundary: React.FC<{
  children?: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo, retry: () => void) => ReactNode;
}> = ({ children, fallback }) => (
  <ErrorBoundary level="component" fallback={fallback}>
    {children}
  </ErrorBoundary>
);

export default ErrorBoundary;
