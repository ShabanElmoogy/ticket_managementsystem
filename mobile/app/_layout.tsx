import '../global.css';
// react-native-gesture-handler must be imported first on native only
import { Platform, LogBox } from 'react-native';

// Suppress Expo Go SDK 53 push notification warning — expected in Expo Go, not a crash
LogBox.ignoreLogs(['expo-notifications: Android Push notifications']);
if (Platform.OS !== 'web') {
  require('react-native-gesture-handler');
}

import { useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useColorScheme } from 'react-native';
import { useAuthStore } from '@/src/stores/authStore';
import { initI18n } from '@/src/i18n';
import { DirectionProvider } from '@/src/providers/DirectionProvider';
import { ThemeProvider as AppThemeProvider } from '@/src/providers/ThemeProvider';
import { tokenManager } from '@/src/services/api/tokenManager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetworkErrorDialog from '@/src/components/NetworkErrorDialog';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/src/shared/components/feedback/AppToast';
import { networkEvents } from '@/src/services/api/networkEvents';
import { useTenantStore } from '@/src/stores/tenantStore';
import { usePaginationStore } from '@/src/stores/paginationStore';
import { API } from '@/src/constants/api';
import { http } from '@/src/services/api/httpClient';
import { notificationService, useNotificationStore } from '@/src/features/notifications';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 2 },
  },
});

export const unstable_settings = { anchor: '(app)' };

async function syncPaginationSettings() {
  try {
    const res = await http.get(API.TENANTS.PAGINATION_SETTINGS);
    usePaginationStore.getState().setSettings(res.data);
    if (__DEV__) console.log('📄 Pagination settings synced:', res.data.paginationMode);
  } catch {
    // Keep stored/default settings on failure
  }
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Start watching network connectivity for offline retry queue
    networkEvents.startWatching();

    return () => {
      networkEvents.stopWatching();
    };
  }, []);

  useEffect(() => {
    async function bootstrap() {      // 1. Init i18n
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

      // 5. Sync tenant dateFormat from API (non-blocking — uses stored value if fails)
      if (useAuthStore.getState().isAuthenticated) {
        useTenantStore.getState().syncDateFormat();
        // 6. Sync pagination settings (non-blocking)
        syncPaginationSettings().catch(() => {});
        // 7. Initialize push notifications (non-blocking — never delays app render)
        notificationService.initialize().catch(() => {});
      }

      // Routes render now with correct auth state
      setReady(true);
      // Signal navigation stack is ready for deferred deep-link navigation
      useNotificationStore.getState().setNavigationReady(true);
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
    <GestureHandlerRootView style={{ flex: 1 }}>
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
              <NetworkErrorDialog />
            </ThemeProvider>
          </DirectionProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
      {/* Toast must be last — renders above all other UI including modals */}
      <Toast config={toastConfig} />
    </GestureHandlerRootView>
  );
}
