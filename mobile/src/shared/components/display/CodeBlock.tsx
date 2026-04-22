import React from 'react';
import { View, Text } from 'react-native';

export interface CodeBlockProps {
  /** Optional uppercase label above the code */
  label?:        string;
  content:       string;
  isDark?:       boolean;
  maxLines?:     number;
  marginBottom?: number;
}

/**
 * CodeBlock — a monospace text box with an optional label.
 *
 * Used for JSON payloads, stack traces, raw API responses, or any
 * pre-formatted text that needs a distinct visual treatment.
 *
 * @example
 * <CodeBlock label="Response Body" content={JSON.stringify(data, null, 2)} isDark={isDark} maxLines={6} />
 */
const CodeBlock: React.FC<CodeBlockProps> = ({
  label,
  content,
  isDark       = false,
  maxLines,
  marginBottom = 4,
}) => {
  const bg     = isDark ? '#1e293b' : '#f8fafc';
  const border = isDark ? '#334155' : '#e2e8f0';
  const labelC = isDark ? '#64748b' : '#94a3b8';
  const textC  = isDark ? '#94a3b8' : '#64748b';

  return (
    <View style={{
      backgroundColor: bg,
      borderRadius:    8,
      borderWidth:     1,
      borderColor:     border,
      paddingHorizontal: 10,
      paddingVertical:   8,
      marginBottom,
    }}>
      {!!label && (
        <Text style={{
          fontSize:      10,
          fontWeight:    '700',
          color:         labelC,
          marginBottom:  4,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}>
          {label}
        </Text>
      )}
      <Text
        style={{ fontSize: 11, color: textC, fontFamily: 'monospace', lineHeight: 16 }}
        numberOfLines={maxLines}
      >
        {content}
      </Text>
    </View>
  );
};

export default CodeBlock;
