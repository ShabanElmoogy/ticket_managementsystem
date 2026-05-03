import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '@/src/constants/theme';
import { AppButton } from '@/src/shared/components';
import type { PublicTenant } from '@/src/features/auth/api/tenants';

// Demo credentials — only used in development/staging
const DEMO_ADMIN_EMAIL    = 'manager@company.com';
const DEMO_ADMIN_PASSWORD = 'shabanelmogy';

export interface DemoSectionProps {
  tenantSlug:  string;
  tenants:     PublicTenant[];
  loading:     boolean;
  onDemoLogin: (email: string, password: string, options?: { tenantSlug?: string | null }) => void;
}

const DemoSection: React.FC<DemoSectionProps> = ({
  tenantSlug, tenants, loading, onDemoLogin,
}) => {
  const c      = useThemeColors();
  const { t }  = useTranslation();
  const tenant = tenants.find((t) => t.slug === tenantSlug);

  const roles = tenant
    ? [
        { label: 'Admin',      email: tenant.adminEmail      },
        { label: 'Employee',   email: tenant.employeeEmail   },
        { label: 'Programmer', email: tenant.programmerEmail },
      ].filter((r) => r.email)
    : [];

  return (
    <View style={styles.container}>
      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={[styles.line, { backgroundColor: c.border.primary }]} />
        <Text style={[styles.dividerText, { color: c.text.muted }]}>{t('auth.quickDemoLogin')}</Text>
        <View style={[styles.line, { backgroundColor: c.border.primary }]} />
      </View>

      {/* Role buttons */}
      {tenantSlug && roles.length > 0 && (
        <View style={styles.roleRow}>
          {roles.map((r) => (
            <View key={r.label} style={{ flex: 1 }}>
              <AppButton
                variant="outline"
                size="small"
                disabled={loading}
                onPress={() => onDemoLogin(r.email!, '', { tenantSlug })}
                style={{ flex: 1 }}
              >
                {r.label}
              </AppButton>
            </View>
          ))}
        </View>
      )}

      {/* System admin card */}
      <Pressable
        style={[
          styles.adminCard,
          {
            borderColor:     c.interactive.primary,
            backgroundColor: c.intent.infoSurface,
            opacity:         loading ? 0.75 : 1,
          },
        ]}
        onPress={() => onDemoLogin(DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD)}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Login as System Administrator"
      >
        <View style={[styles.adminAvatar, { backgroundColor: c.interactive.primary }]}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, color: c.text.inverse }}>SA</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: c.text.primary }}>
            {t('auth.systemAdmin')}
          </Text>
          <Text style={{ fontSize: 12, color: c.text.secondary }}>{DEMO_ADMIN_EMAIL}</Text>
        </View>
        <View style={[styles.adminBadge, { backgroundColor: c.interactive.primary }]}>
          <Text style={{ fontSize: 12, fontWeight: 'bold', color: c.text.inverse }}>Admin</Text>
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container:   { marginTop: 16 },
  dividerRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  line:        { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontWeight: '500' },
  roleRow:     { flexDirection: 'row', gap: 8, marginBottom: 12 },
  adminCard:   { borderWidth: 1, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  adminAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  adminBadge:  { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
});

export default DemoSection;
