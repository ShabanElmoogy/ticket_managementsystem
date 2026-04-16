import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../stores/authStore';
import { useUiStore } from '../../../stores/uiStore';
import { useDrawer } from './DrawerContext';
import { getInitials, getRoleColor } from './navItems';

const AppHeaderBar: React.FC = () => {
  const { user }                       = useAuthStore();
  const { colorMode, unreadCount }     = useUiStore();
  const { open, setOpen, setHeaderHeight } = useDrawer();
  const router                         = useRouter();
  const insets                         = useSafeAreaInsets();

  if (!user) return null;

  const isDark   = colorMode === 'dark';
  const headerBg = isDark ? '#1e293b' : '#6366f1';

  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center',
        paddingTop: insets.top + 8, paddingBottom: 12, paddingHorizontal: 16,
        backgroundColor: headerBg, gap: 8,
      }}
      onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
    >
      {/* Logo */}
      <Pressable
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}
        onPress={() => router.push('/(app)' as any)}
      >
        <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 16 }}>🎫</Text>
        </View>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 18 }}>TicketFlow</Text>
      </Pressable>

      {/* Right actions */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {/* Notification bell */}
        <Pressable
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}
          onPress={() => router.push('/(app)/notifications' as any)}
        >
          <Text style={{ fontSize: 16 }}>🔔</Text>
          {unreadCount > 0 && (
            <View style={{ position: 'absolute', top: -2, right: -2, width: 16, height: 16, borderRadius: 8, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </Pressable>

        {/* User avatar */}
        <Pressable
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 }}
          onPress={() => router.push('/(app)/profile' as any)}
        >
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: getRoleColor(user.role), alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 11 }}>{getInitials(user.name)}</Text>
          </View>
        </Pressable>

        {/* Hamburger */}
        <Pressable
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}
          onPress={() => setOpen(!open)}
        >
          <Text style={{ color: '#fff', fontSize: 18 }}>{open ? '✕' : '☰'}</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default AppHeaderBar;
