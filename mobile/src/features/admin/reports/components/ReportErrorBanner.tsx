import React from 'react';
import { ErrorBanner } from '@/src/shared/components';

interface Props {
  message: string;
  onRetry: () => void;
  isDark: boolean;
}

const ReportErrorBanner: React.FC<Props> = ({ message, onRetry, isDark }) => (
  <ErrorBanner message={message} onRetry={onRetry}/>
);

export default ReportErrorBanner;
