import React from 'react';
import { View, Text } from 'react-native';

export interface CalloutBoxProps {
  /** Accent color — used for stripe, icon badge tint, and border */
  color:      string;
  /** Light mode background */
  bg:         string;
  /** Dark mode background */
  darkBg:     string;
  /** Light mode border color */
  border:     string;
  /** Emoji shown in the icon badge */
  emoji:      string;
  isDark?:    boolean;
  children:   React.ReactNode;
}

/**
 * CalloutBox — a styled container with a colored top stripe, an emoji icon badge,
 * and a content area. Used for callout blocks in docs, alert banners, and
 * any content that needs a visually distinct framed presentation.
 *
 * The `children` slot renders inside the content area next to the icon badge —
 * pass a `TextInput` for editing or a `Text` for read-only display.
 *
 * @example
 * <CalloutBox color="#3b82f6" bg="#eff6ff" darkBg="#1e3a5f" border="#bfdbfe" emoji="ℹ️" isDark={isDark}>
 *   <Text>This is an info callout.</Text>
 * </CalloutBox>
 */
const CalloutBox: React.FC<CalloutBoxProps> = ({
  color, bg, darkBg, border, emoji, isDark = false, children,
}) => (
  <View style={{
    borderRadius:    12,
    overflow:        'hidden',
    borderWidth:     1.5,
    borderColor:     isDark ? color + '55' : border,
    backgroundColor: isDark ? darkBg : bg,
  }}>
    {/* Colored top stripe */}
    <View style={{ height: 3, backgroundColor: color }} />

    <View style={{ flexDirection: 'row', gap: 12, padding: 14 }}>
      {/* Emoji icon badge */}
      <View style={{
        width:           36,
        height:          36,
        borderRadius:    10,
        alignItems:      'center',
        justifyContent:  'center',
        backgroundColor: color + '22',
        flexShrink:      0,
      }}>
        <Text style={{ fontSize: 20 }}>{emoji}</Text>
      </View>

      {/* Content slot */}
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </View>
  </View>
);

export default CalloutBox;
