import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/stores/authStore';
import { useUiStore } from '@/src/stores/uiStore';
import { useThemeColors, FontWeight } from '@/src/constants/theme';
import { useDrawer } from '@/src/components/layout/header/DrawerContext';
import { getRoleColor } from '@/src/components/layout/header/navItems';
import { Avatar, IconButton } from '@/src/shared/components';

const AppHeaderBar: React.FC = () => {
  const { user } = useAuthStore();
  const { unreadCount } = useUiStore();
  const { open, setOpen, setHeaderHeight } = useDrawer();
  const router = useRouter();
  const c = useThemeColors();

  if (!user) return null;

  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center',
        paddingTop: 8, paddingBottom: 12, paddingHorizontal: 16,
        backgroundColor: c.surface.header, gap: 8,
      }}
      onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
    >
      {/* Logo */}
      <Pressable
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}
        onPress={() => router.push('/(app)' as any)}
      >
        <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: c.text.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 16 }}>🎫</Text>
        </View>
        <Text style={{ color: c.text.primary, fontWeight: FontWeight.bold, fontSize: 18 }}>TicketFlow</Text>
      </Pressable>

      {/* Right actions */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {/* Notification bell */}
        <IconButton
          icon="🔔"
          badgeCount={unreadCount}
          onPress={() => router.push('/(app)/notifications' as any)}
        />

        {/* User avatar */}
        <Pressable
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 }}
          onPress={() => router.push('/(app)/profile' as any)}
        >
          <Avatar
            text={user.name}
            backgroundColor={getRoleColor(user.role)}
            size={28}
          />
        </Pressable>

        {/* Hamburger */}
        <IconButton
          icon={open ? '✕' : '☰'}
          iconSize={18}
          onPress={() => setOpen(!open)}
        />
      </View>
    </View>
  );
};

export default AppHeaderBar;
