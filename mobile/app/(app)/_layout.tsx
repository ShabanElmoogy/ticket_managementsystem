import { Stack, Redirect } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/stores/authStore';
import AppHeader, {
  DrawerProvider,
  AppDrawerOverlay,
  useDrawer,
} from '@/src/components/layout/AppHeader';
import AppBottomNav from '@/src/components/layout/AppBottomNav';

function AppShell() {
  const { setBottomNavHeight } = useDrawer();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
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
