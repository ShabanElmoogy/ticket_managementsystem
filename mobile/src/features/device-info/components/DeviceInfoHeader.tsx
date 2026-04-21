import React from 'react';
import { View, Text, Platform, I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../../components/LanguageSwitcher';

interface Props {
  isDark: boolean;
  osVersion: string | number;
}

const DeviceInfoHeader: React.FC<Props> = ({ isDark, osVersion }) => {
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;

  return (
    <View style={{
      paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: isDark ? '#334155' : '#e2e8f0',
      backgroundColor: isDark ? '#1e293b' : '#fff',
    }}>
      {/* Top row — title + language switcher */}
      <View style={{
        flexDirection: isRTL ? 'row-reverse' : 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
      }}>
        <View style={{
          flexDirection: isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          gap: 10,
        }}>
          <Text style={{ fontSize: 22 }}>📱</Text>
          <Text style={{ fontSize: 17, fontWeight: '800', color: isDark ? '#f1f5f9' : '#0f172a' }}>
            {t('deviceInfo.title')}
          </Text>
        </View>
        <LanguageSwitcher isDark={isDark} />
      </View>

      {/* Bottom row — OS version */}
      <Text style={{
        fontSize: 12,
        color: isDark ? '#64748b' : '#94a3b8',
        textAlign: isRTL ? 'right' : 'left',
        marginStart: 32,
      }}>
        {Platform.OS.toUpperCase()} · v{String(osVersion)}
      </Text>
    </View>
  );
};

export default DeviceInfoHeader;
