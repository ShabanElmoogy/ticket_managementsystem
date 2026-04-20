import React from 'react';
import { View, Text, Pressable } from 'react-native';

interface Props {
  title: string;
  subtitle?: string;
  isDark: boolean;
  left?: React.ReactNode;   // avatar, icon, etc.
  right?: React.ReactNode;  // badge, chevron, etc.
  onPress?: () => void;
}

/**
 * Generic compact list row — left slot + title/subtitle + right slot.
 * Used in compact views across admin screens (reports, customers, users, etc.)
 */
const CompactListRow: React.FC<Props> = ({
  title, subtitle, isDark, left, right, onPress,
}) => {
  const border = isDark ? '#334155' : '#f1f5f9';
  const text   = isDark ? '#f1f5f9' : '#0f172a';
  const muted  = isDark ? '#64748b' : '#94a3b8';

  const content = (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 14, paddingVertical: 10,
      borderBottomWidth: 1, borderBottomColor: border,
    }}>
      {left && <View style={{ marginRight: 10 }}>{left}</View>}

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: text }} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ fontSize: 11, color: muted, marginTop: 1 }} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right && <View style={{ marginLeft: 8 }}>{right}</View>}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          backgroundColor: pressed ? (isDark ? '#1e293b' : '#f1f5f9') : 'transparent',
        })}
      >
        {content}
      </Pressable>
    );
  }

  return content;
};

export default CompactListRow;
