import React from 'react';
import { View, Text, Platform, type ViewStyle } from 'react-native';
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';

/**
 * Cross-platform monospace font family.
 * `'monospace'` is not a valid font name on iOS — use `'Courier New'` there.
 */
const MONOSPACE = Platform.select({ ios: 'Courier New', default: 'monospace' });

/**
 * CodeBlock
 *
 * A read-only code/text snippet rendered in a monospace font inside a
 * bordered surface container. Supports an optional uppercase label above
 * the content and a `maxLines` clamp for compact display.
 *
 * Content text is **selectable** — users can long-press to copy.
 *
 * ## Usage locations
 * - `ErrorExtraBanner.tsx` — DEV-only response details panel in `NetworkErrorDialog`
 *
 * ## Modal safety
 * ✅ Modal-safe — `useThemeColors()` is called at component level.
 *
 * @example
 * // DEV response details (clamped to 4 lines)
 * <CodeBlock
 *   label="DEV — Response Details"
 *   content={JSON.stringify(error.details, null, 2)}
 *   maxLines={4}
 * />
 *
 * @example
 * // Full snippet, no label
 * <CodeBlock content={snippet} style={{ marginBottom: 12 }} />
 */
export interface CodeBlockProps {
  /** Optional uppercase label rendered above the code content. */
  label?: string;
  /** The code or text content to display. */
  content: string;
  /**
   * Maximum number of lines before the content is clipped.
   * Omit to show all lines.
   */
  maxLines?: number;
  /**
   * Extra style merged onto the root `View`.
   * Use for margin, width overrides, etc.
   */
  style?: ViewStyle;
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  label,
  content,
  maxLines,
  style,
}) => {
  const c = useThemeColors();

  return (
    <View
      accessibilityRole="none"
      accessibilityLabel={label ?? 'code block'}
      style={[
        {
          backgroundColor:   c.surface.secondary,
          borderRadius:      Radius.md,
          borderWidth:       1,
          borderColor:       c.border.primary,
          paddingHorizontal: 10,
          paddingVertical:   8,
        },
        style,
      ]}
    >
      {!!label && (
        <Text
          style={{
            fontSize:      FontSize.xs,
            fontWeight:    FontWeight.bold,
            color:         c.text.muted,
            marginBottom:  4,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {label}
        </Text>
      )}
      <Text
        selectable
        numberOfLines={maxLines}
        style={{
          fontSize:   FontSize.xs,
          color:      c.text.secondary,
          fontFamily: MONOSPACE,
          lineHeight: 16,
        }}
      >
        {content}
      </Text>
    </View>
  );
};

export default CodeBlock;
