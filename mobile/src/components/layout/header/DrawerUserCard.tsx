import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { getInitials, getRoleColor } from './navItems';
import { changeLanguage, getCurrentLanguage } from '../../../i18n';
import { Avatar, Badge, ToggleButton } from '../../../shared/components';

interface Props {
  name: string;
  role: string;
  isDark: boolean;
  isRtl: boolean;
  onToggleTheme: () => void;
}

const DrawerUserCard: React.FC<Props> = ({ name, role, isDark, isRtl, onToggleTheme }) => {
  const [switching, setSwitching] = useState(false);
  const currentLang = getCurrentLanguage();

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
      borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)',
    }}>
      {/* Avatar + name — always row, icon left, text right-aligned in RTL */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <Avatar
          text={name}
          backgroundColor={getRoleColor(role)}
          size={44}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14, textAlign: isRtl ? 'right' : 'left' }}>
            {name}
          </Text>
          <Badge
            label={role}
            backgroundColor={`${getRoleColor(role)}44`}
            textColor="#fff"
            style={{ alignSelf: isRtl ? 'flex-end' : 'flex-start', marginTop: 2 }}
          />
        </View>
      </View>

      {/* Theme + language toggles */}
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
