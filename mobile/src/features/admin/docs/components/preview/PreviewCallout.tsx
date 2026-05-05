import React from 'react';
import { View, Text } from 'react-native';
import type { CalloutBlock } from '../../types/types';
import { CALLOUT_CFG, usePreviewColors } from './previewUtils';
import { useIsDark } from '@/src/constants/theme';

interface Props { block: CalloutBlock; }

const PreviewCallout: React.FC<Props> = ({ block }) => {
  const isDark = useIsDark();
  const colors = usePreviewColors();
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
