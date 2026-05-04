import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/src/i18n';
import { useIsDark, FontSize, FontWeight, Radius, Spacing } from '@/src/constants/theme';
import type { ThemeColors } from '@/src/constants/tokens';
import { Avatar, Badge } from '@/src/shared/components';

interface Props {
  name:           string;
  role:           string;
  isRtl:          boolean;
  onToggleTheme:  () => void;
  resolvedColors: ThemeColors;
}

const DrawerUserCard: React.FC<Props> = ({ name, role, isRtl, onToggleTheme, resolvedColors: c }) => {
  const { i18n }    = useTranslation();
  const [switching, setSwitching] = React.useState(false);
  const currentLang = i18n.language;
  const isDark      = useIsDark();

  const handleLanguageSwitch = async () => {
    if (switching) return;
    setSwitching(true);
    try {
      await changeLanguage(currentLang === 'en' ? 'ar' : 'en');
    } finally {
      setSwitching(false);
    }
  };

  return (
    <View style={[styles.container, { borderBottomColor: c.border.primary }]}>
      {/* Avatar + name row */}
      <View style={styles.userRow}>
        <Avatar
          text={name}
          backgroundColor={c.interactive.primary}
          size={44}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: c.text.primary, textAlign: isRtl ? 'right' : 'left' }]}>
            {name}
          </Text>
          <Badge
            label={role.replace('_', ' ')}
            backgroundColor={`${c.tint}22`}
            textColor={c.tint}
            style={{ alignSelf: isRtl ? 'flex-end' : 'flex-start', marginTop: 4 }}
          />
        </View>
      </View>

      {/* Theme + language toggles */}
      <View style={styles.toggleRow}>
        {/* Dark / Light toggle */}
        <Pressable
          style={[styles.toggleBtn, { backgroundColor: c.surface.elevated, borderColor: c.border.primary }]}
          onPress={onToggleTheme}
          accessibilityRole="button"
          accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <Ionicons
            name={isDark ? 'sunny-outline' : 'moon-outline'}
            size={16}
            color={c.text.primary}
          />
          <Text style={[styles.toggleLabel, { color: c.text.primary }]}>
            {isDark ? 'Light' : 'Dark'}
          </Text>
        </Pressable>

        {/* Language toggle */}
        <Pressable
          style={[styles.toggleBtn, { backgroundColor: c.surface.elevated, borderColor: c.border.primary }]}
          onPress={handleLanguageSwitch}
          disabled={switching}
          accessibilityRole="button"
          accessibilityLabel="Switch language"
        >
          {switching ? (
            <ActivityIndicator size="small" color={c.text.primary} />
          ) : (
            <Ionicons name="language-outline" size={16} color={c.text.primary} />
          )}
          <Text style={[styles.toggleLabel, { color: c.text.primary }]}>
            {currentLang === 'en' ? 'عربي' : 'EN'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop:          16,
    paddingHorizontal:   16,
    paddingBottom:       12,
    borderBottomWidth:   1,
  },
  userRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            12,
    marginBottom:   12,
  },
  name: {
    fontWeight: FontWeight.bold,
    fontSize:   FontSize.md,
  },
  toggleRow: {
    flexDirection: 'row',
    gap:           8,
  },
  toggleBtn: {
    flex:            1,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             6,
    paddingVertical: Spacing.sm,
    borderRadius:    Radius.lg,
    borderWidth:     1,
  },
  toggleLabel: {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.medium,
  },
});

export default DrawerUserCard;
