import React, { useState, useEffect } from "react";
import { Box, Alert, Snackbar } from "@mui/material";
import { useAuthStore } from "../../stores/authStore";
import {
  apiService,
  type Ticket,
  type User,
  type CreateTicketData,
} from "../../services/api";
import DeleteConfirmDialog from "../common/DeleteConfirmDialog";
import CreateTicketDialog from "../tickets/CreateTicketDialog";
import TicketsTable from "./ticketsManagement/TicketsTable";
import AdminGridHeader from "../common/AdminGridHeader";

const TicketsManagement: React.FC = () => {
  const { token } = useAuthStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    ticket: null as Ticket | null,
    loading: false,
  });

  const fetchData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const [ticketsData, usersData] = await Promise.all([
        apiService.getTickets(token, {}),
        apiService.getUsers(token),
      ]);
      setTickets(ticketsData);
      setUsers(usersData);
    } catch (error) {
      showSnackbar("Error fetching data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleCreateSubmit = async (data: CreateTicketData) => {
    if (!token) return;
    try {
      await apiService.createTicket(token, data);
      showSnackbar("Ticket created successfully", "success");
      handleCloseDialog();
      fetchData();
    } catch (error) {
      showSnackbar(
        error instanceof Error ? error.message : "Error creating ticket",
        "error"
      );
    }
  };

  const handleDeleteClick = (ticket: Ticket) => {
    setDeleteDialog({
      open: true,
      ticket,
      loading: false,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!token || !deleteDialog.ticket) return;

    setDeleteDialog((prev) => ({ ...prev, loading: true }));

    try {
      await apiService.deleteTicket(token, deleteDialog.ticket.id);
      showSnackbar("Ticket deleted successfully", "success");
      setDeleteDialog({ open: false, ticket: null, loading: false });
      fetchData();
    } catch (error) {
      showSnackbar(
        error instanceof Error ? error.message : "Error deleting ticket",
        "error"
      );
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, ticket: null, loading: false });
  };

  return (
    <Box>
      <AdminGridHeader
        title="Tickets Management"
        onAdd={handleOpenDialog}
        addLabel="Add Ticket"
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
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TicketsManagement;
