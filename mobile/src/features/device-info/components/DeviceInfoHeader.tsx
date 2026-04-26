import React from 'react';
import { View, Text, Platform, I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '@/src/constants/theme';
import LanguageSwitcher from '@/src/components/LanguageSwitcher';

interface Props {
  osVersion: string | number;
}

const DeviceInfoHeader: React.FC<Props> = ({ osVersion }) => {
  const { t } = useTranslation();
  const c = useThemeColors();
  const isRTL = I18nManager.isRTL;

  return (
    <View style={{
      paddingHorizontal: 16, 
      paddingVertical: 14,
      borderBottomWidth: 1, 
      borderBottomColor: c.border.primary,
      backgroundColor: c.surface.primary,
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
          <Text style={{ 
            fontSize: 17, 
            fontWeight: '800', 
            color: c.text.primary 
          }}>
            {t('deviceInfo.title')}
          </Text>
        </View>
        <LanguageSwitcher />
      </View>

      {/* Bottom row — OS version */}
      <Text style={{
        fontSize: 12,
        color: c.text.muted,
        textAlign: isRTL ? 'right' : 'left',
        marginStart: 32,
      }}>
        {Platform.OS.toUpperCase()} · v{String(osVersion)}
      </Text>
    </View>
  );
};

export default DeviceInfoHeader;
