import React from "react";
import { Box, Chip, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { CountChip, StatusCell, buildActionsColumn } from "../../common";
import type { Customer, CustomerApplication } from "../../../services/api";

// Small presentational cell for customer's applications
export const ApplicationsCell: React.FC<{ apps?: CustomerApplication[] }> = ({
  apps,
}) => {
  if (!apps || apps.length === 0)
    return <Typography variant="body2">-</Typography>;
  return (
    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", py: 1 }}>
      {apps.map((ca) => (
        <Chip
          key={ca.applicationId}
          label={ca.application?.name}
          size="small"
          color="primary"
          variant="outlined"
        />
      ))}
    </Box>
  );
};

// Columns factory for Customers grid
export const getCustomersColumns = (handlers: {
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
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
    { field: "email", headerName: "Email", width: 250 },
    {
      field: "phone",
      headerName: "Phone",
      width: 150,
      renderCell: (params) => params.value || "-",
    },
    {
      field: "applications",
      headerName: "Applications",
      width: 300,
      renderCell: (params) => (
        <ApplicationsCell apps={params.row.applications} />
      ),
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
      field: "isActive",
      headerName: "Status",
      align: "center",
      headerAlign: "center",
      width: 100,
      renderCell: (params) => <StatusCell active={params.value} />,
    },
    {
      field: "createdAt",
      headerName: "Created",
      align: "center",
      headerAlign: "center",
      width: 120,
      renderCell: (params) => new Date(params.value).toLocaleDateString(),
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
