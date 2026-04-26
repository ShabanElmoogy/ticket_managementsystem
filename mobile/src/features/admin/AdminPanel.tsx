import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';
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
import { FeatureErrorBoundary } from '@/src/shared/components/feedback/ErrorBoundary';
import { useAuthStore } from '@/src/stores/authStore';

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

function AdminPanel() {
  const { user } = useAuthStore();
  const c = useThemeColors();
  const [selected, setSelected] = React.useState('dashboard');

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

  const containerStyle = { flex: 1, backgroundColor: c.surface.secondary };
  const tabBarStyle = { 
    borderBottomWidth: 1, 
    borderBottomColor: c.border.primary,
    backgroundColor: c.surface.primary 
  };

  return (
    <View style={containerStyle}>
      {/* Horizontal scrollable tab bar */}
      <View style={tabBarStyle}>
        <ScrollView
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 8, gap: 4 }}
        >
          {visibleItems.map((item) => {
            const isActive = selected === item.id;
            const tabButtonStyle = {
              flexDirection: 'row' as const,
              alignItems: 'center' as const,
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: isActive ? c.interactive.primary : c.surface.elevated,
            };
            const iconStyle = { fontSize: 14 };
            const labelStyle = {
              fontSize: 12,
              fontWeight: '600' as const,
              color: isActive ? c.text.inverse : c.text.secondary,
            };
            
            return (
              <Pressable
                key={item.id}
                onPress={() => setSelected(item.id)}
                style={tabButtonStyle}
              >
                <Text style={iconStyle}>{item.icon}</Text>
                <Text style={labelStyle}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Active screen */}
      <View style={{ flex: 1 }}>{renderContent()}</View>
    </View>
  );
}

export default AdminPanel;
