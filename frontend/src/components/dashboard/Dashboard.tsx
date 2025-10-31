import React from "react";
import { Box } from "@mui/material";
import Header from "./Header";
import { LoadingSpinner } from "./ui";
import { ViewRenderer } from "./components";
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
      <ViewRenderer
        currentView={currentView}
        setCurrentView={setCurrentView}
        dashboardProps={dashboardProps}
      />
    </Box>
  );
};

export default Dashboard;