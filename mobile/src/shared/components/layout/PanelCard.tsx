import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';

export interface PanelCardProps {
  /** Title shown in the header bar */
  title:       string;
  /** Emoji or short string shown left of the title */
  titleIcon?:  string;
  /** Called when the ✕ close button is pressed — omit to hide the button */
  onClose?:    () => void;
  children:    React.ReactNode;
  /** Container style override — use for margin, width, etc. */
  style?:      ViewStyle;
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
  title, titleIcon, onClose, children, style,
}) => {
  const c      = useThemeColors();
  const { t }  = useTranslation();

  return (
    <View style={[
      styles.card,
      {
        borderColor:     c.border.primary,
        backgroundColor: c.surface.primary,
      },
      style,
    ]}>
      {/* Header */}
      <View style={[
        styles.header,
        {
          backgroundColor:   c.surface.tertiary,
          borderBottomColor: c.border.primary,
        },
      ]}>
        <View style={styles.titleRow}>
          {!!titleIcon && (
            <Text style={styles.titleIcon} accessibilityElementsHidden>
              {titleIcon}
            </Text>
          )}
          <Text style={[styles.title, { color: c.text.primary }]}>
            {title}
          </Text>
        </View>

        {onClose && (
          <Pressable
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
            accessibilityLabel={t('common.close')}
            accessibilityRole="button"
            style={({ pressed }: { pressed: boolean }) => [
              styles.closeBtn,
              { backgroundColor: pressed ? c.interactive.pressed : c.surface.secondary },
            ]}
          >
            <Text style={[styles.closeBtnText, { color: c.text.secondary }]}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Content */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth:  1,
    overflow:     'hidden',
  },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 14,
    paddingVertical:   10,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  titleIcon: {
    fontSize: FontSize.base,
  },
  title: {
    fontSize:      FontSize.sm,
    fontWeight:    FontWeight.bold,
    letterSpacing: 0.2,
  },
  closeBtn: {
    paddingHorizontal: 12,
    paddingVertical:   6,
    borderRadius:      Radius.full,
  },
  closeBtnText: {
    fontSize:   FontSize.base,
    fontWeight: FontWeight.bold,
  },
});

export default PanelCard;
