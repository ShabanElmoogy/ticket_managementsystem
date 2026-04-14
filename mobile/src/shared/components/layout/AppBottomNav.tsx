import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useUiStore } from '../../../stores/uiStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TabItem {
  label: string;
  icon: string;
  activeIcon: string;
  route: string;
  match: string; // pathname prefix to detect active
}

const TABS: TabItem[] = [
  { label: 'Dashboard', icon: '📊', activeIcon: '📊', route: '/(app)',         match: '/(app)'         },
  { label: 'Tickets',   icon: '🎫', activeIcon: '🎫', route: '/(app)/tickets', match: '/(app)/tickets' },
  { label: 'Kanban',    icon: '🗂️', activeIcon: '🗂️', route: '/(app)/kanban',  match: '/(app)/kanban'  },
  { label: 'Profile',   icon: '👤', activeIcon: '👤', route: '/(app)/profile', match: '/(app)/profile' },
];

const AppBottomNav: React.FC = () => {
  const router   = useRouter();
  const pathname = usePathname();
  const { colorMode } = useUiStore();
  const insets = useSafeAreaInsets();
  const isDark = colorMode === 'dark';

  return (
    <View
      className={`flex-row border-t ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}
      style={{ paddingBottom: insets.bottom + 4, paddingTop: 8 }}
    >
      {TABS.map((tab) => {
        const isActive =
          tab.match === '/(app)'
            ? pathname === '/' || pathname === '/(app)'
            : pathname.startsWith(tab.match);

        return (
          <Pressable
            key={tab.route}
            className="flex-1 items-center justify-center gap-0.5"
            onPress={() => router.push(tab.route as any)}
          >
            <Text className={`text-2xl ${isActive ? 'opacity-100' : 'opacity-40'}`}>
              {isActive ? tab.activeIcon : tab.icon}
            </Text>
            <Text
              className={`text-xs font-medium ${
                isActive
                  ? 'text-blue-600'
                  : isDark ? 'text-gray-500' : 'text-gray-400'
              }`}
            >
              {tab.label}
            </Text>
            {isActive && (
              <View className="absolute top-0 left-1/2 w-6 h-0.5 bg-blue-600 rounded-full"
                style={{ marginLeft: -12 }}
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

export default AppBottomNav;
