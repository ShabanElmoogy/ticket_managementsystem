import React from "react";
import { Box, Toolbar } from "@mui/material";
import Header from "./Header";
import { LoadingSpinner } from "./ui";
import { DashboardContent } from "./components";
import TicketReminder from "./components/TicketReminder";
import { useDashboard } from "./hooks";

const Dashboard: React.FC = () => {
  const dashboardProps = useDashboard();
  const { loading, tickets, handleTicketClick } = dashboardProps;

  if (loading && tickets.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Header onTicketClick={handleTicketClick} />
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64, md: 70 } }} />
      <DashboardContent {...dashboardProps} onAddComment={dashboardProps.handleAddComment} onCreateTicket={dashboardProps.handleCreateTicket} onRefresh={dashboardProps.fetchData} onTicketClick={dashboardProps.handleTicketClick} onTakeTicket={dashboardProps.handleTakeTicket} onUpdateStatus={dashboardProps.handleUpdateTicketStatus} />
      <TicketReminder onTicketClick={handleTicketClick} />
    </Box>
  );
};

export default Dashboard;