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
import { useThemeColors } from '@/src/constants/theme';
import { useLoginForm } from '@/src/features/auth/hooks/useLoginForm';
import { AppTextInput, AppButton } from '@/src/shared/components';

// ── Tenant picker ──────────────────────────────────────────────────────────

import { Modal, FlatList, TextInput } from 'react-native';
import { useState } from 'react';
import type { PublicTenant } from '@/src/features/auth/api/tenants';

interface TenantPickerProps {
  tenants: PublicTenant[];
  value: string;
  loading: boolean;
  disabled: boolean;
  onChange: (slug: string) => void;
}

const TenantPicker: React.FC<TenantPickerProps> = ({ tenants, value, loading, disabled, onChange }) => {
  const c = useThemeColors();
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
        className="rounded-xl border-2 px-4 py-3 flex-row items-center justify-between mb-3"
        style={{
          opacity: disabled ? 0.4 : 1,
          backgroundColor: selected ? c.intent.infoSurface : c.surface.primary,
          borderColor: selected ? c.interactive.primary : c.border.primary,
        }}
      >
        <View className="flex-row items-center gap-2 flex-1">
          {selected ? (
            <>
              <View className="w-7 h-7 rounded-full items-center justify-center" style={{ backgroundColor: c.interactive.primary }}>
                <Text className="text-xs font-bold" style={{ color: c.text.inverse }}>
                  {selected.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold" style={{ color: c.text.primary }}>{selected.name}</Text>
                <Text className="text-xs" style={{ color: c.text.muted }}>{selected.slug}</Text>
              </View>
            </>
          ) : (
            <>
              <View className="w-7 h-7 rounded-full items-center justify-center" style={{ backgroundColor: c.surface.secondary }}>
                <Text className="text-sm" style={{ color: c.text.muted }}>🏢</Text>
              </View>
              <Text className="text-sm flex-1" style={{ color: c.text.muted }}>
                {loading ? 'Loading tenants…' : 'Select tenant (optional)'}
              </Text>
            </>
          )}
        </View>
        <Text className="text-sm ml-2" style={{ color: selected ? c.interactive.primary : c.text.muted }}>
          {selected ? '✕' : '▼'}
        </Text>
      </Pressable>

      {selected && !disabled ? (
        <Pressable
          className="mb-3 -mt-2 self-end"
          onPress={() => onChange('')}
        >
          <Text className="text-xs underline" style={{ color: c.text.muted }}>Clear selection</Text>
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
            className="rounded-t-3xl"
            style={{ maxHeight: '70%', backgroundColor: c.surface.primary }}
            onPress={() => {}}
          >
            {/* Handle bar */}
            <View className="items-center pt-3 pb-1">
              <View className="w-10 h-1 rounded-full" style={{ backgroundColor: c.border.primary }} />
            </View>

            {/* Header */}
            <View className="flex-row items-center justify-between px-5 py-3 border-b" style={{ borderColor: c.border.secondary }}>
              <Text className="text-lg font-bold" style={{ color: c.text.primary }}>Select Tenant</Text>
              <Pressable
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: c.surface.secondary }}
                onPress={() => setOpen(false)}
              >
                <Text className="text-base" style={{ color: c.text.secondary }}>✕</Text>
              </Pressable>
            </View>

            {/* Search */}
            <View className="px-4 py-3 border-b" style={{ borderColor: c.border.secondary }}>
              <View className="flex-row items-center rounded-xl px-3 py-2 gap-2" style={{ backgroundColor: c.surface.secondary }}>
                <Text style={{ color: c.text.muted }}>🔍</Text>
                <TextInput
                  className="flex-1 text-sm"
                  placeholder="Search tenants…"
                  placeholderTextColor={c.text.muted}
                  style={{ color: c.text.primary }}
                  value={search}
                  onChangeText={setSearch}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {search.length > 0 && (
                  <Pressable onPress={() => setSearch('')}>
                    <Text className="text-sm" style={{ color: c.text.muted }}>✕</Text>
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
                  <Text className="text-sm" style={{ color: c.text.muted }}>No tenants found</Text>
                </View>
              }
              renderItem={({ item }) => {
                const isSelected = item.slug === value;
                return (
                  <Pressable
                    className="flex-row items-center gap-3 px-5 py-3.5 border-b"
                    style={{
                      borderColor: c.border.secondary,
                      backgroundColor: isSelected ? c.intent.infoSurface : 'transparent',
                    }}
                    onPress={() => handleSelect(item.slug)}
                  >
                    {/* Avatar */}
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center"
                      style={{ backgroundColor: isSelected ? c.interactive.primary : c.surface.secondary }}
                    >
                      <Text
                        className="font-bold text-sm"
                        style={{ color: isSelected ? c.text.inverse : c.text.secondary }}
                      >
                        {item.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    {/* Info */}
                    <View className="flex-1">
                      <Text className="text-sm font-semibold" style={{ color: isSelected ? c.interactive.primary : c.text.primary }}>
                        {item.name}
                      </Text>
                      <Text className="text-xs mt-0.5" style={{ color: c.text.muted }}>{item.slug}</Text>
                    </View>

                    {/* Check */}
                    {isSelected && (
                      <View className="w-6 h-6 rounded-full items-center justify-center" style={{ backgroundColor: c.interactive.primary }}>
                        <Text className="text-xs font-bold" style={{ color: c.text.inverse }}>✓</Text>
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
  const c = useThemeColors();
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
        <View className="flex-1 h-px" style={{ backgroundColor: c.border.primary }} />
        <Text className="text-xs font-medium" style={{ color: c.text.muted }}>Quick demo login</Text>
        <View className="flex-1 h-px" style={{ backgroundColor: c.border.primary }} />
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
        className="border rounded-xl p-3 flex-row items-center gap-3 active:opacity-75"
        style={{ borderColor: c.interactive.primary, backgroundColor: c.intent.infoSurface }}
        onPress={() => onDemoLogin('manager@company.com', 'shabanelmogy')}
        disabled={loading}
      >
        <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: c.interactive.primary }}>
          <Text className="font-bold text-base" style={{ color: c.text.inverse }}>SA</Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold" style={{ color: c.text.primary }}>System Administrator</Text>
          <Text className="text-xs" style={{ color: c.text.secondary }}>manager@company.com</Text>
        </View>
        <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: c.interactive.primary }}>
          <Text className="text-xs font-bold" style={{ color: c.text.inverse }}>Admin</Text>
        </View>
      </Pressable>
    </View>
  );
};

// ── Main login screen ──────────────────────────────────────────────────────

const LoginScreen: React.FC = () => {
  const c = useThemeColors();
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
      style={{ flex: 1, backgroundColor: c.surface.secondary }}
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
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: c.surface.elevated }}
            onPress={toggleRtl}
            accessibilityLabel="Toggle RTL"
          >
            <Text className="text-base font-bold" style={{ color: c.text.primary }}>
              {isRtl ? 'LTR' : 'RTL'}
            </Text>
          </Pressable>

          {/* Theme toggle */}
          <Pressable
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: c.surface.elevated }}
            onPress={toggleColorMode}
            accessibilityLabel="Toggle theme"
          >
            <Text className="text-lg">{isDark ? '☀️' : '🌙'}</Text>
          </Pressable>
        </View>

        {/* Branding header */}
        <View className="items-center pt-8 pb-6 px-6">
          <View className="w-16 h-16 rounded-2xl items-center justify-center mb-4 shadow-lg" style={{ backgroundColor: c.interactive.primary }}>
            <Text className="text-3xl" style={{ color: c.text.inverse }}>🎫</Text>
          </View>
          <Text className="text-3xl font-extrabold mb-1" style={{ color: c.text.primary }}>
            TicketFlow Pro
          </Text>
          <Text className="text-sm text-center" style={{ color: c.text.secondary }}>
            Professional ticket management system
          </Text>

          {/* Feature pills */}
          <View className="flex-row gap-2 mt-4 flex-wrap justify-center">
            {['📊 Dashboard', '🗂️ Kanban', '🔔 Alerts'].map((f) => (
              <View
                key={f}
                className="rounded-full px-3 py-1"
                style={{ backgroundColor: c.surface.elevated }}
              >
                <Text className="text-xs font-medium" style={{ color: c.text.secondary }}>{f}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Login card */}
        <View
          className="mx-4 mb-8 rounded-2xl p-6"
          style={{
            backgroundColor: c.surface.primary,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            elevation: 8,
          } as any}
        >
          {/* Welcome text */}
          <Text className="text-xs font-semibold uppercase tracking-widest text-center mb-1" style={{ color: c.interactive.primary }}>
            Welcome back
          </Text>
          <Text className="text-2xl font-bold text-center mb-1" style={{ color: c.text.primary }}>
            Sign in to TicketFlow
          </Text>
          <Text className="text-sm text-center mb-5" style={{ color: c.text.secondary }}>
            Access your professional ticket management dashboard
          </Text>

          {/* System login toggle */}
          <Pressable
            className="self-start rounded-full px-3 py-1.5 mb-4 border"
            style={{
              backgroundColor: isSystemLogin ? c.interactive.primary : 'transparent',
              borderColor: isSystemLogin ? c.interactive.primary : c.border.primary,
            }}
            onPress={() => setIsSystemLogin((v) => !v)}
            disabled={loading}
          >
            <Text className="text-xs font-semibold" style={{ color: isSystemLogin ? c.text.inverse : c.text.secondary }}>
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
            <View
              className="border rounded-lg px-3 py-2.5 mb-3"
              style={{ backgroundColor: c.intent.errorSurface, borderColor: c.intent.error }}
            >
              <Text className="text-sm" style={{ color: c.intent.error }}>{error}</Text>
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
