import React from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors, useIsDark } from '@/src/constants/theme';
import { useLoginForm } from '@/src/features/auth/hooks/useLoginForm';
import { changeLanguage } from '@/src/i18n';
import LoginBrandHeader  from './login/LoginBrandHeader';
import LoginTypeSelector from './login/LoginTypeSelector';
import LoginForm         from './login/LoginForm';
import TenantPicker      from './login/TenantPicker';
import DemoSection       from './login/DemoSection';

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

  const handleToggleDirection = () => {
    setDirection(isRtl ? 'ltr' : 'rtl');
    changeLanguage(isRtl ? 'en' : 'ar');
  };

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
          <View style={[styles.card, { backgroundColor: c.surface.primary, shadowColor: c.shadow }]}>

            {/* Accent stripe */}
            <View style={[styles.cardAccentBar, { backgroundColor: c.interactive.primary }]} />

            {/* Brand header — icon, name, controls, pills */}
            <LoginBrandHeader
              isRtl={isRtl}
              onToggleDirection={handleToggleDirection}
              onToggleTheme={toggleColorMode}
            />

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: c.border.primary }]} />

            {/* Form body */}
            <View style={styles.cardBody}>

              {/* Login type segmented control */}
              <LoginTypeSelector
                isSystemLogin={isSystemLogin}
                isRtl={isRtl}
                disabled={loading}
                onChange={setIsSystemLogin}
              />

              {/* Tenant picker */}
              <TenantPicker
                tenants={tenants}
                value={tenantSlug}
                loading={tenantsLoading}
                disabled={loading || isSystemLogin}
                onChange={handleTenantChange}
              />

              {/* Email + password + error + submit */}
              <LoginForm
                email={email}
                onEmailChange={setEmail}
                password={password}
                onPasswordChange={setPassword}
                error={error}
                loading={loading}
                onSubmit={handleSubmit}
              />

              {/* Demo logins */}
              <DemoSection
                tenantSlug={tenantSlug}
                tenants={tenants}
                loading={loading}
                onDemoLogin={handleDemoLogin}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root:          { flex: 1 },
  flex:          { flex: 1 },
  scrollContent: { flexGrow: 1, paddingTop: 16, paddingBottom: 32 },

  card: {
    marginHorizontal: 16,
    borderRadius:     20,
    shadowOffset:     { width: 0, height: 8 },
    shadowOpacity:    0.14,
    shadowRadius:     32,
    elevation:        10,
    overflow:         'hidden',
  },
  cardAccentBar: { height: 4, width: '100%' },
  divider:       { height: 1, marginHorizontal: 20 },
  cardBody:      { padding: 20 },
});

export default LoginScreen;
