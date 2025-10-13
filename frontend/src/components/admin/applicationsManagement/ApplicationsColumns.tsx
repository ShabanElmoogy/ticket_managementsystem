import React from "react";
import { Box, Chip, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { buildActionsColumn } from "../../common/AdminDataGrid";
import type { Application, CustomerApplication } from "../../../services/api";

// Small presentational cells
export const VersionCell: React.FC<{ value?: string | null }> = ({ value }) => (
  <Chip label={value || "N/A"} size="small" color="info" variant="outlined" />
);

export const CustomersCell: React.FC<{ customers?: CustomerApplication[] }>= ({ customers }) => {
  if (!customers || customers.length === 0) return <Typography variant="body2">-</Typography>;
  return (
    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", py: 1 }}>
      {customers.map((ca) => (
        <Chip
          key={ca.customerId}
          label={ca.customer?.name}
          size="small"
          color="secondary"
          variant="outlined"
        />
      ))}
    </Box>
  );
};

export const CountChip: React.FC<{ count: number; color?: "primary" | "success" }>= ({ count, color = "primary" }) => (
  <Chip label={count} size="small" color={color} />
);

export const StatusCell: React.FC<{ active?: boolean }>= ({ active }) => (
  <Chip label={active ? "Active" : "Inactive"} color={active ? "success" : "default"} size="small" />
);

// Columns factory
export const getApplicationsColumns = (handlers: {
  onEdit: (app: Application) => void;
  onDelete: (app: Application) => void;
}): GridColDef[] => {
  const { onEdit, onDelete } = handlers;

  return [
    {
      field: "name",
      headerName: "Name",
      width: 200,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "description",
      headerName: "Description",
      width: 250,
      renderCell: (params) => params.value || "-",
    },
    {
      field: "version",
      headerName: "Version",
      width: 120,
      renderCell: (params) => <VersionCell value={params.value} />,
    },
    {
      field: "customers",
      headerName: "Customers",
      width: 300,
      renderCell: (params) => <CustomersCell customers={params.row.customers} />,
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
      field: "customerCount",
      headerName: "Customers Count",
      width: 130,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <CountChip count={params.row._count?.customers || 0} color="success" />
      ),
    },
    {
      field: "isActive",
      headerName: "Status",
      width: 100,
      renderCell: (params) => <StatusCell active={params.value} />,
    },
    {
      field: "createdAt",
      headerName: "Created",
      width: 120,
      renderCell: (params) => new Date(params.value).toLocaleDateString(),
    },
    buildActionsColumn<Application>({ headerName: "Actions", width: 120, onEdit, onDelete }),
  ];
};

export default getApplicationsColumns;
