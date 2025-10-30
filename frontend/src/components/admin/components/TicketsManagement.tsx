import React from "react";
import { Box, Alert, Snackbar, Button } from "@mui/material";
import DeleteConfirmDialog from "../../common/DeleteConfirmDialog";
import CreateTicketDialog from "../../tickets/CreateTicketDialog";
import { TicketsTable } from "../ticketsManagement";
import useTicketsManagement from "../ticketsManagement/hooks/useTicketsManagement";
import MyGridHeader from "../../common/MyGridHeader";
import BookOnlineIcon from "@mui/icons-material/BookOnline";

const TicketsManagement: React.FC = () => {
  const {
    tickets,
    users,
    loading,

    dialogOpen,
    editingTicket,

    snackbar,
    deleteDialog,

    handleOpenDialog,
    handleCloseDialog,
    handleCreateSubmit,

    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,

    handleSnackbarClose,
  } = useTicketsManagement();

  return (
    <Box>
      <MyGridHeader
        title="Tickets Management"
        onAdd={handleOpenDialog}
        addButtonText="Add Ticket"
        addTooltip="Add Ticket"
        icon={BookOnlineIcon}
      />

      <TicketsTable
        tickets={tickets}
        loading={loading}
        onEdit={() => handleOpenDialog()}
        onDelete={(t) => handleDeleteClick(t)}
      />

      <CreateTicketDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleCreateSubmit}
        employees={users.filter((u) => u.role === "EMPLOYEE")}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        itemName={deleteDialog.ticket?.title}
        itemType="ticket"
        loading={deleteDialog.loading}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TicketsManagement;
