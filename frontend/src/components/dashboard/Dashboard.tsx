import React from "react";
import { Box, Toolbar } from "@mui/material";
import Header from "./Header";
import { LoadingSpinner } from "./ui";
import { ViewRenderer } from "./components";
import TicketReminder from "./components/TicketReminder";
import { useDashboard } from "./hooks";

const Dashboard: React.FC = () => {
  const dashboardProps = useDashboard();
  const { loading, tickets, currentView, setCurrentView, handleTicketClick } = dashboardProps;

  if (loading && tickets.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Header
        onOpenAdminPanel={() => setCurrentView('admin')}
        onOpenKanban={() => setCurrentView('kanban')}
        onTicketClick={handleTicketClick}
      />
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64, md: 70 } }} />
      <ViewRenderer
        currentView={currentView}
        setCurrentView={setCurrentView}
        dashboardProps={dashboardProps}
      />
      <TicketReminder onTicketClick={handleTicketClick} />
    </Box>
  );
};

export default Dashboard;