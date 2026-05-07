import { Stack, Redirect, useRouter } from 'expo-router';
import { View, BackHandler, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useEffect } from 'react';
import { useAuthStore } from '@/src/stores/authStore';
import { useThemeColors } from '@/src/constants/theme';
import AppHeader, {
  DrawerProvider,
  AppDrawerOverlay,
  useDrawer,
} from '@/src/components/layout/AppHeader';
import AppBottomNav from '@/src/components/layout/AppBottomNav';

function AppShell() {
  const { setBottomNavHeight } = useDrawer();
  const insets = useSafeAreaInsets();
  const c      = useThemeColors();
  const router = useRouter();

  // ── Global Back Button Handling ─────────────────────────────────────────────
  useEffect(() => {
    const onBackPress = () => {
      // If we can go back in the navigation stack, let the system handle it
      if (router.canGoBack()) {
        return false;
      }

      // If we are at the very root of the app, confirm exit
      Alert.alert('Exit App', 'Are you sure you want to exit the application?', [
        { text: 'Cancel', style: 'cancel', onPress: () => null },
        { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [router]);

  return (
    <View style={{ flex: 1, backgroundColor: c.surface.primary }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <AppHeader />

        <View style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="admin" />
            <Stack.Screen name="tickets" />
            <Stack.Screen name="kanban" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="epics" />
            <Stack.Screen name="features" />
            <Stack.Screen name="documents" />
            <Stack.Screen name="programming" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="device-info" />
          </Stack>
        </View>

        <View onLayout={(e) => setBottomNavHeight(e.nativeEvent.layout.height)}>
          <AppBottomNav />
        </View>
      </SafeAreaView>

      {/* Drawer outside SafeAreaView — top: safeAreaTop + headerHeight */}
      <AppDrawerOverlay safeAreaTop={insets.top} />
    </View>
  );
}

export default function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Redirect href={'/(auth)/login' as any} />;
  return (
    <DrawerProvider>
      <AppShell />
    </DrawerProvider>
  );
}
