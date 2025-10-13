import React from 'react';
import { Dialog, DialogTitle } from '@mui/material';
import type { User, CreateTicketData } from '../../services/api';
import CreateTicketForm from './CreateTicketForm';

interface CreateTicketDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTicketData) => void;
  employees: User[];
}

const CreateTicketDialog: React.FC<CreateTicketDialogProps> = ({
  open,
  onClose,
  onSubmit,
  employees,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Ticketssss</DialogTitle>
      <CreateTicketForm
        open={open}
        employees={employees}
        onSubmit={onSubmit}
        onCancel={onClose}
      />
    </Dialog>
  );
};

export default CreateTicketDialog;