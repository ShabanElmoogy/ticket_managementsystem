import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { getRoleColor } from '@/src/components/layout/header/navItems';
import { changeLanguage, getCurrentLanguage } from '@/src/i18n';
import { useThemeColors, useIsDark, FontSize, FontWeight } from '@/src/constants/theme';
import { Avatar, Badge, ToggleButton } from '@/src/shared/components';

interface Props {
  name: string;
  role: string;
  isRtl: boolean;
  onToggleTheme: () => void;
}

const DrawerUserCard: React.FC<Props> = ({ name, role, isRtl, onToggleTheme }) => {
  const [switching, setSwitching] = useState(false);
  const currentLang = getCurrentLanguage();
  const isDark      = useIsDark();
  const c           = useThemeColors();

  // The drawer panel sits on a brand-colored background (indigo/slate),
  // so we use white-at-opacity for the divider — not a theme surface border.
  const dividerColor = 'rgba(255,255,255,0.15)';

  const handleLanguageSwitch = async () => {
    if (switching) return;
    setSwitching(true);
    try {
      const newLang = currentLang === 'en' ? 'ar' : 'en';
      await changeLanguage(newLang);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <View style={{
      paddingTop: 16, paddingHorizontal: 16, paddingBottom: 12,
      borderBottomWidth: 1, borderBottomColor: dividerColor,
    }}>
      {/* Avatar + name row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <Avatar
          text={name}
          backgroundColor={getRoleColor(role)}
          size={44}
        />
        <View style={{ flex: 1 }}>
          <Text style={{
            color: c.text.inverse,
            fontWeight: FontWeight.semibold,
            fontSize: FontSize.md,
            textAlign: isRtl ? 'right' : 'left',
          }}>
            {name}
          </Text>
          <Badge
            label={role}
            backgroundColor={`${getRoleColor(role)}44`}
            textColor={c.text.inverse}
            style={{ alignSelf: isRtl ? 'flex-end' : 'flex-start', marginTop: 2 }}
          />
        </View>
      </View>

      {/* Theme + language toggles — white-on-color style, intentional */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <ToggleButton
          icon={isDark ? '☀️' : '🌙'}
          label={isDark ? 'Light' : 'Dark'}
          onPress={onToggleTheme}
        />
        <ToggleButton
          label={currentLang === 'en' ? 'عربي' : 'EN'}
          loading={switching}
          onPress={handleLanguageSwitch}
        />
      </View>
    </View>
  );
};

export default DrawerUserCard;
