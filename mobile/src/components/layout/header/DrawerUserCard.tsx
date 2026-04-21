import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { getInitials, getRoleColor } from './navItems';
import { changeLanguage, getCurrentLanguage } from '../../../i18n';

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
        <View style={{
          width: 44, height: 44, borderRadius: 22,
          backgroundColor: getRoleColor(role),
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{getInitials(name)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14, textAlign: isRtl ? 'right' : 'left' }}>
            {name}
          </Text>
          <View style={{ alignSelf: isRtl ? 'flex-end' : 'flex-start', backgroundColor: `${getRoleColor(role)}44`, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2, marginTop: 2 }}>
            <Text style={{ color: '#fff', fontSize: 11 }}>{role}</Text>
          </View>
        </View>
      </View>

      {/* Theme + language toggles */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, paddingVertical: 8 }}
          onPress={onToggleTheme}
        >
          <Text>{isDark ? '☀️' : '🌙'}</Text>
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '500' }}>{isDark ? 'Light' : 'Dark'}</Text>
        </Pressable>
        <Pressable
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, paddingVertical: 8 }}
          onPress={handleLanguageSwitch}
          disabled={switching}
        >
          {switching ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
                {currentLang === 'en' ? 'عربي' : 'EN'}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
};

export default DrawerUserCard;
