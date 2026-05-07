import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/src/stores/authStore';
import { useNotificationStore } from '@/src/features/notifications/stores/notificationStore';
import { useUiStore } from '@/src/stores/uiStore';
import { useThemeColors, FontWeight } from '@/src/constants/theme';
import { useDrawer } from '@/src/components/layout/header/DrawerContext';
import { Avatar, IconButton } from '@/src/shared/components';

// All header backgrounds are dark/saturated across every palette + mode.
// White icons and a subtle white-tinted button bg work universally.
const BTN_BG    = 'rgba(255,255,255,0.15)';
const AVATAR_BG = 'rgba(255,255,255,0.22)';
const WHITE     = '#ffffff';

const AppHeaderBar: React.FC = () => {
  const { user }                           = useAuthStore();
  const notifUnread                        = useNotificationStore((s) => s.unreadCount);
  const activityUnread                     = useUiStore((s) => s.unreadCount);
  const { open, setOpen, setHeaderHeight } = useDrawer();
  const router                             = useRouter();
  const pathname                           = usePathname();
  const c                                  = useThemeColors();
  const { t }                              = useTranslation();

  if (!user) return null;

  const isDashboard = pathname === '/' || pathname === '/index' || pathname === '/(app)';
  // On dashboard show activity feed unread count, elsewhere show notification count
  const bellCount = isDashboard ? activityUnread : notifUnread;
  const handleBellPress = () => {
    if (isDashboard) {
      router.push('/(app)/activity-feed' as any);
    } else {
      router.push('/(app)/notifications' as any);
    }
  };

  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center',
        paddingTop: 8, paddingBottom: 12, paddingHorizontal: 16,
        backgroundColor: c.surface.header, gap: 8,
      }}
      onLayout={(e: { nativeEvent: { layout: { height: number } } }) =>
        setHeaderHeight(e.nativeEvent.layout.height)
      }
    >
      {/* Logo */}
      <Pressable
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}
        onPress={() => router.push('/(app)' as any)}
      >
        <View style={{
          width: 32, height: 32, borderRadius: 8,
          backgroundColor: BTN_BG,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name="ticket-outline" size={18} color={WHITE} />
        </View>
        <Text style={{ color: WHITE, fontWeight: FontWeight.bold, fontSize: 18, letterSpacing: 0.3 }}>
          TicketFlow
        </Text>
      </Pressable>

      {/* Right actions */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>

        {/* Notification bell */}
        <IconButton
          icon="notifications-outline"
          accessibilityLabel={t('nav.notifications')}
          badgeCount={bellCount}
          iconColor={WHITE}
          backgroundColor={BTN_BG}
          onPress={handleBellPress}
        />

        {/* User avatar */}
        <Pressable
          style={{ borderRadius: 20 }}
          onPress={() => router.push('/(app)/profile' as any)}
        >
          <Avatar
            text={user.name}
            backgroundColor={AVATAR_BG}
            textColor={WHITE}
            size={34}
          />
        </Pressable>

        {/* Hamburger / close */}
        <IconButton
          icon={open ? 'close-outline' : 'menu-outline'}
          accessibilityLabel={open ? t('common.close') : t('nav.menu')}
          iconSize={22}
          iconColor={WHITE}
          backgroundColor={BTN_BG}
          onPress={() => setOpen(!open)}
        />
      </View>
    </View>
  );
};

export default AppHeaderBar;
