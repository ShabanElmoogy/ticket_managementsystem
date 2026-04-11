import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { useThemeStore } from '../../../stores/themeStore';
import { authApi, tenantsApi, type Tenant } from '../../../services/api';

export const useLoginForm = () => {
  const [tenantSlug, setTenantSlug] = useState('');
  const [isSystemLogin, setIsSystemLogin] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);
  const { login } = useAuthStore();
  const { mode, toggleTheme } = useThemeStore();

  useEffect(() => {
    setTenantsLoading(true);
    tenantsApi.listPublic()
      .then((data) => setTenants(Array.isArray(data) ? data : []))
      .catch(() => setTenants([]))
      .finally(() => setTenantsLoading(false));
  }, []);

  const handleTenantChange = (slug: string) => {
    setTenantSlug(slug);
    const found = tenants.find((t) => t.slug === slug);
    if (found?.adminEmail) setEmail(found.adminEmail);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const normalizedTenant = tenantSlug.trim().toLowerCase();
      if (isSystemLogin) {
        localStorage.removeItem('tenantSlug');
      } else if (normalizedTenant) {
        localStorage.setItem('tenantSlug', normalizedTenant);
      } else {
        localStorage.removeItem('tenantSlug');
      }

      const response = await authApi.login({ email, password });
      const responseTenantSlug = (response as any)?.tenant?.slug || (response as any)?.user?.tenantSlug;
      if (responseTenantSlug) localStorage.setItem('tenantSlug', String(responseTenantSlug));

      login(response.user, response.token, response.refreshToken,
        !!(response as any).tenantSuspended,
        (response as any).tenantStatus ?? null);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (
    demoEmail: string,
    _demoPassword: string,
    options?: { tenantSlug?: string | null }
  ) => {
    const demoTenant = (options?.tenantSlug ?? '').trim().toLowerCase();
    setIsSystemLogin(!demoTenant);
    setTenantSlug(demoTenant);
    setEmail(demoEmail);
    setLoading(true);
    setError('');

    if (!demoTenant) {
      localStorage.removeItem('tenantSlug');
    } else {
      localStorage.setItem('tenantSlug', demoTenant);
    }
    sessionStorage.setItem('skipTenantHeader', demoTenant ? 'false' : 'true');

    try {
      const response = await authApi.devLogin(demoEmail, demoTenant || undefined).catch(async () => {
        // devLogin is disabled in production — fall back to real login with password
        if (demoTenant) {
          return authApi.loginWithTenant({ email: demoEmail, password: _demoPassword }, demoTenant);
        }
        return authApi.login({ email: demoEmail, password: _demoPassword });
      });
      const responseTenantSlug = (response as any)?.tenant?.slug || (response as any)?.user?.tenantSlug;
      if (responseTenantSlug) localStorage.setItem('tenantSlug', String(responseTenantSlug));

      login(response.user, response.token, response.refreshToken,
        !!(response as any).tenantSuspended,
        (response as any).tenantStatus ?? null);
      sessionStorage.removeItem('skipTenantHeader');
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Login failed');
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
    snack, setSnack,
    isSystemLogin, setIsSystemLogin,
    tenantSlug,
    tenants,
    tenantsLoading,
    mode,    toggleTheme,
    handleTenantChange,
    handleSubmit,
    handleDemoLogin,
  };
};
