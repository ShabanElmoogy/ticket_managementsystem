import React from 'react';
import { InlineBanner, CodeBlock } from '@/src/shared/components';
import type { ErrorState } from '../types';

interface Props {
  error?:   ErrorState | null;
  retrying: boolean;
  isDark:   boolean;
}

/**
 * Contextual banner shown above the share panel in NetworkErrorDialog.
 * Delegates all rendering to shared InlineBanner / CodeBlock.
 *
 * Cases:
 *  - retrying        → green "Connection restored" banner
 *  - network flood   → red "N requests failed" banner
 *  - api + DEV       → monospace CodeBlock with raw response details
 */
const ErrorExtraBanner: React.FC<Props> = ({ error, retrying, isDark }) => {
  if (retrying) {
    return (
      <InlineBanner
        icon="🔄"
        message="Connection restored — saving your data…"
        color="#10b981"
        isDark={isDark}
      />
    );
  }

  if (error?.kind === 'network' && error.count > 1) {
    return (
      <InlineBanner
        icon="⚠️"
        message={`${error.count} requests failed simultaneously`}
        color="#ef4444"
        isDark={isDark}
      />
    );
  }

  if (error?.kind === 'api' && __DEV__ && error.details) {
    return (
      <CodeBlock
        label="DEV — Response Details"
        content={
          typeof error.details === 'string'
            ? error.details
            : JSON.stringify(error.details, null, 2)
        }
        isDark={isDark}
        maxLines={4}
      />
    );
  }

  return null;
};

export default ErrorExtraBanner;
