import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors, useIsDark } from '@/src/constants/theme';
import { useLoginForm } from '@/src/features/auth/hooks/useLoginForm';
import { AppTextInput, AppButton } from '@/src/shared/components';
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
        style={{
          borderRadius: 12,
          borderWidth: 2,
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          opacity: disabled ? 0.4 : 1,
          backgroundColor: selected ? c.intent.infoSurface : c.surface.primary,
          borderColor: selected ? c.interactive.primary : c.border.primary,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          {selected ? (
            <>
              <View style={{ 
                width: 28, 
                height: 28, 
                borderRadius: 14, 
                alignItems: 'center', 
                justifyContent: 'center', 
                backgroundColor: c.interactive.primary 
              }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: c.text.inverse }}>
                  {selected.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: c.text.primary }}>{selected.name}</Text>
                <Text style={{ fontSize: 12, color: c.text.muted }}>{selected.slug}</Text>
              </View>
            </>
          ) : (
            <>
              <View style={{ 
                width: 28, 
                height: 28, 
                borderRadius: 14, 
                alignItems: 'center', 
                justifyContent: 'center', 
                backgroundColor: c.surface.secondary 
              }}>
                <Text style={{ fontSize: 14, color: c.text.muted }}>🏢</Text>
              </View>
              <Text style={{ fontSize: 14, flex: 1, color: c.text.muted }}>
                {loading ? 'Loading tenants…' : 'Select tenant (optional)'}
              </Text>
            </>
          )}
        </View>
        <Text style={{ fontSize: 14, marginLeft: 8, color: selected ? c.interactive.primary : c.text.muted }}>
          {selected ? '✕' : '▼'}
        </Text>
      </Pressable>

      {selected && !disabled ? (
        <Pressable
          style={{ marginBottom: 12, marginTop: -8, alignSelf: 'flex-end' }}
          onPress={() => onChange('')}
        >
          <Text style={{ fontSize: 12, textDecorationLine: 'underline', color: c.text.muted }}>Clear selection</Text>
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
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={() => setOpen(false)}
        >
          {/* Sheet — stop propagation so tapping inside doesn't close */}
          <Pressable
            style={{ 
              borderTopLeftRadius: 24, 
              borderTopRightRadius: 24,
              maxHeight: '70%', 
              backgroundColor: c.surface.primary 
            }}
            onPress={() => {}}
          >
            {/* Handle bar */}
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: c.border.primary }} />
            </View>

            {/* Header */}
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              paddingHorizontal: 20, 
              paddingVertical: 12, 
              borderBottomWidth: 1, 
              borderColor: c.border.secondary 
            }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: c.text.primary }}>Select Tenant</Text>
              <Pressable
                style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: 16, 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: c.surface.secondary 
                }}
                onPress={() => setOpen(false)}
              >
                <Text style={{ fontSize: 16, color: c.text.secondary }}>✕</Text>
              </Pressable>
            </View>

            {/* Search */}
            <View style={{ 
              paddingHorizontal: 16, 
              paddingVertical: 12, 
              borderBottomWidth: 1, 
              borderColor: c.border.secondary 
            }}>
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                borderRadius: 12, 
                paddingHorizontal: 12, 
                paddingVertical: 8, 
                gap: 8, 
                backgroundColor: c.surface.secondary 
              }}>
                <Text style={{ color: c.text.muted }}>🔍</Text>
                <TextInput
                  style={{ flex: 1, fontSize: 14, color: c.text.primary }}
                  placeholder="Search tenants…"
                  placeholderTextColor={c.text.muted}
                  value={search}
                  onChangeText={setSearch}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {search.length > 0 && (
                  <Pressable onPress={() => setSearch('')}>
                    <Text style={{ fontSize: 14, color: c.text.muted }}>✕</Text>
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
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Text style={{ fontSize: 24, marginBottom: 8 }}>🔍</Text>
                  <Text style={{ fontSize: 14, color: c.text.muted }}>No tenants found</Text>
                </View>
              }
              renderItem={({ item }) => {
                const isSelected = item.slug === value;
                return (
                  <Pressable
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      paddingHorizontal: 20,
                      paddingVertical: 14,
                      borderBottomWidth: 1,
                      borderColor: c.border.secondary,
                      backgroundColor: isSelected ? c.intent.infoSurface : 'transparent',
                    }}
                    onPress={() => handleSelect(item.slug)}
                  >
                    {/* Avatar */}
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isSelected ? c.interactive.primary : c.surface.secondary,
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: 'bold',
                          fontSize: 14,
                          color: isSelected ? c.text.inverse : c.text.secondary,
                        }}
                      >
                        {item.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    {/* Info */}
                    <View style={{ flex: 1 }}>
                      <Text style={{ 
                        fontSize: 14, 
                        fontWeight: '600', 
                        color: isSelected ? c.interactive.primary : c.text.primary 
                      }}>
                        {item.name}
                      </Text>
                      <Text style={{ fontSize: 12, marginTop: 2, color: c.text.muted }}>{item.slug}</Text>
                    </View>

                    {/* Check */}
                    {isSelected && (
                      <View style={{ 
                        width: 24, 
                        height: 24, 
                        borderRadius: 12, 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        backgroundColor: c.interactive.primary 
                      }}>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: c.text.inverse }}>✓</Text>
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
    <View style={{ marginTop: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: c.border.primary }} />
        <Text style={{ fontSize: 12, fontWeight: '500', color: c.text.muted }}>Quick demo login</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: c.border.primary }} />
      </View>

      {tenantSlug && roles.length > 0 ? (
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
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
        style={{
          borderWidth: 1,
          borderRadius: 12,
          padding: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderColor: c.interactive.primary,
          backgroundColor: c.intent.infoSurface,
          opacity: loading ? 0.75 : 1,
        }}
        onPress={() => onDemoLogin('manager@company.com', 'shabanelmogy')}
        disabled={loading}
      >
        <View style={{ 
          width: 40, 
          height: 40, 
          borderRadius: 20, 
          alignItems: 'center', 
          justifyContent: 'center', 
          backgroundColor: c.interactive.primary 
        }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, color: c.text.inverse }}>SA</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: c.text.primary }}>System Administrator</Text>
          <Text style={{ fontSize: 12, color: c.text.secondary }}>manager@company.com</Text>
        </View>
        <View style={{ 
          borderRadius: 20, 
          paddingHorizontal: 8, 
          paddingVertical: 2, 
          backgroundColor: c.interactive.primary 
        }}>
          <Text style={{ fontSize: 12, fontWeight: 'bold', color: c.text.inverse }}>Admin</Text>
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

  const isDark = useIsDark();
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
        <View style={{ 
          position: 'absolute', 
          top: 12, 
          right: 16, 
          zIndex: 10, 
          flexDirection: 'row', 
          gap: 8 
        }}>
          {/* RTL toggle */}
          <Pressable
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: c.surface.elevated,
            }}
            onPress={toggleRtl}
            accessibilityLabel="Toggle RTL"
          >
            <Text style={{ 
              fontSize: 16, 
              fontWeight: 'bold', 
              color: c.text.primary 
            }}>
              {isRtl ? 'LTR' : 'RTL'}
            </Text>
          </Pressable>

          {/* Theme toggle */}
          <Pressable
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: c.surface.elevated,
            }}
            onPress={toggleColorMode}
            accessibilityLabel="Toggle theme"
          >
            <Text style={{ fontSize: 18 }}>{isDark ? '☀️' : '🌙'}</Text>
          </Pressable>
        </View>

        {/* Branding header */}
        <View style={{ 
          alignItems: 'center', 
          paddingTop: 32, 
          paddingBottom: 24, 
          paddingHorizontal: 24 
        }}>
          <View style={{ 
            width: 64, 
            height: 64, 
            borderRadius: 16, 
            alignItems: 'center', 
            justifyContent: 'center', 
            marginBottom: 16,
            backgroundColor: c.interactive.primary,
            shadowColor: c.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}>
            <Text style={{ fontSize: 32, color: c.text.inverse }}>🎫</Text>
          </View>
          <Text style={{ 
            fontSize: 32, 
            fontWeight: '800', 
            marginBottom: 4, 
            color: c.text.primary 
          }}>
            TicketFlow Pro
          </Text>
          <Text style={{ 
            fontSize: 14, 
            textAlign: 'center', 
            color: c.text.secondary 
          }}>
            Professional ticket management system
          </Text>

          {/* Feature pills */}
          <View style={{ 
            flexDirection: 'row', 
            gap: 8, 
            marginTop: 16, 
            flexWrap: 'wrap', 
            justifyContent: 'center' 
          }}>
            {['📊 Dashboard', '🗂️ Kanban', '🔔 Alerts'].map((f) => (
              <View
                key={f}
                style={{
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  backgroundColor: c.surface.elevated,
                }}
              >
                <Text style={{ 
                  fontSize: 12, 
                  fontWeight: '500', 
                  color: c.text.secondary 
                }}>{f}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Login card */}
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 32,
            borderRadius: 16,
            padding: 24,
            backgroundColor: c.surface.primary,
            shadowColor: c.shadow,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.12,
            shadowRadius: 32,
            elevation: 8,
          }}
        >
          {/* Welcome text */}
          <Text style={{ 
            fontSize: 12, 
            fontWeight: '600', 
            textTransform: 'uppercase', 
            letterSpacing: 1.2, 
            textAlign: 'center', 
            marginBottom: 4, 
            color: c.interactive.primary 
          }}>
            Welcome back
          </Text>
          <Text style={{ 
            fontSize: 24, 
            fontWeight: 'bold', 
            textAlign: 'center', 
            marginBottom: 4, 
            color: c.text.primary 
          }}>
            Sign in to TicketFlow
          </Text>
          <Text style={{ 
            fontSize: 14, 
            textAlign: 'center', 
            marginBottom: 20, 
            color: c.text.secondary 
          }}>
            Access your professional ticket management dashboard
          </Text>

          {/* System login toggle */}
          <Pressable
            style={{
              alignSelf: 'flex-start',
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 6,
              marginBottom: 16,
              borderWidth: 1,
              backgroundColor: isSystemLogin ? c.interactive.primary : 'transparent',
              borderColor: isSystemLogin ? c.interactive.primary : c.border.primary,
            }}
            onPress={() => setIsSystemLogin((v) => !v)}
            disabled={loading}
          >
            <Text style={{ 
              fontSize: 12, 
              fontWeight: '600', 
              color: isSystemLogin ? c.text.inverse : c.text.secondary 
            }}>
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
              style={{
                borderWidth: 1,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginBottom: 12,
                backgroundColor: c.intent.errorSurface,
                borderColor: c.intent.error,
              }}
            >
              <Text style={{ fontSize: 14, color: c.intent.error }}>{error}</Text>
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
