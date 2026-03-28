import type { GridColDef } from "@mui/x-data-grid";
import { Chip, Tooltip, Box } from "@mui/material";
import { Warning as WarningIcon } from "@mui/icons-material";
import { CountChip, buildActionsColumn } from "../../../common";
import type { Customer } from "../../../../services/api";
import ApplicationsCell from "./ApplicationsCell";
import { getCustomerStatus, daysUntilExpiry, MAINTENANCE_LABELS, STATUS_CONFIG } from "../../../../utils/subscriptionUtils";

export const getCustomersColumns = (handlers: {
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}): GridColDef[] => {
  const { onEdit, onDelete } = handlers;

  return [
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      minWidth: 200,
      headerAlign: "left",
      align: "left",
    },
    {
      field: "email",
      headerName: "Email",
      align: "center",
      headerAlign: "center",
      width: 250,
    },
    {
      field: "phone",
      headerName: "Phone",
      align: "center",
      headerAlign: "center",
      width: 150,
      renderCell: (params) => params.value || "-",
    },
    {
      field: "maintenanceType",
      headerName: "Maintenance",
      align: "center",
      headerAlign: "center",
      width: 180,
      renderCell: (params) =>
        params.value ? (
          <Chip label={MAINTENANCE_LABELS[params.value]} size="small" variant="outlined" color="primary" />
        ) : ("-"),
    },
    {
      field: "subscriptionStatus",
      headerName: "Status",
      align: "center",
      headerAlign: "center",
      width: 160,
      valueGetter: (_value: unknown, row: Customer) => getCustomerStatus(row),
      renderCell: (params) => {
        const status = params.value as string;
        const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['INACTIVE'];
        const days = daysUntilExpiry(params.row as Customer);
        const expiringSoon = days !== null && days >= 0 && days <= 7;
        return (
          <Box display="flex" alignItems="center" justifyContent="center" width="100%" height="100%" gap={0.5}>
            <Chip label={cfg.label} color={cfg.color} size="small" />
            {expiringSoon && (
              <Tooltip title={`Expires in ${days} day${days === 1 ? '' : 's'}`}>
                <WarningIcon sx={{ fontSize: 16, color: 'warning.main' }} />
              </Tooltip>
            )}
          </Box>
        );
      },
    },
    {
      field: "subscriptionEndDate",
      headerName: "Expires",
      align: "center",
      headerAlign: "center",
      width: 120,
      renderCell: (params) =>
        params.value ? new Date(params.value).toLocaleDateString('en-GB') : "-",
    },
    {
      field: "applications",
      headerName: "Applications",
      align: "center",
      headerAlign: "center",
      width: 250,
      renderCell: (params) => <ApplicationsCell apps={params.row.applications} />,
    },
    {
      field: "ticketCount",
      headerName: "Tickets",
      width: 100,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <CountChip count={params.row._count?.tickets || 0} color="primary" />
      ),
    },
    {
      field: "createdAt",
      headerName: "Created",
      align: "center",
      headerAlign: "center",
      width: 120,
      renderCell: (params) => new Date(params.value).toLocaleDateString('en-GB'),
    },
    buildActionsColumn<Customer>({
      headerName: "Actions",
      width: 120,
      onEdit,
      onDelete,
    }),
  ];
};

export default getCustomersColumns;
