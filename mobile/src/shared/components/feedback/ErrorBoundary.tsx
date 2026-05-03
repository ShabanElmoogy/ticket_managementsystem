/**
 * ErrorBoundary — feature-level error boundary for the mobile app.
 *
 * Uses a class component because only class components can implement
 * `componentDidCatch`. The functional sub-components (`ErrorDetails`,
 * `DefaultErrorUI`) are defined separately so they can use hooks.
 *
 * ## Exports
 * - `ErrorBoundary`          — base class, accepts `level` + `featureName`
 * - `AppErrorBoundary`       — convenience wrapper for `level="app"`
 * - `FeatureErrorBoundary`   — convenience wrapper for `level="feature"`
 * - `ComponentErrorBoundary` — convenience wrapper for `level="component"`
 */
import React from 'react';
import type { ReactNode } from 'react';
import { View, Text, ScrollView, Pressable, Platform } from 'react-native';
import { useThemeColors, FontSize, FontWeight } from '@/src/constants/theme';
import { useTranslation } from 'react-i18next';

// Access Component from the React namespace (works at runtime with esModuleInterop).
// `import { Component } from 'react'` fails with this project's React 19 type config.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactComponent = (React as any).Component as new <P, S>(props: P) => {
  props: P;
  state: S;
  setState(state: Partial<S> | ((prev: S) => Partial<S>)): void;
  forceUpdate(): void;
};

/** Cross-platform monospace font — mirrors CodeBlock. */
const MONOSPACE = Platform.select({ ios: 'Courier New', default: 'monospace' });

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ErrorInfo {
  componentStack: string;
}

interface ErrorBoundaryState {
  hasError:  boolean;
  error:     Error | null;
  errorInfo: ErrorInfo | null;
  errorId:   string | null;
}

