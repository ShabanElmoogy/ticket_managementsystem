import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '@/src/constants/theme';
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
        { label: 'Admin',      email: tenant.adminEmail,      icon: '🛡️' },
        { label: 'Employee',   email: tenant.employeeEmail,   icon: '👤' },
        { label: 'Programmer', email: tenant.programmerEmail, icon: '💻' },
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

      {/* Role buttons — visually distinct per role */}
      {tenantSlug && roles.length > 0 && (
        <View style={styles.roleRow}>
          {roles.map((r) => {
            const isAdmin      = r.label === 'Admin';
            const isEmployee   = r.label === 'Employee';
            const bg     = isAdmin ? c.intent.infoSurface    : isEmployee ? c.intent.successSurface : c.intent.warningSurface;
            const border = isAdmin ? c.interactive.primary   : isEmployee ? c.intent.success        : c.intent.warning;
            const text   = isAdmin ? c.interactive.primary   : isEmployee ? c.intent.success        : c.intent.warning;
            return (
              <Pressable
                key={r.label}
                style={[
                  styles.roleBtn,
                  { backgroundColor: bg, borderColor: border, opacity: loading ? 0.6 : 1 },
                ]}
                onPress={() => onDemoLogin(r.email!, '', { tenantSlug })}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel={`Login as ${r.label}`}
              >
                <Text style={styles.roleIcon}>{r.icon}</Text>
                <Text style={[styles.roleBtnText, { color: text }]}>{r.label}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* System admin card — left accent bar */}
      <Pressable
        style={[
          styles.adminCard,
          {
            backgroundColor: c.intent.infoSurface,
            borderColor:     c.border.secondary,
            opacity:         loading ? 0.75 : 1,
          },
        ]}
        onPress={() => onDemoLogin(DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD)}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Login as System Administrator"
      >
        {/* Left accent bar */}
        <View style={[styles.adminAccentBar, { backgroundColor: c.interactive.primary }]} />

        <View style={[styles.adminAvatar, { backgroundColor: c.interactive.primary }]}>
          <Text style={[styles.adminAvatarText, { color: c.text.inverse }]}>SA</Text>
        </View>

        <View style={styles.adminInfo}>
          <Text style={[styles.adminName, { color: c.text.primary }]}>{t('auth.systemAdmin')}</Text>
          <Text style={[styles.adminEmail, { color: c.text.secondary }]}>{DEMO_ADMIN_EMAIL}</Text>
        </View>

        <View style={[styles.adminBadge, { backgroundColor: c.interactive.primary }]}>
          <Text style={[styles.adminBadgeText, { color: c.text.inverse }]}>Admin</Text>
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container:       { marginTop: 16 },
  dividerRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  line:            { flex: 1, height: 1 },
  dividerText:     { fontSize: 12, fontWeight: '500' },

  roleRow:         { flexDirection: 'row', gap: 8, marginBottom: 12 },
  roleBtn: {
    flex:           1,
    borderRadius:   10,
    borderWidth:    1.5,
    paddingVertical: 10,
    alignItems:     'center',
    justifyContent: 'center',
    flexDirection:  'row',
    gap:            6,
  },
  roleBtnText:     { fontSize: 13, fontWeight: '700' },
  roleIcon:        { fontSize: 15 },

  adminCard: {
    borderRadius:    12,
    borderWidth:     1,
    flexDirection:   'row',
    alignItems:      'center',
    gap:             12,
    overflow:        'hidden',
    paddingEnd:      12,
    paddingVertical: 12,
  },
  adminAccentBar:  { width: 4, alignSelf: 'stretch' },
  adminAvatar: {
    width:          40,
    height:         40,
    borderRadius:   20,
    alignItems:     'center',
    justifyContent: 'center',
  },
  adminAvatarText: { fontWeight: 'bold', fontSize: 16 },
  adminInfo:       { flex: 1 },
  adminName:       { fontSize: 14, fontWeight: '600' },
  adminEmail:      { fontSize: 12, marginTop: 1 },
  adminBadge:      { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  adminBadgeText:  { fontSize: 12, fontWeight: 'bold' },
});

export default DemoSection;
