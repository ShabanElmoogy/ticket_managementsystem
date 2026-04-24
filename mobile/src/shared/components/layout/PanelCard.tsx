import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useThemeColors, FontSize, FontWeight, Radius } from '../../../constants/theme';

export interface PanelCardProps {
  /** Title shown in the header bar */
  title:       string;
  /** Emoji or short string shown left of the title */
  titleIcon?:  string;
  /** Called when the ✕ close button is pressed */
  onClose:     () => void;
  children:    React.ReactNode;
  /** @deprecated — component reads theme internally via useThemeColors() */
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
 * <PanelCard title="Share Report" titleIcon="📤" onClose={() => setOpen(false)}>
 *   <ActionRow ... />
 *   <ActionRow ... />
 * </PanelCard>
 */
const PanelCard: React.FC<PanelCardProps> = ({
  title,
  titleIcon,
  onClose,
  children,
  marginBottom = 4,
}) => {
  const c = useThemeColors();

  return (
    <View style={{
      borderRadius:    Radius.xl,
      borderWidth:     1,
      borderColor:     c.border.primary,
      backgroundColor: c.surface.primary,
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
        backgroundColor:  c.surface.tertiary,
        borderBottomWidth: 1,
        borderBottomColor: c.border.primary,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {!!titleIcon && <Text style={{ fontSize: FontSize.base }}>{titleIcon}</Text>}
          <Text style={{ fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: c.text.primary, letterSpacing: 0.2 }}>
            {title}
          </Text>
        </View>

        <Pressable
          onPress={onClose}
          hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
          style={({ pressed }) => ({
            paddingHorizontal: 12,
            paddingVertical:   6,
            borderRadius:      Radius.full,
            backgroundColor:   pressed ? c.interactive.pressed : c.surface.secondary,
          })}
        >
          <Text style={{ fontSize: FontSize.base, fontWeight: FontWeight.bold, color: c.text.secondary }}>✕</Text>
        </Pressable>
      </View>

      {/* Content */}
      {children}
    </View>
  );
};

export default PanelCard;
