import React from 'react';
import { View, Text } from 'react-native';

interface Props {
  title: string;
  isDark: boolean;
  /** Optional right-side content (badge, button, etc.) */
  right?: React.ReactNode;
}

/**
 * Generic card/section header bar — title on the left, optional content on the right.
 * Used as the top bar of admin cards, report cards, detail panels, etc.
 */
const SectionHeader: React.FC<Props> = ({ title, isDark, right }) => {
  const border = isDark ? '#334155' : '#e2e8f0';

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 10,
      borderBottomWidth: 1, borderBottomColor: border,
      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
    }}>
      <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: isDark ? '#e2e8f0' : '#1e293b' }}>
        {title}
      </Text>
      {right}
    </View>
  );
};

export default SectionHeader;
