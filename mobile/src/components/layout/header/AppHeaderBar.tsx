import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/src/stores/authStore';
import { useUiStore } from '@/src/stores/uiStore';
import { useThemeColors, FontWeight, Palette } from '@/src/constants/theme';
import { useDrawer } from '@/src/components/layout/header/DrawerContext';
import { Avatar, IconButton } from '@/src/shared/components';

const AppHeaderBar: React.FC = () => {
  const { user }                           = useAuthStore();
  const { unreadCount }                    = useUiStore();
  const { open, setOpen, setHeaderHeight } = useDrawer();
  const router                             = useRouter();
  const c                                  = useThemeColors();
  const { t }                              = useTranslation();

  if (!user) return null;

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
          width: 32,
          height: 32, 
          borderRadius: 8,
          backgroundColor: c.text.primary,
          alignItems: 'center', 
          justifyContent: 'center',
        }}>
          <Ionicons name="ticket-outline" size={18} color={c.text.inverse} />
        </View>
        <Text style={{ color: Palette.white, fontWeight: FontWeight.bold, fontSize: 18, letterSpacing: 0.3 }}>
          TicketFlow
        </Text>
      </Pressable>

      {/* Right actions */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {/* Notification bell */}
        <IconButton
          icon="notifications-outline"
          accessibilityLabel={t('nav.notifications')}
          badgeCount={unreadCount}
          iconColor={c.text.primary}
          backgroundColor="rgba(255,255,255,0.15)"
          onPress={() => router.push('/(app)/notifications' as any)}
        />

        {/* User avatar */}
        <Pressable
          style={{
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: 12, paddingHorizontal: 8, paddingVertical: 6,
          }}
          onPress={() => router.push('/(app)/profile' as any)}
        >
        <Avatar
            text={user.name}
            backgroundColor="rgba(255,255,255,0.25)"
            textColor={Palette.white}
            size={28}
          />
        </Pressable>

        {/* Hamburger / close */}
        <IconButton
          icon={open ? 'close-outline' : 'menu-outline'}
          accessibilityLabel={open ? t('common.close') : t('nav.menu')}
          iconSize={22}
          iconColor={c.text.primary}
          backgroundColor="rgba(255,255,255,0.15)"
          onPress={() => setOpen(!open)}
        />
      </View>
    </View>
  );
};

export default AppHeaderBar;
