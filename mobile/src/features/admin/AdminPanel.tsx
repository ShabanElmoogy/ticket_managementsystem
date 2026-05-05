import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, Radius, FontSize, FontWeight } from '@/src/constants/theme';
import { useUiStore } from '@/src/stores/uiStore';
import { Palette } from '@/src/constants/tokens';
import ApplicationsScreen  from '@/src/features/admin/applications/ApplicationsScreen';
import CustomersScreen     from '@/src/features/admin/customers/CustomersScreen';
import AdminDashboardScreen from '@/src/features/admin/dashboard/AdminDashboardScreen';
import DocsScreen          from '@/src/features/admin/docs/DocsScreen';
import ReportsScreen       from '@/src/features/admin/reports/ReportsScreen';
import SettingsScreen      from '@/src/features/admin/settings/SettingsScreen';
import TemplatesScreen     from '@/src/features/admin/templates/TemplatesScreen';
import TenantsScreen       from '@/src/features/admin/tenants/TenantsScreen';
import TicketsScreen       from '@/src/features/admin/tickets/TicketsScreen';
import UsersScreen         from '@/src/features/admin/users/UsersScreen';
import { useTranslation } from 'react-i18next';
import { useAuthStore }    from '@/src/stores/authStore';
import type { IoniconName } from '@/src/components/layout/header/navItems';

// ── Menu config ───────────────────────────────────────────────────────────────

interface MenuItem {
  id:      string;
  icon:    IoniconName;
  color:   string;
  roles?:  string[];
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard',    icon: 'grid',               color: Palette.blue500    },
  { id: 'tickets',      icon: 'ticket',             color: Palette.violet500  },
  { id: 'customers',    icon: 'people',             color: Palette.blue500    },
  { id: 'applications', icon: 'phone-portrait',     color: Palette.violet500  },
  { id: 'users',        icon: 'person',             color: Palette.blue500    },
  { id: 'templates',    icon: 'document-text',      color: Palette.violet500   },
  { id: 'docs',         icon: 'library',            color: Palette.blue500 },
  { id: 'reports',      icon: 'bar-chart',          color: Palette.violet500  },
  { id: 'tenants',      icon: 'business',           color: Palette.blue500,   roles: ['SUPER_ADMIN'] },
  { id: 'settings',     icon: 'settings',           color: Palette.violet500   },
];

// ── Admin Panel ───────────────────────────────────────────────────────────────

function AdminPanel() {
  const { user }    = useAuthStore();
  const c           = useThemeColors();
  const { t }       = useTranslation();
  const paletteOption = useUiStore((s) => s.paletteOption);
  const [selected, setSelected] = React.useState('dashboard');

  // Blue palette: use per-item colors for a colorful multi-hue look.
  // Orange / Green / Black / White palettes: use c.tint so the active tab always matches the palette.
  const useItemColors = paletteOption === 'blue';

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
    <View style={[styles.container, { backgroundColor: c.surface.secondary }]}>
      {/* Horizontal scrollable tab bar */}
      <View style={[styles.tabBar, { borderBottomColor: c.border.primary, backgroundColor: c.surface.primary }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
        >
          {visibleItems.map((item) => {
            const isActive    = selected === item.id;
            const activeColor = useItemColors ? item.color : c.tint;

            return (
              <Pressable
                key={item.id}
                onPress={() => setSelected(item.id)}
                style={[
                  styles.tabBtn,
                  {
                    backgroundColor:   isActive ? activeColor + '18' : 'transparent',
                    borderBottomWidth: isActive ? 2 : 0,
                    borderBottomColor: isActive ? activeColor : 'transparent',
                  },
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
              >
                <Ionicons
                  name={item.icon}
                  size={16}
                  color={isActive ? activeColor : c.text.secondary}
                />
                <Text style={[
                  styles.tabLabel,
                  {
                    color:      isActive ? activeColor : c.text.secondary,
                    fontWeight: isActive ? FontWeight.semibold : FontWeight.normal,
                  },
                ]}>
                  {t(`nav.${item.id}`)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Active screen */}
      <View style={styles.content}>{renderContent()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    borderBottomWidth: 1,
  },
  tabScroll: {
    paddingHorizontal: 8,
    paddingTop:        8,
    gap:               2,
  },
  tabBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            6,
    paddingHorizontal: 12,
    paddingVertical:   9,
    borderRadius:   Radius.md,
    marginBottom:   4,
  },
  tabLabel: {
    fontSize: FontSize.sm,
  },
  content: {
    flex: 1,
  },
});

export default AdminPanel;
