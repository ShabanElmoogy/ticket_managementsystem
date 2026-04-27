import React from 'react';
import { DialogButton } from '@/src/shared/components';

interface Props {
  onPress: () => void;
}

const ShareTrigger: React.FC<Props> = ({ onPress }) => (
  <DialogButton intent="neutral" icon="📤" label="Share" onPress={onPress} />
);

export default ShareTrigger;
