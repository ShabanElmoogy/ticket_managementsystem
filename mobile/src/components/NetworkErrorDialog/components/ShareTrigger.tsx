import React from 'react';
import { OutlineButton } from '@/src/shared/components';

interface Props {
  isDark:  boolean;
  onPress: () => void;
}

/**
 * Thin wrapper — renders the shared OutlineButton pre-configured
 * as the "Share" trigger in the NetworkErrorDialog action row.
 */
const ShareTrigger: React.FC<Props> = ({ isDark, onPress }) => (
  <OutlineButton icon="📤" label="Share" onPress={onPress} isDark={isDark} />
);

export default ShareTrigger;
