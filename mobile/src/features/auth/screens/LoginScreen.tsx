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

import { Modal, FlatList, TextInput } from 'react-native';
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
  const [open, setOpen]       = useState(false);
  const [search, setSearch]   = useState('');
  const selected              = tenants.find((t) => t.slug === value);

  const filtered = search.trim()
    ? tenants.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.slug.toLowerCase().includes(search.toLowerCase())
      )
    : tenants;

  const handleOpen = () => {
    if (disabled) return;
    setSearch('');
    setOpen(true);
  };

  const handleSelect = (slug: string) => {
    onChange(slug);
    setOpen(false);
  };

  return (
    <>
      {/* Trigger button */}
      <Pressable
        onPress={handleOpen}
        className={`rounded-xl border-2 px-4 py-3 flex-row items-center justify-between mb-3 ${
          disabled
            ? 'opacity-40 bg-gray-100 border-gray-200'
            : selected
            ? 'bg-blue-50 border-blue-300'
            : 'bg-white border-gray-300'
        }`}
      >
        <View className="flex-row items-center gap-2 flex-1">
          {selected ? (
            <>
              <View className="w-7 h-7 rounded-full bg-blue-600 items-center justify-center">
                <Text className="text-white text-xs font-bold">
                  {selected.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 text-sm font-semibold">{selected.name}</Text>
                <Text className="text-gray-400 text-xs">{selected.slug}</Text>
              </View>
            </>
          ) : (
            <>
              <View className="w-7 h-7 rounded-full bg-gray-200 items-center justify-center">
                <Text className="text-gray-400 text-sm">🏢</Text>
              </View>
              <Text className="text-gray-400 text-sm flex-1">
                {loading ? 'Loading tenants…' : 'Select tenant (optional)'}
              </Text>
            </>
          )}
        </View>
        <Text className={`text-sm ml-2 ${selected ? 'text-blue-400' : 'text-gray-300'}`}>
          {selected ? '✕' : '▼'}
        </Text>
      </Pressable>

      {selected && !disabled ? (
        <Pressable
          className="mb-3 -mt-2 self-end"
          onPress={() => onChange('')}
        >
          <Text className="text-xs text-gray-400 underline">Clear selection</Text>
        </Pressable>
      ) : null}

      {/* Bottom sheet modal */}
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setOpen(false)}
        >
          {/* Sheet — stop propagation so tapping inside doesn't close */}
          <Pressable
            className="bg-white rounded-t-3xl"
            style={{ maxHeight: '70%' }}
            onPress={() => {}}
          >
            {/* Handle bar */}
            <View className="items-center pt-3 pb-1">
              <View className="w-10 h-1 rounded-full bg-gray-300" />
            </View>

            {/* Header */}
            <View className="flex-row items-center justify-between px-5 py-3 border-b border-gray-100">
              <Text className="text-lg font-bold text-gray-900">Select Tenant</Text>
              <Pressable
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                onPress={() => setOpen(false)}
              >
                <Text className="text-gray-500 text-base">✕</Text>
              </Pressable>
            </View>

            {/* Search */}
            <View className="px-4 py-3 border-b border-gray-100">
              <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2 gap-2">
                <Text className="text-gray-400">🔍</Text>
                <TextInput
                  className="flex-1 text-sm text-gray-900"
                  placeholder="Search tenants…"
                  placeholderTextColor="#9ca3af"
                  value={search}
                  onChangeText={setSearch}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {search.length > 0 && (
                  <Pressable onPress={() => setSearch('')}>
                    <Text className="text-gray-400 text-sm">✕</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* List */}
            <FlatList
              data={filtered}
              keyExtractor={(t) => t.id}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View className="items-center py-10">
                  <Text className="text-3xl mb-2">🔍</Text>
                  <Text className="text-gray-400 text-sm">No tenants found</Text>
                </View>
              }
              renderItem={({ item }) => {
                const isSelected = item.slug === value;
                return (
                  <Pressable
                    className={`flex-row items-center gap-3 px-5 py-3.5 border-b border-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                    onPress={() => handleSelect(item.slug)}
                  >
                    {/* Avatar */}
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center"
                      style={{ backgroundColor: isSelected ? '#2563eb' : '#e5e7eb' }}
                    >
                      <Text
                        className="font-bold text-sm"
                        style={{ color: isSelected ? '#fff' : '#6b7280' }}
                      >
                        {item.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    {/* Info */}
                    <View className="flex-1">
                      <Text className={`text-sm font-semibold ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                        {item.name}
                      </Text>
                      <Text className="text-xs text-gray-400 mt-0.5">{item.slug}</Text>
                    </View>

                    {/* Check */}
                    {isSelected && (
                      <View className="w-6 h-6 rounded-full bg-blue-600 items-center justify-center">
                        <Text className="text-white text-xs font-bold">✓</Text>
                      </View>
                    )}
                  </Pressable>
                );
              }}
            />
          </Pressable>
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

      {tenantSlug && roles.length > 0 ? (
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
      ) : null}

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
        <View
          className={`mx-4 mb-8 rounded-2xl p-6 ${isDark ? 'bg-gray-900/80' : 'bg-white/90'}`}
          style={{
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            elevation: 8,
          } as any}
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
