import React from "react";
import { Box, Chip, Tooltip, IconButton } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import type { Customer } from "../../../services/api";

export interface CustomersTableProps {
  customers: Customer[];
  loading: boolean;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

const CustomersTable: React.FC<CustomersTableProps> = ({ customers, loading, onEdit, onDelete }) => {
  const columns: GridColDef[] = [
    { field: "name", headerName: "Name", width: 200 },
    { field: "email", headerName: "Email", width: 250 },
    { field: "phone", headerName: "Phone", width: 150, renderCell: (params) => params.value || "-" },
    {
      field: "applications",
      headerName: "Applications",
      width: 300,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", py: 1 }}>
          {params.row.applications?.map((ca: any) => (
            <Chip
              key={ca.applicationId}
              label={ca.application?.name}
              size="small"
              color="primary"
              variant="outlined"
            />
          )) || "-"}
        </Box>
      ),
    },
    {
      field: "ticketCount",
      headerName: "Tickets",
      width: 100,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Chip label={params.row._count?.tickets || 0} size="small" color="secondary" />
      ),
    },
    {
      field: "isActive",
      headerName: "Status",
      width: 100,
      renderCell: (params) => (
        <Chip label={params.value ? "Active" : "Inactive"} color={params.value ? "success" : "default"} size="small" />
      ),
    },
    {
      field: "createdAt",
      headerName: "Created",
      width: 120,
      renderCell: (params) => new Date(params.value).toLocaleDateString(),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => onEdit(params.row as Customer)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => onDelete(params.row as Customer)} color="error">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ height: 600, width: "100%" }}>
      <DataGrid
        rows={customers}
        columns={columns}
        loading={loading}
        pageSizeOptions={[10, 25, 50]}
        initialState={{
          pagination: { paginationModel: { pageSize: 10 } },
        }}
        disableRowSelectionOnClick
        sx={{
          "& .MuiDataGrid-cell": {
            borderBottom: (theme) => `1px solid ${theme.palette.mode === "dark" ? "#333" : "#f0f0f0"}`,
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: (theme) =>
              theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "#f5f5f5",
          },
        }}
      />
    </Box>
  );
};

export default CustomersTable;
