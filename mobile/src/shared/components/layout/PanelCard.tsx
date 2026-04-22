import React from 'react';
import { View, Text, Pressable } from 'react-native';

export interface PanelCardProps {
  /** Title shown in the header bar */
  title:       string;
  /** Emoji or short string shown left of the title */
  titleIcon?:  string;
  /** Called when the ✕ close button is pressed */
  onClose:     () => void;
  children:    React.ReactNode;
  isDark?:     boolean;
  marginBottom?: number;
}

/**
 * PanelCard — a bordered card with a tinted header row (title + close button)
 * and an arbitrary children area.
 *
 * Used for expandable option panels inside dialogs or bottom sheets.
 *
 * @example
 * <PanelCard title="Share Report" titleIcon="📤" onClose={() => setOpen(false)} isDark={isDark}>
 *   <ActionRow ... />
 *   <ActionRow ... />
 * </PanelCard>
 */
const PanelCard: React.FC<PanelCardProps> = ({
  title,
  titleIcon,
  onClose,
  children,
  isDark       = false,
  marginBottom = 4,
}) => {
  const surface   = isDark ? '#1e293b' : '#ffffff';
  const surfaceHi = isDark ? '#273549' : '#f8fafc';
  const border    = isDark ? '#334155' : '#e2e8f0';
  const textPri   = isDark ? '#f1f5f9' : '#0f172a';
  const textSec   = isDark ? '#94a3b8' : '#64748b';

  return (
    <View style={{
      borderRadius:    16,
      borderWidth:     1,
      borderColor:     border,
      backgroundColor: surface,
      overflow:        'hidden',
      marginBottom,
    }}>
      {/* Header */}
      <View style={{
        flexDirection:    'row',
        alignItems:       'center',
        justifyContent:   'space-between',
        paddingHorizontal: 14,
        paddingVertical:   10,
        backgroundColor:  surfaceHi,
        borderBottomWidth: 1,
        borderBottomColor: border,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {!!titleIcon && <Text style={{ fontSize: 13 }}>{titleIcon}</Text>}
          <Text style={{ fontSize: 12, fontWeight: '700', color: textPri, letterSpacing: 0.2 }}>
            {title}
          </Text>
        </View>

        <Pressable
          onPress={onClose}
          hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
          style={({ pressed }) => ({
            paddingHorizontal: 12,
            paddingVertical:   6,
            borderRadius:      20,
            backgroundColor:   pressed
              ? (isDark ? '#334155' : '#e2e8f0')
              : (isDark ? '#1e293b' : '#f1f5f9'),
          })}
        >
          <Text style={{ fontSize: 13, fontWeight: '700', color: textSec }}>✕</Text>
        </Pressable>
      </View>

      {/* Content */}
      {children}
    </View>
  );
};

export default PanelCard;
