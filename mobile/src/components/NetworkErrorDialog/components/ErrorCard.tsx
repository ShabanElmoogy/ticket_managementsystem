import React from 'react';
import { InfoCard } from '@/src/shared/components';
import type { ErrorState } from '../types';

interface Props {
  error:       ErrorState;
  accentColor: string;
  icon:        string;
  isDark:      boolean;
}

/**
 * Thin wrapper around the shared InfoCard.
 * Maps NetworkErrorDialog's ErrorState to InfoCard's flat props.
 */
const ErrorCard: React.FC<Props> = ({ error, accentColor, icon, isDark }) => (
  // <InfoCard
  //   accentColor={accentColor}
  //   icon={icon}
  //   title={error.title}
  //   subtitle={error.subtitle}
  //   message={error.message}
  //   sections={
  //     error.details
  //       ? [{
  //           label:   'Response Details',
  //           content: typeof error.details === 'string'
  //             ? error.details
  //             : JSON.stringify(error.details, null, 2),
  //           mono:     true,
  //           maxLines: 6,
  //         }]
  //       : []
  //   }
  //   caption={error.timestamp}
  //   isDark={isDark}
  // />
);

export default ErrorCard;
