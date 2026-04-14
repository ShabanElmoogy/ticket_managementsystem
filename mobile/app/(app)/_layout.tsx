import { Stack, Redirect } from 'expo-router';
import { View } from 'react-native';
import { useAuthStore } from '../../src/stores/authStore';
import AppHeader, {
  DrawerProvider,
  AppDrawerOverlay,
  useDrawer,
} from '../../src/shared/components/layout/AppHeader';
import AppBottomNav from '../../src/shared/components/layout/AppBottomNav';

// Inner component so it can access DrawerContext
function AppShell() {
  const { setBottomNavHeight } = useDrawer();

  return (
    <View style={{ flex: 1 }}>
      {/* Header — reports its height to context */}
      <AppHeader />

      {/* Screen content */}
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>

      {/* Bottom nav — reports its height to context */}
      <View onLayout={(e) => setBottomNavHeight(e.nativeEvent.layout.height)}>
        <AppBottomNav />
      </View>

      {/* Drawer overlay — sits between header and bottom nav exactly */}
      <AppDrawerOverlay />
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
