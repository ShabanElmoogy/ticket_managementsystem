import React from 'react';
import { type ViewStyle, type TextStyle } from 'react-native';
import { DialogButton } from '@/src/shared/components';

interface Props {
  onPress:      () => void;
  style?:       ViewStyle;
  labelStyle?:  TextStyle;
}

const ShareTrigger: React.FC<Props> = ({ onPress, style, labelStyle }) => (
  <DialogButton
    label="Share"
    onPress={onPress}
    style={style}
    labelStyle={labelStyle}
  />
);

export default ShareTrigger;
