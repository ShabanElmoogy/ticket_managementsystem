import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';

interface Props {
  onPress:       () => void;
  loading?:      boolean;
  disabled?:     boolean;
  label?:        string;
  loadingLabel?: string;
}

const ExportPdfButton: React.FC<Props> = ({
  onPress, loading = false, disabled = false,
  label = 'Export PDF', loadingLabel = 'Exporting…',
}) => {
  const c          = useThemeColors();
  const isDisabled = loading || disabled;
  const icon       = loading ? '⏳' : disabled ? '🚫' : '📄';
  const text       = loading ? loadingLabel : label;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => ({
        alignItems: 'center', justifyContent: 'center',
        height: 44, paddingHorizontal: 12, borderRadius: Radius.lg,
        backgroundColor: pressed ? c.interactive.errorPressed : c.interactive.error,
        opacity:       isDisabled ? 0.4 : 1,
        shadowColor:   c.interactive.error,
        shadowOffset:  { width: 0, height: 2 },
        shadowOpacity: isDisabled ? 0 : 0.35,
        shadowRadius:  5,
        elevation:     isDisabled ? 0 : 3,
      })}
    >
      <View style={{ flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <Text style={{ fontSize: FontSize.xl, lineHeight: 18 }}>{icon}</Text>
        <Text style={{ fontSize: FontSize.xs, fontWeight: FontWeight.extrabold, color: c.text.primary }}>{text}</Text>
      </View>
    </Pressable>
  );
};

export default ExportPdfButton;
