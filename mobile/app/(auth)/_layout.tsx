import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, Redirect, useSegments } from 'expo-router';
import { useAuthStore } from '@/src/stores/authStore';
import { useOnboardingStore } from '@/src/features/onboarding/store/onboardingStore';
import { useThemeColors } from '@/src/constants/theme';

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { isCompleted, isLoading, checkCompleted } = useOnboardingStore();
  const c = useThemeColors();
  const segments = useSegments();

  useEffect(() => {
    checkCompleted();
  }, []);

  // Already logged in — send to app
  if (isAuthenticated) return <Redirect href={'/(app)' as any} />;

  // Still reading the AsyncStorage flag — show a loading indicator
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.surface.primary }}>
        <ActivityIndicator size="large" color={c.interactive.primary} />
      </View>
    );
  }

  // Onboarding not yet completed — redirect to onboarding flow.
  // Guard: only redirect if we are NOT already on the onboarding screen,
  // otherwise the layout re-renders on every navigation to /(auth)/onboarding
  // and causes an infinite redirect loop.
  const isOnOnboarding = segments[segments.length - 1] === 'onboarding';
  if (!isCompleted && !isOnOnboarding) {
    return <Redirect href={'/(auth)/onboarding' as any} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
