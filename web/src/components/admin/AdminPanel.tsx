import React, { useState } from "react";
import { Box, useTheme, useMediaQuery, Alert } from "@mui/material";
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Apps as AppsIcon,
  ConfirmationNumber as TicketIcon,
  Assignment as TaskIcon,
  BarChart as ReportsIcon,
  SupervisorAccount as UsersIcon,
  Apartment as TenantsIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { useAuthStore } from "../../stores/authStore";
import { isSuperAdmin } from "../../types/roles";
import { useTenantSuspended, useTenantStatus } from "../../stores";
import CustomersManagement from "./02components/CustomersManagement";
import ApplicationsPageWithHOC from "./02components/ApplicationsPageWithHOC";
import TicketsManagement from "./02components/TicketsManagement";
import TasksManagement from "./02components/TasksManagement";
import UserManagement from "./02components/UserManagement";
import AdminDashboard from "./02components/AdminDashboard";
import ReportsManagement from "./02components/ReportsManagement";
import AdminTopBar from "./01layout/AdminTopBar";
import AdminSidebar from "./01layout/AdminSidebar";
import NotesIcon from "@mui/icons-material/Notes";
import DocsManagement from "./docs/DocsManagement";
import TenantsPageWithHOC from './02components/TenantsPageWithHOC';
import AdminSettings from './02components/AdminSettings';

const drawerWidth = 240;

interface AdminPanelProps {
  onBackToDashboard: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onBackToDashboard }) => {
  const { user } = useAuthStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSuperAdminUser = isSuperAdmin(user?.role);
  const suspended = useTenantSuspended();
  const tenantStatus = useTenantStatus();
  // SUSPENDED = fully blocked (no view, no actions)
  // PAST_DUE / EXPIRED = read-only (can view, actions disabled via useAdminReadonly)
  const fullyBlocked = tenantStatus === 'SUSPENDED';
  const readOnly = suspended && !fullyBlocked; // PAST_DUE or EXPIRED

  // Items that make API calls which fail when tenant is suspended
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [selectedView, setSelectedView] = useState(
    isSuperAdminUser ? 'tenants' : 'dashboard'
  );

  const handleMobileDrawerToggle = () => setMobileOpen((v) => !v);
  const handleDesktopDrawerToggle = () => setDesktopOpen((v) => !v);

  const menuItems = isSuperAdminUser
    ? [
        { id: "tenants",  label: "Tenants",  icon: <TenantsIcon /> },
        { id: "users",    label: "Users",    icon: <UsersIcon /> },
        { id: "settings", label: "Settings", icon: <SettingsIcon /> },
      ]
    : [
        { id: "dashboard",    label: "Dashboard",    icon: <DashboardIcon />,  disabled: fullyBlocked },
        { id: "users",        label: "Users",        icon: <UsersIcon />,      disabled: fullyBlocked },
        { id: "customers",    label: "Customers",    icon: <PeopleIcon />,     disabled: fullyBlocked },
        { id: "applications", label: "Applications", icon: <AppsIcon />,       disabled: fullyBlocked },
        { id: "tickets",      label: "Tickets",      icon: <TicketIcon />,     disabled: fullyBlocked },
        { id: "tasks",        label: "Tasks",        icon: <TaskIcon />,       disabled: fullyBlocked },
        { id: "reports",  label: "Reports",  icon: <ReportsIcon />,  disabled: fullyBlocked },
        { id: "docs",     label: "Docs",     icon: <NotesIcon />,    disabled: fullyBlocked },
        { id: "settings", label: "Settings", icon: <SettingsIcon />, disabled: fullyBlocked },
      ];

  const renderContent = () => {
    if (fullyBlocked) {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          Your account is suspended. All admin actions are disabled. Contact your administrator to reactivate.
        </Alert>
      );
    }
    if (readOnly) {
      return renderView();
    }
    return renderView();
  };

  const renderView = () => {
    switch (selectedView) {
      case "tenants":   return <TenantsPageWithHOC />;
      case "users":     return <UserManagement />;
      case "settings":  return <AdminSettings />;
      case "customers": return <CustomersManagement />;
      case "applications": return <ApplicationsPageWithHOC />;
      case "tickets":   return <TicketsManagement />;
      case "tasks":     return <TasksManagement />;
      case "reports":   return <ReportsManagement />;
      case "docs":      return <DocsManagement />;
      default:          return <AdminDashboard />;
    }
  };

  const title = menuItems.find((item) => item.id === selectedView)?.label || "Admin Panel";

  return (
    <Box sx={{ display: "flex" }}>
      <AdminTopBar
        title={title}
        userEmail={user?.email}
        drawerWidth={drawerWidth}
        desktopOpen={desktopOpen}
        onMobileToggle={handleMobileDrawerToggle}
        onDesktopToggle={handleDesktopDrawerToggle}
        onHome={onBackToDashboard}
      />

      <AdminSidebar
        drawerWidth={drawerWidth}
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        desktopOpen={desktopOpen}
        items={menuItems}
        selectedId={selectedView}
        onSelect={(id) => setSelectedView(id)}
        onMobileClose={() => setMobileOpen(false)}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 10,
          width: { md: desktopOpen ? `calc(100% - ${drawerWidth}px)` : "100%" },
        }}
      >
        {renderContent()}
      </Box>
    </Box>
  );
};

export default AdminPanel;
