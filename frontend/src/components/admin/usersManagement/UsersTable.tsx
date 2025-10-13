import React from "react";
import { Box, Chip, Typography } from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  GridActionsCellItem,
  type GridRowParams,
} from "@mui/x-data-grid";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Phone as PhoneIcon,
  WhatsApp as WhatsAppIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import type { User } from "../../../services/api";

export interface UsersTableProps {
  users: User[];
  loading: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

const UsersTable: React.FC<UsersTableProps> = ({ users, loading, onEdit, onDelete }) => {
  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 150 },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 200 },
    {
      field: 'role',
      headerName: 'Role',
      width: 120,
      renderCell: (params) => (
        <Chip
          icon={params.value === 'ADMIN' ? <AdminIcon /> : <PersonIcon />}
          label={params.value}
          color={params.value === 'ADMIN' ? 'primary' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {params.value ? (
            <>
              <PhoneIcon fontSize="small" color="action" />
              {params.value}
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">-</Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'whatsappNotifications',
      headerName: 'WhatsApp',
      width: 100,
      renderCell: (params) => (
        <Chip
          icon={<WhatsAppIcon />}
          label={params.value ? 'ON' : 'OFF'}
          color={params.value ? 'success' : 'default'}
          size="small"
          variant={params.value ? 'filled' : 'outlined'}
        />
      ),
    },
    { field: 'assignedTickets', headerName: 'Assigned', width: 100, renderCell: (p) => p.row._count?.assignedTickets || 0 },
    { field: 'createdTickets', headerName: 'Created', width: 100, renderCell: (p) => p.row._count?.createdTickets || 0 },
    { field: 'comments', headerName: 'Comments', width: 100, renderCell: (p) => p.row._count?.comments || 0 },
    { field: 'createdAt', headerName: 'Created', width: 120, renderCell: (p) => format(new Date(p.value), 'MMM dd, yyyy') },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
      getActions: (params: GridRowParams) => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Edit"
          onClick={() => onEdit(params.row as User)}
          showInMenu={false}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => onDelete(params.row as User)}
          showInMenu={false}
        />,
      ],
    },
  ];

  return (
    <Box sx={{ height: 600, width: '100%' }}>
      <DataGrid
        rows={users}
        columns={columns}
        loading={loading}
        pageSizeOptions={[10, 25, 50]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        disableRowSelectionOnClick
      />
    </Box>
  );
};

export default UsersTable;
