import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import AdminDashboardScreen from './dashboard/AdminDashboardScreen';
import CustomersScreen     from './customers/CustomersScreen';
import ApplicationsScreen  from './applications/ApplicationsScreen';
import UsersScreen         from './users/UsersScreen';
import TicketsScreen       from './tickets/TicketsScreen';
import TemplatesScreen     from './templates/TemplatesScreen';
import TenantsScreen       from './tenants/TenantsScreen';
import SettingsScreen      from './settings/SettingsScreen';
import DocsScreen          from './docs/DocsScreen';

// ── Menu config ───────────────────────────────────────────────────────────────

interface MenuItem { id: string; label: string; icon: string; roles?: string[] }

const MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard',    label: 'Dashboard',    icon: '📊' },
  { id: 'tickets',      label: 'Tickets',      icon: '🎫' },
  { id: 'customers',    label: 'Customers',    icon: '👥' },
  { id: 'applications', label: 'Applications', icon: '📱' },
  { id: 'users',        label: 'Users',        icon: '👤' },
  { id: 'templates',    label: 'Templates',    icon: '📋' },
  { id: 'docs',         label: 'Docs',         icon: '📚' },
  { id: 'tenants',      label: 'Tenants',      icon: '🏢', roles: ['SUPER_ADMIN'] },
  { id: 'settings',     label: 'Settings',     icon: '⚙️' },
];

// ── Admin Panel ───────────────────────────────────────────────────────────────

const AdminPanel: React.FC = () => {
  const { user }      = useAuthStore();
  const { colorMode } = useUiStore();
  const isDark        = colorMode === 'dark';
  const [selected, setSelected] = useState('dashboard');

  const visibleItems = MENU_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user?.role ?? '')
  );

  const renderContent = () => {
    switch (selected) {
      case 'dashboard':    return <AdminDashboardScreen />;
      case 'tickets':      return <TicketsScreen />;
      case 'customers':    return <CustomersScreen />;
      case 'applications': return <ApplicationsScreen />;
      case 'users':        return <UsersScreen />;
      case 'templates':    return <TemplatesScreen />;
      case 'docs':         return <DocsScreen />;
      case 'tenants':      return <TenantsScreen />;
      case 'settings':     return <SettingsScreen />;
      default:             return <AdminDashboardScreen />;
    }
  };

  return (
    <View className={`flex-1 ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* Horizontal scrollable tab bar */}
      <View className={`border-b ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 8, gap: 4 }}
        >
          {visibleItems.map((item) => {
            const isActive = selected === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setSelected(item.id)}
                className={`flex-row items-center gap-1.5 px-3 py-2 rounded-lg ${
                  isActive ? 'bg-blue-600' : isDark ? 'bg-slate-700' : 'bg-gray-100'
                }`}
              >
                <Text style={{ fontSize: 14 }}>{item.icon}</Text>
                <Text className={`text-xs font-semibold ${
                  isActive ? 'text-white' : isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Active screen */}
      <View className="flex-1">{renderContent()}</View>
    </View>
  );
};

export default AdminPanel;
