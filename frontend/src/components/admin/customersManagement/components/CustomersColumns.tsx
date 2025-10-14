import React from "react";
import { Box, Chip, Typography, useTheme, alpha } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { CountChip, StatusCell, buildActionsColumn } from "../../../common";
import type { Customer, CustomerApplication } from "../../../../services/api";

// Small presentational cell for customer's applications
export const ApplicationsCell: React.FC<{ apps?: CustomerApplication[] }> = ({
  apps,
}) => {
  const theme = useTheme();

  const getColorForApp = (key: string) => {
    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.info.main,
      theme.palette.error.main,
    ];
    const hash = key
      .split("")
      .reduce((acc, ch) => (((acc << 5) - acc) + ch.charCodeAt(0)) | 0, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  if (!apps || apps.length === 0)
    return <Typography variant="body2">-</Typography>;

  return (
    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", py: 1 }}>
      {apps.map((ca) => {
        const label = ca.application?.name || "Application";
        const key = ca.applicationId || ca.application?.id || label;
        const color = getColorForApp(key);
        return (
          <Chip
            key={ca.applicationId}
            label={label}
            size="small"
            variant="outlined"
            sx={{
              borderColor: alpha(color, 0.5),
              color,
              backgroundColor: alpha(
                color,
                theme.palette.mode === "dark" ? 0.12 : 0.08
              ),
              fontWeight: 600,
            }}
          />
        );
      })}
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
      align: "center",
      headerAlign: "center",
      width: 200,
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
      field: "applications",
      headerName: "Applications",
      align: "center",
      headerAlign: "center",
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
