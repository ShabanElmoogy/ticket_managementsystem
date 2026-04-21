import '../global.css';

import { useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { useAuthStore } from '@/src/stores/authStore';
import { initI18n } from '@/src/i18n';
import { DirectionProvider } from '@/src/providers/DirectionProvider';
import { tokenManager } from '@/src/services/api/tokenManager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetworkErrorDialog from '@/src/components/NetworkErrorDialog';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 2 },
  },
});

export const unstable_settings = { anchor: '(tabs)' };

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      // 1. Init i18n
      await initI18n();

      // 2. Wait for Zustand persist to finish reading AsyncStorage.
      await new Promise<void>((resolve) => {
        if (!useAuthStore.getState().isLoading) {
          resolve();
          return;
        }
        const unsub = useAuthStore.subscribe((state) => {
          if (!state.isLoading) {
            unsub();
            resolve();
          }
        });
        useAuthStore.persist.rehydrate();
      });

      // 3. initializeAuth syncs tokenManager + starts refresh cycle
      await useAuthStore.getState().initializeAuth();

      // 4. Restore tenant slug
      const tenantSlug = await AsyncStorage.getItem('tenantSlug');
      if (tenantSlug) {
        tokenManager.setTenantSlug(tenantSlug);
        if (__DEV__) console.log('🏢 tenantSlug restored:', tenantSlug);
      }

      // 4. Routes render now with correct auth state
      setReady(true);
    }

    bootstrap();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <DirectionProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(app)"  options={{ headerShown: false }} />
            </Stack>
            <StatusBar style="auto" />
            {/* Global network error dialog — mounted once, listens to all API errors */}
            <NetworkErrorDialog />
          </ThemeProvider>
        </DirectionProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
