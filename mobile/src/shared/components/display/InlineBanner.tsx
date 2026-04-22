import React from 'react';
import { View, Text } from 'react-native';

export interface InlineBannerProps {
  /** Emoji or short string shown on the left */
  icon?:            string;
  message:          string;
  /** Hex color used for the text and tinted background */
  color:            string;
  isDark?:          boolean;
  /** Extra bottom margin (default 4) */
  marginBottom?:    number;
}

/**
 * InlineBanner — a compact tinted row with an optional icon and a message.
 *
 * Used for status hints, warnings, and info notices inside dialogs or screens.
 * The background is automatically derived from `color` at low opacity.
 *
 * @example
 * <InlineBanner icon="🔄" message="Reconnecting…" color="#10b981" isDark={isDark} />
 * <InlineBanner icon="⚠️" message="3 requests failed" color="#ef4444" isDark={isDark} />
 */
const InlineBanner: React.FC<InlineBannerProps> = ({
  icon,
  message,
  color,
  isDark       = false,
  marginBottom = 4,
}) => {
  // Derive a subtle tinted background from the accent color
  const bgLight = color + '18'; // ~10% opacity
  const bgDark  = color + '22'; // ~13% opacity

  return (
    <View style={{
      flexDirection:   'row',
      alignItems:      'center',
      gap:             8,
      backgroundColor: isDark ? bgDark : bgLight,
      borderRadius:    8,
      paddingHorizontal: 10,
      paddingVertical:   8,
      marginBottom,
    }}>
      {!!icon && <Text style={{ fontSize: 14 }}>{icon}</Text>}
      <Text style={{ flex: 1, fontSize: 12, color, fontWeight: '600', lineHeight: 17 }}>
        {message}
      </Text>
    </View>
  );
};

export default InlineBanner;