export interface ErrorBoundaryProps {
  children?:    ReactNode;
  /** Custom fallback renderer. Receives error, errorInfo, and a retry callback. */
  fallback?:    (error: Error, errorInfo: ErrorInfo, retry: () => void) => ReactNode;
  /** Called when an error is caught — use for logging/monitoring. */
  onError?:     (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  /** Controls the title and message shown in the default fallback UI. */
  level?:       'app' | 'feature' | 'component';
  /** Feature name shown in the `feature` level title (e.g. `"Customers"`). */
  featureName?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function generateErrorId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dev-only collapsible stack trace (functional — uses hooks)
// ─────────────────────────────────────────────────────────────────────────────

function ErrorDetails({ error, errorInfo, errorId }: {
  error:     Error;
  errorInfo: ErrorInfo;
  errorId:   string;
}) {
  const { t } = useTranslation();
  const c     = useThemeColors();
  const [expanded, setExpanded] = React.useState(false);

  return (
    <View>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={t('errors.actions.showDetails')}
        style={({ pressed }: { pressed: boolean }) => ({
          backgroundColor:  pressed ? c.surface.elevated : c.surface.tertiary,
          borderRadius:     8,
          paddingVertical:  8,
          paddingHorizontal: 12,
          alignItems:       'center' as const,
        })}
      >
        <Text style={{ color: c.text.secondary, fontSize: FontSize.sm, fontWeight: FontWeight.medium }}>
          {expanded ? '▼' : '▶'} {t('errors.actions.showDetails')}
        </Text>
      </Pressable>

      {expanded && (
        <ScrollView
          style={{
            maxHeight:       200,
            backgroundColor: c.surface.tertiary,
            borderRadius:    8,
            marginTop:       8,
            padding:         12,
          }}
        >
          <Text style={{ fontSize: FontSize.xs, color: c.intent.error, fontFamily: MONOSPACE, lineHeight: 16 }}>
            {error.name}: {error.message}
          </Text>
          {!!error.stack && (
            <Text style={{ fontSize: FontSize.xs, color: c.text.secondary, fontFamily: MONOSPACE, lineHeight: 15, marginTop: 6 }}>
              {error.stack}
            </Text>
          )}
          <Text style={{ fontSize: FontSize.xs, color: c.text.muted, fontFamily: MONOSPACE, marginTop: 6 }}>
            {t('errors.errorId')}: {errorId}
          </Text>
          <Text style={{ fontSize: FontSize.xs, color: c.text.muted, fontFamily: MONOSPACE, marginTop: 4 }}>
            {errorInfo.componentStack}
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Default fallback UI (functional — uses hooks)
// ─────────────────────────────────────────────────────────────────────────────

function DefaultErrorUI({ error, errorInfo, errorId, onRetry, level, featureName }: {
  error:        Error;
  errorInfo:    ErrorInfo;
  errorId:      string;
  onRetry:      () => void;
  level:        'app' | 'feature' | 'component';
  featureName?: string;
}) {
  const { t } = useTranslation();
  const c     = useThemeColors();

  const title =
    level === 'app'     ? t('errors.app.title') :
    level === 'feature' ? t('errors.feature.title', { feature: featureName ?? 'Feature' }) :
                          t('errors.component.title');

  const message =
    level === 'app'     ? t('errors.app.message') :
    level === 'feature' ? t('errors.feature.message') :
                          t('errors.component.message');

  return (
    <View style={{
      flex: 1, backgroundColor: c.surface.primary,
      padding: 20, justifyContent: 'center', alignItems: 'center',
    }}>
      <View style={{
        backgroundColor:  c.surface.secondary,
        borderRadius:     12,
        padding:          24,
        width:            '100%',
        maxWidth:         400,
        borderStartWidth: 4,
        borderStartColor: c.intent.error,
      }}>
        {/* Error icon */}
        <View style={{
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: c.intent.errorSurface,
          justifyContent: 'center', alignItems: 'center',
          alignSelf: 'center', marginBottom: 16,
        }}>
          <Text style={{ fontSize: 22 }}>⚠️</Text>
        </View>

        {/* Title */}
        <Text style={{
          fontSize:    FontSize.lg,
          fontWeight:  FontWeight.semibold,
          color:       c.text.primary,
          textAlign:   'center',
          marginBottom: 8,
        }}>
          {title}
        </Text>

        {/* Message */}
        <Text style={{
          fontSize:    FontSize.sm,
          color:       c.text.secondary,
          textAlign:   'center',
          lineHeight:  20,
          marginBottom: 16,
        }}>
          {message}
        </Text>

        {/* Error ID */}
        <View style={{
          backgroundColor: c.surface.tertiary,
          borderRadius:    6,
          padding:         8,
          marginBottom:    20,
        }}>
          <Text style={{
            fontSize:   FontSize.xs,
            color:      c.text.muted,
            textAlign:  'center',
            fontFamily: MONOSPACE,
          }}>
            {t('errors.errorId')}: {errorId}
          </Text>
        </View>

        {/* Retry button */}
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel={t('errors.actions.retry')}
          style={({ pressed }: { pressed: boolean }) => ({
            backgroundColor: pressed ? c.interactive.primaryPressed : c.interactive.primary,
            borderRadius:    8,
            paddingVertical: 12,
            alignItems:      'center' as const,
            marginBottom:    12,
          })}
        >
          <Text style={{ color: c.text.inverse, fontSize: FontSize.md, fontWeight: FontWeight.semibold }}>
            {t('errors.actions.retry')}
          </Text>
        </Pressable>

        {/* Dev-only stack trace */}
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
    hasError:  false,
    error:     null,
    errorInfo: null,
    errorId:   null,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // errorId is generated here so it's available synchronously before
    // componentDidCatch fires. The fallback in componentDidCatch is unreachable
    // in practice but kept for safety.
    return { hasError: true, error, errorId: generateErrorId() };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // errorId was already set by getDerivedStateFromError — use it directly
    const errorId = this.state.errorId!;
    this.setState({ errorInfo });

    if (__DEV__) {
      console.error('[ErrorBoundary] caught:', {
        error,
        errorInfo,
        errorId,
        level:   this.props.level,
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

    return this.props.children ?? null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience wrappers
// ─────────────────────────────────────────────────────────────────────────────

export const AppErrorBoundary: React.FC<{ children?: ReactNode }> = ({ children }) => (
  <ErrorBoundary level="app">{children}</ErrorBoundary>
);

export const FeatureErrorBoundary: React.FC<{
  children?:    ReactNode;
  featureName:  string;
  onError?:     (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
}> = ({ children, featureName, onError }) => (
  <ErrorBoundary level="feature" featureName={featureName} onError={onError}>
    {children}
  </ErrorBoundary>
);

export const ComponentErrorBoundary: React.FC<{
  children?:  ReactNode;
  fallback?:  (error: Error, errorInfo: ErrorInfo, retry: () => void) => ReactNode;
}> = ({ children, fallback }) => (
  <ErrorBoundary level="component" fallback={fallback}>
    {children}
  </ErrorBoundary>
);

export default ErrorBoundary;