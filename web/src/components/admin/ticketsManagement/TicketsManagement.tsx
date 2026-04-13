import React from 'react';
import { Box, Alert, Snackbar } from '@mui/material';
import DeleteConfirmDialog from '../../../shared/components/dialogs/AppDeleteDialog';
import CreateTicketDialog from '../../tickets/CreateTicketDialog';
import { TicketsTable } from '.';
import useTicketsManagement from './hooks/useTicketsManagement';
import MyGridHeader from '../../../shared/components/layout/AppGridHeader';
import BookOnlineIcon from '@mui/icons-material/BookOnline';

const TicketsManagement: React.FC = () => {
  const {
    tickets,
    users,
    loading,

    dialogOpen,
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
        employees={users.filter((u) => u.role === 'EMPLOYEE')}
      />

      <DeleteConfirmDialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        itemName={deleteDialog.ticket?.title}
        itemType="ticket"
        loading={deleteDialog.loading}
      />

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TicketsManagement;
