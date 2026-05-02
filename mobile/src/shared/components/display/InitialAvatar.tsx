import React from 'react';
import { useThemeColors } from '@/src/constants/theme';
import Avatar from './Avatar';
import type { ViewStyle } from 'react-native';

/**
 * InitialAvatar
 *
 * Tinted variant of `Avatar` — uses a semi-transparent background
 * (`color + '20'`) and the accent color as the text color.
 * Shows only the **first initial** (single character).
 *
 * Use this in compact list rows and table cells where a subtle tinted
 * circle is preferred over a solid filled one.
 *
 * For solid-background avatars (hero cards, header bar), use `Avatar` directly.
 *
 * ## Usage locations
 * - `CompactListRow.tsx` — left slot in compact list rows
 * - `ReportCompactRow.tsx` — left slot in report rows
 *
 * @example
 * <InitialAvatar name="John Doe" />
 *
 * @example
 * <InitialAvatar name={customer.name} size={40} color={statusColor} />
 */
interface Props {
  name:   string;
  size?:  number;
  color?: string;
  style?: ViewStyle;
}

const InitialAvatar: React.FC<Props> = ({ name, size = 32, color, style }) => {
  const c           = useThemeColors();
  const accentColor = color ?? c.interactive.primary;

  return (
    <Avatar
      text={name.charAt(0)}   // single initial — tinted style convention
      size={size}
      backgroundColor={accentColor + '20'}
      textColor={accentColor}
      fontSize={Math.round(size * 0.4)}
      accessibilityLabel={`${name} avatar`}
      style={style}
    />
  );
};

export default InitialAvatar;
