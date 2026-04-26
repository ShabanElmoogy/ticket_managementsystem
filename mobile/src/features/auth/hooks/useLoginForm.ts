import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '@/src/features/auth/api/auth';
import { tenantsPublicApi, type PublicTenant } from '@/src/features/auth/api/tenants';
import { tokenManager } from '@/src/services/api/tokenManager';
import { useAuthStore } from '@/src/stores/authStore';
import { useTenantStore, type DateFormatValue } from '@/src/stores/tenantStore';
import { useUiStore } from '@/src/stores/uiStore';

export const useLoginForm = () => {
  const [tenantSlug, setTenantSlug]       = useState('');
  const [isSystemLogin, setIsSystemLogin] = useState(false);
  const [tenants, setTenants]             = useState<PublicTenant[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [showPassword, setShowPassword]   = useState(false);
  const [error, setError]                 = useState('');
  const [loading, setLoading]             = useState(false);

  const { login }         = useAuthStore();
  const { setDateFormat } = useTenantStore();
  const { colorMode, toggleColorMode, direction, setDirection } = useUiStore();

  // Load public tenants on mount
  useEffect(() => {
    setTenantsLoading(true);
    tenantsPublicApi.listPublic()
      .then((data) => setTenants(Array.isArray(data) ? data : []))
      .catch(() => setTenants([]))
      .finally(() => setTenantsLoading(false));
  }, []);

  const handleTenantChange = (slug: string) => {
    setTenantSlug(slug);
    const found = tenants.find((t) => t.slug === slug);
    if (found?.adminEmail) setEmail(found.adminEmail);
  };

  const handleSubmit = async () => {
    if (!email) {
      setError('Email is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const normalizedTenant = tenantSlug.trim().toLowerCase();

      if (isSystemLogin) {
        await AsyncStorage.removeItem('tenantSlug');
        tokenManager.setTenantSlug(null);
      } else if (normalizedTenant) {
        await AsyncStorage.setItem('tenantSlug', normalizedTenant);
        tokenManager.setTenantSlug(normalizedTenant);
      } else {
        await AsyncStorage.removeItem('tenantSlug');
        tokenManager.setTenantSlug(null);
      }

      // Use devLogin — no password required
      const response = await authApi.devLogin(email, normalizedTenant || undefined)
        .catch(() => authApi.loginWithTenant({ email, password }, normalizedTenant));

      const responseTenantSlug =
        (response as any)?.tenant?.slug ?? (response as any)?.user?.tenantSlug;
      if (responseTenantSlug) {
        await AsyncStorage.setItem('tenantSlug', String(responseTenantSlug));
        tokenManager.setTenantSlug(String(responseTenantSlug));
      }

      const dateFormat = (response as any)?.tenant?.dateFormat as DateFormatValue | undefined;
      if (dateFormat) setDateFormat(dateFormat);

      login(
        response.user,
        response.token,
        response.refreshToken,
        !!(response as any).tenantSuspended,
        (response as any).tenantStatus ?? null,
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.error ??
        err?.message ??
        'Login failed. Please check your credentials.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (
    demoEmail: string,
    demoPassword: string,
    options?: { tenantSlug?: string | null },
  ) => {
    const demoTenant = (options?.tenantSlug ?? '').trim().toLowerCase();
    setIsSystemLogin(!demoTenant);
    setTenantSlug(demoTenant);
    setEmail(demoEmail);
    setLoading(true);
    setError('');

    if (demoTenant) {
      await AsyncStorage.setItem('tenantSlug', demoTenant);
      tokenManager.setTenantSlug(demoTenant);
    } else {
      await AsyncStorage.removeItem('tenantSlug');
      tokenManager.setTenantSlug(null);
    }

    try {
      const response = await authApi
        .devLogin(demoEmail, demoTenant || undefined)
        .catch(async () => {
          // devLogin disabled in production — fall back to real login
          if (demoTenant) {
            return authApi.loginWithTenant({ email: demoEmail, password: demoPassword }, demoTenant);
          }
          return authApi.login({ email: demoEmail, password: demoPassword });
        });

      const responseTenantSlug =
        (response as any)?.tenant?.slug ?? (response as any)?.user?.tenantSlug;
      if (responseTenantSlug) {
        await AsyncStorage.setItem('tenantSlug', String(responseTenantSlug));
        tokenManager.setTenantSlug(String(responseTenantSlug));
      }

      const dateFormat = (response as any)?.tenant?.dateFormat as DateFormatValue | undefined;
      if (dateFormat) setDateFormat(dateFormat);

      login(
        response.user,
        response.token,
        response.refreshToken,
        !!(response as any).tenantSuspended,
        (response as any).tenantStatus ?? null,
      );
    } catch (err: any) {
      setError(err?.response?.data?.error ?? err?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return {
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
  };
};
