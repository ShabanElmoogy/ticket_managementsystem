import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLoginForm } from '../hooks/useLoginForm';
import AppTextInput from '../../../shared/components/AppTextInput';
import AppButton from '../../../shared/components/AppButton';
import type { Direction } from '../../../stores/uiStore';

// ── Tenant picker ──────────────────────────────────────────────────────────

import { Modal, FlatList } from 'react-native';
import { useState } from 'react';
import type { PublicTenant } from '../api/tenants';

interface TenantPickerProps {
  tenants: PublicTenant[];
  value: string;
  loading: boolean;
  disabled: boolean;
  onChange: (slug: string) => void;
}

const TenantPicker: React.FC<TenantPickerProps> = ({ tenants, value, loading, disabled, onChange }) => {
  const [open, setOpen] = useState(false);
  const selected = tenants.find((t) => t.slug === value);

  return (
    <>
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        className={`border-2 rounded-lg px-3 py-3 flex-row items-center justify-between mb-3 ${disabled ? 'opacity-50 bg-gray-50' : 'bg-white border-gray-300'}`}
      >
        <Text className={selected ? 'text-gray-900 text-base' : 'text-gray-400 text-base'}>
          {loading ? 'Loading tenants…' : selected ? selected.name : 'Select tenant (optional)'}
        </Text>
        <Text className="text-gray-400">▼</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/50 justify-end" onPress={() => setOpen(false)}>
          <View className="bg-white rounded-t-2xl max-h-96">
            <View className="p-4 border-b border-gray-100">
              <Text className="text-base font-bold text-gray-900 text-center">Select Tenant</Text>
            </View>
            <FlatList
              data={tenants}
              keyExtractor={(t) => t.id}
              renderItem={({ item }) => (
                <Pressable
                  className={`px-4 py-3 border-b border-gray-50 ${item.slug === value ? 'bg-blue-50' : ''}`}
                  onPress={() => { onChange(item.slug); setOpen(false); }}
                >
                  <Text className={`text-base font-semibold ${item.slug === value ? 'text-blue-600' : 'text-gray-900'}`}>
                    {item.name}
                  </Text>
                  <Text className="text-xs text-gray-400 mt-0.5">{item.slug}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

// ── Demo login section ─────────────────────────────────────────────────────

interface DemoSectionProps {
  tenantSlug: string;
  tenants: PublicTenant[];
  loading: boolean;
  onDemoLogin: (email: string, password: string, options?: { tenantSlug?: string | null }) => void;
}

const DemoSection: React.FC<DemoSectionProps> = ({ tenantSlug, tenants, loading, onDemoLogin }) => {
  const tenant = tenants.find((t) => t.slug === tenantSlug);

  const roles = tenant
    ? [
        { label: 'Admin',      email: tenant.adminEmail,      color: 'primary'   as const },
        { label: 'Employee',   email: tenant.employeeEmail,   color: 'secondary' as const },
        { label: 'Programmer', email: tenant.programmerEmail, color: 'warning'   as const },
      ].filter((r) => r.email)
    : [];

  return (
    <View className="mt-4">
      <View className="flex-row items-center gap-3 mb-3">
        <View className="flex-1 h-px bg-gray-200" />
        <Text className="text-xs text-gray-400 font-medium">Quick demo login</Text>
        <View className="flex-1 h-px bg-gray-200" />
      </View>

      {/* Tenant role buttons */}
      {tenantSlug && roles.length > 0 && (
        <View className="flex-row gap-2 mb-3">
          {roles.map((r) => (
            <AppButton
              key={r.label}
              variant="outlined"
              color={r.color}
              size="small"
              disabled={loading}
              onPress={() => onDemoLogin(r.email!, '', { tenantSlug })}
              style={{ flex: 1 }}
            >
              {r.label}
            </AppButton>
          ))}
        </View>
      )}

      {/* System admin demo card */}
      <Pressable
        className="border border-blue-100 bg-blue-50 rounded-xl p-3 flex-row items-center gap-3 active:opacity-75"
        onPress={() => onDemoLogin('manager@company.com', 'shabanelmogy')}
        disabled={loading}
      >
        <View className="w-10 h-10 rounded-full bg-blue-600 items-center justify-center">
          <Text className="text-white font-bold text-base">SA</Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-gray-900">System Administrator</Text>
          <Text className="text-xs text-gray-500">manager@company.com</Text>
        </View>
        <View className="bg-blue-600 rounded-full px-2 py-0.5">
          <Text className="text-white text-xs font-bold">Admin</Text>
        </View>
      </Pressable>
    </View>
  );
};

// ── Main login screen ──────────────────────────────────────────────────────

const LoginScreen: React.FC = () => {
  const {
    email, setEmail,
    password, setPassword,
    showPassword, setShowPassword,
    error,
    loading,
    isSystemLogin, setIsSystemLogin,
    tenantSlug,
    tenants,
    tenantsLoading,
    colorMode,
    toggleColorMode,
    direction,
    setDirection,
    handleTenantChange,
    handleSubmit,
    handleDemoLogin,
  } = useLoginForm();

  const isDark = colorMode === 'dark';
  const isRtl  = direction === 'rtl';

  const toggleRtl = () => setDirection(isRtl ? 'ltr' : 'rtl');

  return (
    <SafeAreaView
      style={{ flex: 1 }}
      className={isDark ? 'bg-slate-900' : 'bg-amber-50'}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
        {/* Top-right controls: theme + RTL */}
        <View className="absolute top-3 right-4 z-10 flex-row gap-2">
          {/* RTL toggle */}
          <Pressable
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
            onPress={toggleRtl}
            accessibilityLabel="Toggle RTL"
          >
            <Text className="text-base font-bold" style={{ color: isDark ? '#fff' : '#374151' }}>
              {isRtl ? 'LTR' : 'RTL'}
            </Text>
          </Pressable>

          {/* Theme toggle */}
          <Pressable
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
            onPress={toggleColorMode}
            accessibilityLabel="Toggle theme"
          >
            <Text className="text-lg">{isDark ? '☀️' : '🌙'}</Text>
          </Pressable>
        </View>

        {/* Branding header */}
        <View className="items-center pt-8 pb-6 px-6">
          <View className="w-16 h-16 rounded-2xl bg-blue-600 items-center justify-center mb-4 shadow-lg">
            <Text className="text-white text-3xl">🎫</Text>
          </View>
          <Text className={`text-3xl font-extrabold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            TicketFlow Pro
          </Text>
          <Text className={`text-sm text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Professional ticket management system
          </Text>

          {/* Feature pills */}
          <View className="flex-row gap-2 mt-4 flex-wrap justify-center">
            {['📊 Dashboard', '🗂️ Kanban', '🔔 Alerts'].map((f) => (
              <View key={f} className={`rounded-full px-3 py-1 ${isDark ? 'bg-white/10' : 'bg-white/60'}`}>
                <Text className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{f}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Login card */}
        <View className={`mx-4 mb-8 rounded-2xl p-6 shadow-xl ${isDark ? 'bg-gray-900/80' : 'bg-white/90'}`}
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 8 }}
        >
          {/* Welcome text */}
          <Text className="text-xs font-semibold text-blue-600 uppercase tracking-widest text-center mb-1">
            Welcome back
          </Text>
          <Text className={`text-2xl font-bold text-center mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Sign in to TicketFlow
          </Text>
          <Text className={`text-sm text-center mb-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Access your professional ticket management dashboard
          </Text>

          {/* System login toggle */}
          <Pressable
            className={`self-start rounded-full px-3 py-1.5 mb-4 border ${isSystemLogin ? 'bg-blue-600 border-blue-600' : 'bg-transparent border-gray-300'}`}
            onPress={() => setIsSystemLogin((v) => !v)}
            disabled={loading}
          >
            <Text className={`text-xs font-semibold ${isSystemLogin ? 'text-white' : 'text-gray-600'}`}>
              {isSystemLogin ? '🔑 System login (SUPER_ADMIN)' : '🏢 Tenant login'}
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
            label="Email address"
            fieldType="email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            editable={!loading}
          />

          {/* Password */}
          <AppTextInput
            label="Password"
            fieldType="password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            editable={!loading}
          />

          {/* Error */}
          {!!error && (
            <View className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 mb-3">
              <Text className="text-sm text-red-700">{error}</Text>
            </View>
          )}

          {/* Submit */}
          <AppButton
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            loading={loading}
            loadingText="Signing in…"
            onPress={handleSubmit}
            style={{ marginTop: 4 }}
          >
            Sign in to Dashboard
          </AppButton>

          {/* Demo section */}
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

export default LoginScreen;
