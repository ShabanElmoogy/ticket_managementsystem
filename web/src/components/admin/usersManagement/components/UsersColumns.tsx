import { CountChip, buildActionsColumn } from "../../../../shared/components";
import type { GridColDef } from "@mui/x-data-grid";
import { formatDate } from "../../../../shared/utils/dateUtils";
import { Chip, Box, Typography, IconButton, Tooltip } from "@mui/material";
import {
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  LockReset as LockResetIcon,
} from "@mui/icons-material";
import type { User } from "../../../../services/api";

export const getUsersColumns = (handlers: {
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onResetPassword?: (user: User) => void;
}): GridColDef[] => {
  const { onEdit, onDelete, onResetPassword } = handlers;

  return [
    { field: "name", headerName: "Name", flex: 1, minWidth: 200, headerAlign: "left", align: "left" },
    { field: "email", headerName: "Email", headerAlign: "center", align: "center", width: 240, renderCell: (params) => params.value || "-" },
    {
      field: "tenantName",
      headerName: "Tenant",
      width: 160,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => params.value ?? "—",
    },
    {
      field: "role",
      headerName: "Role",
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Chip
          icon={params.value === "TENANT_ADMIN" ? <AdminIcon /> : <PersonIcon />}
          label={params.value}
          color={params.value === "TENANT_ADMIN" ? "primary" : "default"}
          size="small"
        />
      ),
    },
    {
      field: "phone",
      headerName: "Phone",
      headerAlign: "center",
      align: "center",
      width: 160,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {params.value ? (
            <><PhoneIcon fontSize="small" color="action" />{params.value}</>
          ) : (
            <Typography variant="body2" color="text.secondary">-</Typography>
          )}
        </Box>
      ),
    },
    {
      field: "assignedTickets",
      headerName: "Assigned",
      width: 110,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <CountChip count={params.row._count?.assignedTickets || 0} color="primary" />,
    },
    {
      field: "createdTickets",
      headerName: "Created",
      width: 110,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <CountChip count={params.row._count?.createdTickets || 0} color="primary" />,
    },
    {
      field: "comments",
      headerName: "Comments",
      width: 110,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <CountChip count={params.row._count?.comments || 0} color="success" />,
    },
    {
      field: "createdAt",
      headerName: "Created",
      headerAlign: "center",
      align: "center",
      width: 130,
      renderCell: (params) => params.value ? formatDate(params.value) : '—',
    },
    ...(onResetPassword
      ? [{
          field: "_resetPwd",
          headerName: "Password",
          width: 90,
          align: "center" as const,
          headerAlign: "center" as const,
          sortable: false,
          renderCell: (params: any) => (
            <Tooltip title="Reset Password">
              <IconButton size="small" onClick={() => onResetPassword(params.row)}>
                <LockResetIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ),
        }]
      : []),
    buildActionsColumn<User>({ headerName: "Actions", width: 140, onEdit, onDelete }),
  ];
};

export default getUsersColumns;
