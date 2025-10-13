import { CountChip, buildActionsColumn } from "../../../common";
import type { GridColDef } from "@mui/x-data-grid";
import { Chip, Box, Typography } from "@mui/material";
import { AdminPanelSettings as AdminIcon, Person as PersonIcon, Phone as PhoneIcon, WhatsApp as WhatsAppIcon } from "@mui/icons-material";
import type { User } from "../../../../services/api";

// Columns factory
export const getUsersColumns = (handlers: {
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}): GridColDef[] => {
  const { onEdit, onDelete } = handlers;

  return [
    {
      field: "name",
      headerName: "Name",
      width: 200,
    },
    {
      field: "email",
      headerName: "Email",
      width: 240,
      renderCell: (params) => params.value || "-",
    },
    {
      field: "role",
      headerName: "Role",
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Chip
          icon={params.value === "ADMIN" ? <AdminIcon /> : <PersonIcon />}
          label={params.value}
          color={params.value === "ADMIN" ? "primary" : "default"}
          size="small"
        />
      ),
    },
    {
      field: "phone",
      headerName: "Phone",
      width: 160,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
      field: "whatsappNotifications",
      headerName: "WhatsApp",
      width: 110,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Chip
          icon={<WhatsAppIcon />}
          label={params.value ? "ON" : "OFF"}
          color={params.value ? "success" : "default"}
          size="small"
          variant={params.value ? "filled" : "outlined"}
        />
      ),
    },
    {
      field: "assignedTickets",
      headerName: "Assigned",
      width: 110,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <CountChip count={params.row._count?.assignedTickets || 0} color="primary" />
      ),
    },
    {
      field: "createdTickets",
      headerName: "Created",
      width: 110,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <CountChip count={params.row._count?.createdTickets || 0} color="primary" />
      ),
    },
    {
      field: "comments",
      headerName: "Comments",
      width: 110,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <CountChip count={params.row._count?.comments || 0} color="success" />
      ),
    },
    {
      field: "createdAt",
      headerName: "Created",
      width: 130,
      renderCell: (params) => new Date(params.value).toLocaleDateString(),
    },
    buildActionsColumn<User>({ headerName: "Actions", width: 140, onEdit, onDelete }),
  ];
};

export default getUsersColumns;
