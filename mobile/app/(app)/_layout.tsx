import { Stack, Redirect } from 'expo-router';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/authStore';
import AppHeader, {
  DrawerProvider,
  AppDrawerOverlay,
  useDrawer,
} from '../../src/components/layout/AppHeader';
import AppBottomNav from '../../src/components/layout/AppBottomNav';

function AppShell() {
  const { setBottomNavHeight } = useDrawer();

  return (
    /**
     * SafeAreaView with edges={['top']} — only applies top safe area padding.
     * This is the ONLY place that handles the status bar inset.
     * It never moves because it is outside any KeyboardAvoidingView.
     *
     * With softwareKeyboardLayoutMode="adjustNothing":
     *   - The OS does NOT move the window at all when keyboard opens.
     *   - Each screen that needs keyboard handling uses its own KAV.
     *   - The header is completely immune to keyboard events.
     */
    <SafeAreaView
      style={{ flex: 1 }}
      edges={['top']}
    >
      {/* Header — always fixed, never affected by keyboard */}
      <AppHeader />

      {/* Content area — KAV here handles keyboard for ALL screens */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }} />
        </View>
      </KeyboardAvoidingView>

      {/* Bottom nav — outside KAV so it stays at the bottom */}
      <View onLayout={(e) => setBottomNavHeight(e.nativeEvent.layout.height)}>
        <AppBottomNav />
      </View>

      {/* Drawer overlay — absolute positioned, unaffected by keyboard */}
      <AppDrawerOverlay />
    </SafeAreaView>
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
