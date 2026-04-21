import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { changeLanguage, getCurrentLanguage } from '../i18n';

interface Props {
  isDark?: boolean;
}

const LanguageSwitcher: React.FC<Props> = ({ isDark = false }) => {
  const { i18n } = useTranslation();
  const [switching, setSwitching] = useState(false);
  const current = getCurrentLanguage();

  const handleSwitch = async (lng: 'en' | 'ar') => {
    if (lng === current || switching) return;
    setSwitching(true);
    try {
      await changeLanguage(lng);
    } finally {
      setSwitching(false);
    }
  };

  const btnBg = isDark ? '#334155' : '#f1f5f9';
  const activeBg = isDark ? '#1e40af' : '#3b82f6';
  const textColor = isDark ? '#e2e8f0' : '#1e293b';
  const activeText = '#ffffff';

  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: btnBg,
      borderRadius: 8,
      padding: 2,
      gap: 2,
    }}>
      <Pressable
        onPress={() => handleSwitch('en')}
        disabled={switching}
        style={{
          paddingHorizontal: 16,
          paddingVertical: 6,
          borderRadius: 6,
          backgroundColor: current === 'en' ? activeBg : 'transparent',
          minWidth: 50,
          alignItems: 'center',
        }}
      >
        {switching && current === 'ar' ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <Text style={{
            fontSize: 13,
            fontWeight: current === 'en' ? '700' : '500',
            color: current === 'en' ? activeText : textColor,
          }}>
            EN
          </Text>
        )}
      </Pressable>

      <Pressable
        onPress={() => handleSwitch('ar')}
        disabled={switching}
        style={{
          paddingHorizontal: 16,
          paddingVertical: 6,
          borderRadius: 6,
          backgroundColor: current === 'ar' ? activeBg : 'transparent',
          minWidth: 50,
          alignItems: 'center',
        }}
      >
        {switching && current === 'en' ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <Text style={{
            fontSize: 13,
            fontWeight: current === 'ar' ? '700' : '500',
            color: current === 'ar' ? activeText : textColor,
          }}>
            عربي
          </Text>
        )}
      </Pressable>
    </View>
  );
};

export default LanguageSwitcher;
