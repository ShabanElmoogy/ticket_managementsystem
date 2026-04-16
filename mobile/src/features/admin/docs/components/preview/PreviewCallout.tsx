import React from 'react';
import { View, Text } from 'react-native';
import type { CalloutBlock } from '../../types/types';
import { CALLOUT_CFG, type PreviewColors } from './previewUtils';

interface Props { block: CalloutBlock; isDark: boolean; colors: PreviewColors; }

const PreviewCallout: React.FC<Props> = ({ block, isDark, colors }) => {
  const cfg = CALLOUT_CFG[block.calloutType];
  return (
    <View style={{
      flexDirection: 'row', gap: 10, padding: 12, borderRadius: 8, marginBottom: 8,
      backgroundColor: isDark ? cfg.darkBg : cfg.bg,
      borderWidth: 1, borderColor: cfg.color + '44',
    }}>
      <Text style={{ fontSize: 18 }}>{cfg.emoji}</Text>
      <Text style={{ flex: 1, fontSize: 14, color: colors.textColor, lineHeight: 20 }}>{block.text}</Text>
    </View>
  );
};

export default PreviewCallout;
