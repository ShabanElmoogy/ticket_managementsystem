import React from 'react';
import { InlineBanner, CodeBlock } from '@/src/shared/components';
import type { ErrorState } from '../types';

interface Props {
  error?:   ErrorState | null;
  retrying: boolean;
  /** @deprecated — child components read theme internally */
  isDark?:  boolean;
}

/**
 * Contextual banner shown above the share panel in NetworkErrorDialog.
 * Delegates all rendering to shared InlineBanner / CodeBlock.
 */
const ErrorExtraBanner: React.FC<Props> = ({ error, retrying }) => {
  if (retrying) {
    return (
      <InlineBanner
        icon="🔄"
        message="Connection restored — saving your data…"
        color="#10b981"
      />
    );
  }

  if (error?.kind === 'network' && error.count > 1) {
    return (
      <InlineBanner
        icon="⚠️"
        message={`${error.count} requests failed simultaneously`}
        color="#ef4444"
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
        maxLines={4}
      />
    );
  }

  return null;
};

export default ErrorExtraBanner;
