import React from 'react';
import { OutlineButton } from '@/src/shared/components';

interface Props {
  /** @deprecated — OutlineButton reads theme internally */
  isDark?:  boolean;
  onPress: () => void;
}

/**
 * Thin wrapper — renders the shared OutlineButton pre-configured
 * as the "Share" trigger in the NetworkErrorDialog action row.
 */
const ShareTrigger: React.FC<Props> = ({ onPress }) => (
  <OutlineButton icon="📤" label="Share" onPress={onPress} />
);

export default ShareTrigger;
