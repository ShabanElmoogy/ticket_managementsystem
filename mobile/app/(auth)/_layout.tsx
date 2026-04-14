import { Stack } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { Redirect } from 'expo-router';

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Already logged in — send to app
  if (isAuthenticated) return <Redirect href={'/(app)' as any} />;

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
