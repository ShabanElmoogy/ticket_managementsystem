import React, { useState, useCallback, createContext, useContext } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Platform,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../stores/authStore';
import { useUiStore } from '../../../stores/uiStore';
import { useDirection } from '../../../providers/DirectionProvider';

// ── Helpers ────────────────────────────────────────────────────────────────

const getInitials = (name: string) =>
  name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

const getRoleColor = (role?: string) => {
  if (role === 'TENANT_ADMIN' || role === 'SUPER_ADMIN') return '#ef4444';
  if (role === 'PROGRAMMER') return '#8b5cf6';
  return '#10b981';
};

// ── Drawer context — shared between AppHeader bar and AppDrawer overlay ────

interface DrawerCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
  headerHeight: number;
  setHeaderHeight: (h: number) => void;
  bottomNavHeight: number;
  setBottomNavHeight: (h: number) => void;
}
const DrawerContext = createContext<DrawerCtx>({
  open: false,
  setOpen: () => {},
  headerHeight: 0,
  setHeaderHeight: () => {},
  bottomNavHeight: 0,
  setBottomNavHeight: () => {},
});
export const useDrawer = () => useContext(DrawerContext);

// ── Nav items ──────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  icon: string;
  route: string;
  color?: string;
  roles?: string[];
  dividerBefore?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',        icon: '📊', route: '/(app)'             },
  { label: 'Tickets',          icon: '🎫', route: '/(app)/tickets'     },
  { label: 'Kanban Board',     icon: '🗂️', route: '/(app)/kanban'      },
  { label: 'Epics',            icon: '🌳', route: '/(app)/epics'       },
  { label: 'Feature Requests', icon: '💡', route: '/(app)/features'    },
  { label: 'Documents',        icon: '📄', route: '/(app)/documents',   roles: ['TENANT_ADMIN', 'EMPLOYEE', 'PROGRAMMER'] },
  { label: 'Programming',      icon: '💻', route: '/(app)/programming', roles: ['PROGRAMMER', 'TENANT_ADMIN', 'SUPER_ADMIN'] },
  { label: 'Admin Panel',      icon: '⚙️', route: '/(app)/admin',      roles: ['TENANT_ADMIN', 'SUPER_ADMIN'] },
  { label: 'Profile',          icon: '👤', route: '/(app)/profile',    dividerBefore: true },
  { label: 'Logout',           icon: '🚪', route: '__logout__',        color: '#ef4444', dividerBefore: true },
];

// ── DrawerProvider — wraps the whole layout ────────────────────────────────

export const DrawerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen]                   = useState(false);
  const [headerHeight, setHeaderHeight]   = useState(0);
  const [bottomNavHeight, setBottomNavHeight] = useState(0);
  return (
    <DrawerContext.Provider value={{ open, setOpen, headerHeight, setHeaderHeight, bottomNavHeight, setBottomNavHeight }}>
      {children}
    </DrawerContext.Provider>
  );
};

// ── AppDrawerOverlay — rendered at layout root level ──────────────────────

export const AppDrawerOverlay: React.FC = () => {
  const { open, setOpen, headerHeight, bottomNavHeight } = useDrawer();
  const { user, logout }                                    = useAuthStore();
  const { colorMode, toggleColorMode, setDirection }        = useUiStore();
  const { isRtl }                                           = useDirection();
  const router                                              = useRouter();

  if (!open || !user) return null;

  const isDark   = colorMode === 'dark';
  const drawerBg = isDark ? '#1e293b' : '#6366f1';

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user.role ?? '')
  );

  const handleNav = (route: string) => {
    setOpen(false);
    if (route === '__logout__') { logout(); return; }
    router.push(route as any);
  };

  return (
    <View
      style={{
        position: 'absolute',
        top: headerHeight,        // starts exactly below header
        bottom: bottomNavHeight,  // stops exactly above bottom nav
        left: 0,
        right: 0,
        zIndex: 999,
      }}
      pointerEvents="box-none"
    >
      {/* Full-screen backdrop */}
      <Pressable
        style={{
          position: 'absolute',
          top: 0, bottom: 0, left: 0, right: 0,
          backgroundColor: 'rgba(0,0,0,0.45)',
        }}
        onPress={() => setOpen(false)}
      />

      {/* Drawer panel — always opens from right, content direction follows isRtl */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: 288,
          backgroundColor: drawerBg,
          right: 0,
          direction: isRtl ? 'rtl' : 'ltr',
        }}
      >
        {/* User card */}
        <View
          style={{
            paddingTop: 16,
            paddingHorizontal: 16,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(255,255,255,0.1)',
          }}
        >
          {/* Row direction inherited from parent direction style */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: getRoleColor(user.role), alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{getInitials(user.name)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>{user.name}</Text>
              <View style={{ alignSelf: 'flex-start', backgroundColor: `${getRoleColor(user.role)}44`, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2, marginTop: 2 }}>
                <Text style={{ color: '#fff', fontSize: 11 }}>{user.role}</Text>
              </View>
            </View>
          </View>

          {/* Theme + RTL toggles */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, paddingVertical: 8 }}
              onPress={toggleColorMode}
            >
              <Text>{isDark ? '☀️' : '🌙'}</Text>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '500' }}>{isDark ? 'Light' : 'Dark'}</Text>
            </Pressable>
            <Pressable
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, paddingVertical: 8 }}
              onPress={() => setDirection(isRtl ? 'ltr' : 'rtl')}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{isRtl ? '← LTR' : 'RTL →'}</Text>
            </Pressable>
          </View>
        </View>

        {/* Nav list — direction inherited, items flow RTL automatically */}
        <ScrollView style={{ flex: 1 }}>
          {visibleItems.map((item) => (
            <React.Fragment key={item.label}>
              {item.dividerBefore && (
                <View style={{ marginHorizontal: 16, marginVertical: 4, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />
              )}
              <Pressable
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}
                onPress={() => handleNav(item.route)}
              >
                <Text style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{item.icon}</Text>
                <Text style={{ fontSize: 14, fontWeight: '500', flex: 1, color: item.color ?? '#fff' }}>
                  {item.label}
                </Text>
              </Pressable>
            </React.Fragment>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

// ── AppHeader bar ──────────────────────────────────────────────────────────

const AppHeader: React.FC = () => {
  const { user }                                            = useAuthStore();
  const { colorMode, unreadCount }                          = useUiStore();
  const { open, setOpen, setHeaderHeight }                  = useDrawer();
  const router                                              = useRouter();
  const insets                                              = useSafeAreaInsets();

  if (!user) return null;

  const isDark   = colorMode === 'dark';
  const headerBg = isDark ? '#1e293b' : '#6366f1';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: insets.top + 8,
        paddingBottom: 12,
        paddingHorizontal: 16,
        backgroundColor: headerBg,
        gap: 8,
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
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '500' }} numberOfLines={1}>
            {user.name.split(' ')[0]}
          </Text>
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

export default AppHeader;
