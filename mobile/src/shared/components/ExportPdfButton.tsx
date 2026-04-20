import React from 'react';
import { Pressable, Text } from 'react-native';

interface Props {
  onPress: () => void;
  loading?: boolean;   // exporting in progress
  disabled?: boolean;  // no data to export
  isDark?: boolean;
}

/**
 * Red "Export PDF" button with loading/disabled states.
 * Reusable across any admin screen that supports PDF export.
 */
const ExportPdfButton: React.FC<Props> = ({
  onPress, loading = false, disabled = false, isDark = false,
}) => {
  const isDisabled = loading || disabled;
  const icon = loading ? '⏳' : disabled ? '🚫' : '📄';
  const label = loading ? 'Exporting…' : 'Export PDF';

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => ({
        alignItems: 'center', justifyContent: 'center', gap: 2,
        height: 44, paddingHorizontal: 12, borderRadius: 10,
        backgroundColor: loading ? '#b91c1c' : pressed ? '#dc2626' : '#ef4444',
        opacity: isDisabled ? 0.4 : 1,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDisabled ? 0 : 0.35,
        shadowRadius: 5,
        elevation: isDisabled ? 0 : 3,
      })}
    >
      <Text style={{ fontSize: 16, lineHeight: 18 }}>{icon}</Text>
      <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>{label}</Text>
    </Pressable>
  );
};

export default ExportPdfButton;
