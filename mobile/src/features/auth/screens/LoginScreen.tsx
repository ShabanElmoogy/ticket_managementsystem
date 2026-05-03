import React from 'react';
import {
  View, Text, Pressable, ScrollView,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors, useIsDark } from '@/src/constants/theme';
import { useLoginForm } from '@/src/features/auth/hooks/useLoginForm';
import { changeLanguage } from '@/src/i18n';
import { useTranslation } from 'react-i18next';
import { AppTextInput, AppButton } from '@/src/shared/components';
import LoginHeader   from './login/LoginHeader';
import LoginControls from './login/LoginControls';
import TenantPicker  from './login/TenantPicker';
import DemoSection   from './login/DemoSection';

const LoginScreen: React.FC = () => {
  const c = useThemeColors();
  const {
    email, setEmail,
    password, setPassword,
    error,
    loading,
    isSystemLogin, setIsSystemLogin,
    tenantSlug,
    tenants,
    tenantsLoading,
    toggleColorMode,
    direction,
    setDirection,
    handleTenantChange,
    handleSubmit,
    handleDemoLogin,
  } = useLoginForm();

  const isDark = useIsDark();
  const isRtl  = direction === 'rtl';
  const { t }  = useTranslation();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.surface.secondary }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* Top-right controls */}
          <LoginControls
            isRtl={isRtl}
            onToggleRtl={() => {
              const newLng = isRtl ? 'en' : 'ar';
              setDirection(isRtl ? 'ltr' : 'rtl');
              changeLanguage(newLng);
            }}
            onToggleTheme={toggleColorMode}
          />

          {/* Branding */}
          <LoginHeader />

          {/* Login card */}
          <View style={[styles.card, { backgroundColor: c.surface.primary, shadowColor: c.shadow }]}>

            {/* Welcome text */}
            <Text style={[styles.eyebrow, { color: c.interactive.primary }]}>{t('auth.welcomeBack')}</Text>
            <Text style={[styles.cardTitle, { color: c.text.primary }]}>{t('auth.signInTitle')}</Text>
            <Text style={[styles.cardSubtitle, { color: c.text.secondary }]}>{t('auth.signInSubtitle')}</Text>

            {/* System / tenant toggle */}
            <Pressable
              style={[
                styles.loginToggle,
                {
                  backgroundColor: isSystemLogin ? c.interactive.primary : 'transparent',
                  borderColor:     isSystemLogin ? c.interactive.primary : c.border.primary,
                },
              ]}
              onPress={() => setIsSystemLogin((v) => !v)}
              disabled={loading}
              accessibilityRole="switch"
              accessibilityLabel={isSystemLogin ? t('auth.systemLogin') : t('auth.tenantLogin')}
              accessibilityState={{ checked: isSystemLogin }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: isSystemLogin ? c.text.inverse : c.text.secondary }}>
                {isSystemLogin ? t('auth.systemLogin') : t('auth.tenantLogin')}
              </Text>
            </Pressable>

            {/* Tenant picker */}
            <TenantPicker
              tenants={tenants}
              value={tenantSlug}
              loading={tenantsLoading}
              disabled={loading || isSystemLogin}
              onChange={handleTenantChange}
            />

            {/* Email */}
            <AppTextInput
              label={t('auth.emailLabel')}
              fieldType="email"
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.emailPlaceholder')}
              autoCapitalize="none"
              editable={!loading}
            />

            {/* Password */}
            <AppTextInput
              label={t('auth.passwordLabel')}
              fieldType="password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              editable={!loading}
            />

            {/* Error */}
            {!!error && (
              <View style={[styles.errorBox, { backgroundColor: c.intent.errorSurface, borderColor: c.intent.error }]}>
                <Text style={{ fontSize: 14, color: c.intent.error }}>{error}</Text>
              </View>
            )}

            {/* Submit */}
            <AppButton
              variant="contained"
              size="large"
              fullWidth
              loading={loading}
              loadingText={t('auth.signingIn')}
              onPress={handleSubmit}
              style={{ marginTop: 4 }}
            >
              {t('auth.signInButton')}
            </AppButton>

            {/* Demo logins */}
            <DemoSection
              tenantSlug={tenantSlug}
              tenants={tenants}
              loading={loading}
              onDemoLogin={handleDemoLogin}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root:         { flex: 1 },
  flex:         { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 24 },
  card: {
    marginHorizontal: 16,
    marginBottom:     32,
    borderRadius:     16,
    padding:          24,
    shadowOffset:     { width: 0, height: 8 },
    shadowOpacity:    0.12,
    shadowRadius:     32,
    elevation:        8,
  },
  eyebrow:     { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.2, textAlign: 'center', marginBottom: 4 },
  cardTitle:   { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  cardSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 20 },
  loginToggle: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 16, borderWidth: 1 },
  errorBox:    { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
});

export default LoginScreen;
