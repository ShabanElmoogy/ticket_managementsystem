import React, { useState } from "react";
import { Box, useTheme, useMediaQuery } from "@mui/material";
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Apps as AppsIcon,
  ConfirmationNumber as TicketIcon,
  Assignment as TaskIcon,
  SupervisorAccount as UsersIcon,
  BarChart as ReportsIcon,
} from "@mui/icons-material";
import { useAuthStore } from "../../stores/authStore";
import CustomersManagement from "./components/CustomersManagement";
import ApplicationsPageWithHOC from "./components/ApplicationsPageWithHOC";
import TicketsManagement from "./components/TicketsManagement";
import TasksManagement from "./components/TasksManagement";
import UserManagement from "./components/UserManagement";
import AdminDashboard from "./components/AdminDashboard";
import ReportsManagement from "./components/ReportsManagement";
import AdminTopBar from "./layout/AdminTopBar";
import AdminSidebar from "./layout/AdminSidebar";
import NotesIcon from "@mui/icons-material/Notes";
import DocsManagement from "./docs/DocsManagement";

const drawerWidth = 240;

interface AdminPanelProps {
  onBackToDashboard: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onBackToDashboard }) => {
  const { user } = useAuthStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [selectedView, setSelectedView] = useState("dashboard");

  const handleMobileDrawerToggle = () => setMobileOpen((v) => !v);
  const handleDesktopDrawerToggle = () => setDesktopOpen((v) => !v);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: <DashboardIcon /> },
    { id: "users", label: "Users", icon: <UsersIcon /> },
    { id: "customers", label: "Customers", icon: <PeopleIcon /> },
    { id: "applications", label: "Applications", icon: <AppsIcon /> },
    { id: "tickets", label: "Tickets", icon: <TicketIcon /> },
    { id: "tasks", label: "Tasks", icon: <TaskIcon /> },
    { id: "reports", label: "Reports", icon: <ReportsIcon /> },
    { id: "docs", label: "Docs", icon: <NotesIcon /> },
  ];

  const renderContent = () => {
    switch (selectedView) {
      case "users":
        return <UserManagement />;
      case "customers":
        return <CustomersManagement />;
      case "applications":
        return <ApplicationsPageWithHOC />;
      case "tickets":
        return <TicketsManagement />;
      case "tasks":
        return <TasksManagement />;
      case "reports":
        return <ReportsManagement />;
      case "docs":
        return <DocsManagement />;
      default:
        return <AdminDashboard />;
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
          mt:10,
          width: { md: desktopOpen ? `calc(100% - ${drawerWidth}px)` : "100%" },
        }}
      >
        {renderContent()}
      </Box>
    </Box>
  );
};

export default AdminPanel;
