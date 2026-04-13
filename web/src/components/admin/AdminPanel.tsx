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
  Label as TemplateIcon,
} from "@mui/icons-material";
import { useAuthStore } from "../../stores/authStore";
import { isSuperAdmin } from "../../types/roles";
import { useTenantSuspended, useTenantStatus } from "../../stores";
import CustomersManagement from "./02components/CustomersManagement";
import ApplicationsManagement from "./02components/ApplicationsManagement";
import TicketsManagement from "./02components/TicketsManagement";
import TasksManagement from "./02components/TasksManagement";
import UsersManagement from "./02components/UsersManagement";
import AdminDashboard from "./02components/AdminDashboard";
import ReportsManagement from "./02components/ReportsManagement";
import AdminTopBar from "./01layout/AdminTopBar";
import AdminSidebar from "./01layout/AdminSidebar";
import NotesIcon from "@mui/icons-material/Notes";
import DocsManagement from "./docs/DocsManagement";
import TenantsManagement from './02components/TenantsManagement';
import AdminSettings from './02components/AdminSettings';
import TemplatesManagement from './templatesManagement/TemplatesManagement';

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
        { id: "tickets",      label: "Tickets",      icon: <TicketIcon />,      disabled: fullyBlocked },
        { id: "templates",    label: "Templates",    icon: <TemplateIcon />,    disabled: fullyBlocked },
        { id: "tasks",        label: "Tasks",        icon: <TaskIcon />,        disabled: fullyBlocked },
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
      case "tenants":      return <TenantsManagement />;
      case "users":        return <UsersManagement />;
      case "settings":     return <AdminSettings />;
      case "customers":    return <CustomersManagement />;
      case "applications": return <ApplicationsManagement />;
      case "tickets":   return <TicketsManagement />;
      case "templates":  return <TemplatesManagement />;
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
          // Shift content right by the drawer width on desktop when open.
          // transition matches MUI Drawer's default slide animation.
          ml: { md: desktopOpen ? `${drawerWidth}px` : 0 },
          width: { md: desktopOpen ? `calc(100% - ${drawerWidth}px)` : '100%' },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: desktopOpen
              ? theme.transitions.easing.easeOut
              : theme.transitions.easing.sharp,
            duration: desktopOpen
              ? theme.transitions.duration.enteringScreen
              : theme.transitions.duration.leavingScreen,
          }),
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        {renderContent()}
      </Box>
    </Box>
  );
};

export default AdminPanel;
