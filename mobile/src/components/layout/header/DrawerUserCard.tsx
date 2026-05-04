import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getRoleColor } from '@/src/components/layout/header/navItems';
import { changeLanguage } from '@/src/i18n';
import { useIsDark, FontSize, FontWeight } from '@/src/constants/theme';
import { Avatar, Badge, ToggleButton } from '@/src/shared/components';

interface Props {
  name: string;
  role: string;
  isRtl: boolean;
  onToggleTheme: () => void;
}

const DrawerUserCard: React.FC<Props> = ({ name, role, isRtl, onToggleTheme }) => {
  const { i18n }    = useTranslation();
  const [switching, setSwitching] = React.useState(false);
  const currentLang = i18n.language;
  const isDark      = useIsDark();

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
      borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.12)',
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
            color: '#ffffff',
            fontWeight: FontWeight.bold,
            fontSize: FontSize.md,
            textAlign: isRtl ? 'right' : 'left',
          }}>
            {name}
          </Text>
          <Badge
            label={role.replace('_', ' ')}
            backgroundColor={`${getRoleColor(role)}55`}
            textColor={'#ffffff'}
            style={{ alignSelf: isRtl ? 'flex-end' : 'flex-start', marginTop: 4 }}
          />
        </View>
      </View>

      {/* Theme + language toggles */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <ToggleButton
          icon={isDark ? '☀️' : '🌙'}
          label={isDark ? 'Light' : 'Dark'}
          backgroundColor='rgba(255,255,255,0.14)'
          textColor='#ffffff'
          onPress={onToggleTheme}
        />
        <ToggleButton
          label={currentLang === 'en' ? 'عربي' : 'EN'}
          loading={switching}
          backgroundColor='rgba(255,255,255,0.14)'
          textColor='#ffffff'
          onPress={handleLanguageSwitch}
        />
      </View>
    </View>
  );
};

export default DrawerUserCard;
