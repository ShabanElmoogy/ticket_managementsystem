import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import ApplicationsScreen from '@/src/features/admin/applications/ApplicationsScreen';
import CustomersScreen from '@/src/features/admin/customers/CustomersScreen';
import AdminDashboardScreen from '@/src/features/admin/dashboard/AdminDashboardScreen';
import DocsScreen from '@/src/features/admin/docs/DocsScreen';
import ReportsScreen from '@/src/features/admin/reports/ReportsScreen';
import SettingsScreen from '@/src/features/admin/settings/SettingsScreen';
import TemplatesScreen from '@/src/features/admin/templates/TemplatesScreen';
import TenantsScreen from '@/src/features/admin/tenants/TenantsScreen';
import TicketsScreen from '@/src/features/admin/tickets/TicketsScreen';
import UsersScreen from '@/src/features/admin/users/UsersScreen';
import { useAuthStore } from '@/src/stores/authStore';
import { useUiStore } from '@/src/stores/uiStore';

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
  { id: 'reports',      label: 'Reports',      icon: '📊' },
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
      case 'reports':      return <ReportsScreen />;
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
