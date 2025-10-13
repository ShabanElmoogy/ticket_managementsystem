import React from "react";
import { Box, Chip, Tooltip, IconButton, Typography } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import type { Ticket } from "../../../services/api";

export interface TicketsTableProps {
  tickets: Ticket[];
  loading: boolean;
  onEdit: (ticket: Ticket) => void;
  onDelete: (ticket: Ticket) => void;
}

const TicketsTable: React.FC<TicketsTableProps> = ({
  tickets,
  loading,
  onEdit,
  onDelete,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "info";
      case "IN_PROGRESS":
        return "warning";
      case "RESOLVED":
        return "success";
      case "CLOSED":
        return "default";
      default:
        return "default";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "LOW":
        return "success";
      case "MEDIUM":
        return "warning";
      case "HIGH":
        return "error";
      case "URGENT":
        return "error";
      default:
        return "default";
    }
  };

  const columns: GridColDef[] = [
    {
      field: "title",
      headerName: "Title",
      width: 250,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value} color={getStatusColor(params.value) as any} size="small" />
      ),
    },
    {
      field: "priority",
      headerName: "Priority",
      width: 100,
      renderCell: (params) => (
        <Chip label={params.value} color={getPriorityColor(params.value) as any} size="small" />
      ),
    },
    {
      field: "customer",
      headerName: "Customer",
      width: 150,
      renderCell: (params) => params.row.customer?.name || "-",
    },
    {
      field: "application",
      headerName: "Application",
      width: 150,
      renderCell: (params) => params.row.application?.name || "-",
    },
    {
      field: "assignedTo",
      headerName: "Assigned To",
      width: 150,
      renderCell: (params) => params.row.assignedTo?.name || "Unassigned",
    },
    {
      field: "createdBy",
      headerName: "Created By",
      width: 150,
      renderCell: (params) => params.row.createdBy?.name || "-",
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
            <IconButton size="small" onClick={() => onEdit(params.row as Ticket)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => onDelete(params.row as Ticket)}
              color="error"
            >
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
        rows={tickets}
        columns={columns}
        loading={loading}
        pageSizeOptions={[10, 25, 50]}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 10 },
          },
        }}
        disableRowSelectionOnClick
        sx={{
          "& .MuiDataGrid-cell": {
            borderBottom: (theme) =>
              `1px solid ${theme.palette.mode === "dark" ? "#333" : "#f0f0f0"}`,
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

export default TicketsTable;
