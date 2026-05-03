import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '@/src/constants/theme';

/**
 * LoginHeader — branding block shown above the login card.
 * App icon + name + tagline + feature pills.
 */
const LoginHeader: React.FC = () => {
  const c      = useThemeColors();
  const { t }  = useTranslation();
  const pills  = [t('auth.featureDashboard'), t('auth.featureKanban'), t('auth.featureAlerts')];

  return (
    <View style={styles.container}>
      {/* App icon */}
      <View style={[
        styles.iconWrap,
        {
          backgroundColor: c.interactive.primary,
          shadowColor:     c.shadow,
        },
      ]}>
        <Text style={{ fontSize: 32, color: c.text.inverse }}>🎫</Text>
      </View>

      <Text style={[styles.appName, { color: c.text.primary }]}>{t('auth.appName')}</Text>
      <Text style={[styles.tagline, { color: c.text.secondary }]}>{t('auth.appTagline')}</Text>

      {/* Feature pills */}
      <View style={styles.pillRow}>
        {pills.map((f) => (
          <View key={f} style={[styles.pill, { backgroundColor: c.surface.elevated }]}>
            <Text style={[styles.pillText, { color: c.text.secondary }]}>{f}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingTop: 32, paddingBottom: 24, paddingHorizontal: 24 },
  iconWrap:  { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  appName:   { fontSize: 32, fontWeight: '800', marginBottom: 4 },
  tagline:   { fontSize: 14, textAlign: 'center' },
  pillRow:   { flexDirection: 'row', gap: 8, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' },
  pill:      { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  pillText:  { fontSize: 12, fontWeight: '500' },
});

export default LoginHeader;
