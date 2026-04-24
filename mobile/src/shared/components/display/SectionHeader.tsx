import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors, FontSize, FontWeight } from '../../../constants/theme';

interface Props {
  title:  string;
  isDark?: boolean;
  right?: React.ReactNode;
}

const SectionHeader: React.FC<Props> = ({ title, right }) => {
  const c = useThemeColors();
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 10,
      borderBottomWidth: 1, borderBottomColor: c.border.primary,
      backgroundColor: c.surface.tertiary,
    }}>
      <Text style={{ flex: 1, fontSize: FontSize.md, fontWeight: FontWeight.bold, color: c.text.primary }}>
        {title}
      </Text>
      {right}
    </View>
  );
};

export default SectionHeader;
