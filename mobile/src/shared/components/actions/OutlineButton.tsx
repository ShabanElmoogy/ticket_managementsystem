import React from 'react';
import { Pressable, Text } from 'react-native';

export interface OutlineButtonProps {
  /** Emoji or short string shown left of the label */
  icon?:        string;
  label:        string;
  onPress:      () => void;
  disabled?:    boolean;
  isDark?:      boolean;
  /** Stretch to fill available flex space (default true) */
  flex?:        boolean;
  minHeight?:   number;
}

/**
 * OutlineButton — a bordered pill button with an optional icon and label.
 *
 * Used as a secondary action alongside a primary button (e.g. Share + OK).
 * Matches the visual weight of the primary action without competing with it.
 *
 * @example
 * <OutlineButton icon="📤" label="Share" onPress={() => setOpen(true)} isDark={isDark} />
 * <OutlineButton icon="🔄" label="Retry" onPress={onRetry} isDark={isDark} />
 */
const OutlineButton: React.FC<OutlineButtonProps> = ({
  icon,
  label,
  onPress,
  disabled   = false,
  isDark     = false,
  flex       = true,
  minHeight  = 58,
}) => {
  const surface   = isDark ? '#1e293b' : '#ffffff';
  const surfaceHi = isDark ? '#273549' : '#f8fafc';
  const border    = isDark ? '#475569' : '#d1d5db';
  const textColor = isDark ? '#cbd5e1' : '#374151';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        ...(flex && { flex: 1 }),
        flexDirection:  'row',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            8,
        paddingVertical: 18,
        minHeight,
        borderRadius:   16,
        borderWidth:    1.5,
        borderColor:    border,
        backgroundColor: pressed ? surfaceHi : surface,
        opacity:        disabled ? 0.5 : 1,
        transform:      [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
      {!!icon && <Text style={{ fontSize: 18 }}>{icon}</Text>}
      <Text style={{ fontSize: 15, fontWeight: '700', color: textColor, letterSpacing: 0.2 }}>
        {label}
      </Text>
    </Pressable>
  );
};

export default OutlineButton;
