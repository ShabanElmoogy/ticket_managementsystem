import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors, FontSize, FontWeight, Radius } from '../../../constants/theme';

export interface CodeBlockProps {
  label?:        string;
  content:       string;
  isDark?:       boolean;
  maxLines?:     number;
  marginBottom?: number;
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  label, content, maxLines, marginBottom = 4,
}) => {
  const c = useThemeColors();
  return (
    <View style={{
      backgroundColor: c.surface.secondary,
      borderRadius: Radius.md, borderWidth: 1, borderColor: c.border.primary,
      paddingHorizontal: 10, paddingVertical: 8, marginBottom,
    }}>
      {!!label && (
        <Text style={{
          fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: c.text.muted,
          marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
          {label}
        </Text>
      )}
      <Text style={{ fontSize: FontSize.xs, color: c.text.secondary, fontFamily: 'monospace', lineHeight: 16 }} numberOfLines={maxLines}>
        {content}
      </Text>
    </View>
  );
};

export default CodeBlock;
