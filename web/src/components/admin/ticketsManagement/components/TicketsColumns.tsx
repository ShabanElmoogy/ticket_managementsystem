import { Chip, Box, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { buildActionsColumn } from "../../../common";
import type { Ticket } from "../../../../services/api";

function getStatusColor(status: Ticket["status"]): "default" | "success" | "warning" | "info" {
  switch (status) {
    case "OPEN":
      return "info";
    case "IN_PROGRESS":
      return "warning";
    case "RESOLVED":
      return "success";
    case "CLOSED":
    default:
      return "default";
  }
}

function getPriorityColor(priority: Ticket["priority"]): "default" | "success" | "warning" | "error" {
  switch (priority) {
    case "LOW":
      return "success";
    case "MEDIUM":
      return "warning";
    case "HIGH":
    case "URGENT":
      return "error";
    default:
      return "default";
  }
}

export const getTicketsColumns = (handlers: {
  onEdit: (ticket: Ticket) => void;
  onDelete: (ticket: Ticket) => void;
}): GridColDef<Ticket>[] => {
  const { onEdit, onDelete } = handlers;

  const columns: GridColDef<Ticket>[] = [
    {
      field: "title",
      headerName: "Title",
      align : "center",
      headerAlign : "center",
      width: 250,
      renderCell: (params) => (
        <Box sx={{ width: "100%",height:"100%", display: "flex", justifyContent: "center",alignItems : "center" }}>
          <Typography variant="body2" fontWeight="medium" align="center">
            {params.value || "-"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Chip label={params.value} color={getStatusColor(params.value as Ticket["status"]) as any} size="small" />
      ),
    },
    {
      field: "priority",
      headerName: "Priority",
      width: 100,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Chip label={params.value} color={getPriorityColor(params.value as Ticket["priority"]) as any} size="small" />
      ),
    },
    {
      field: "customer",
      headerName: "Customer",
      width: 160,
      renderCell: (params) => params.row.customer?.name || "-",
    },
    {
      field: "application",
      headerName: "Application",
      width: 160,
      renderCell: (params) => params.row.application?.name || "-",
    },
    {
      field: "assignedTo",
      headerName: "Assigned To",
      width: 160,
      renderCell: (params) => params.row.assignedTo?.name || "Unassigned",
    },
    {
      field: "createdBy",
      headerName: "Created By",
      width: 160,
      renderCell: (params) => params.row.createdBy?.name || "-",
    },
    {
      field: "createdAt",
      headerName: "Created",
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => new Date(params.value as string).toLocaleDateString(),
    },
    buildActionsColumn<Ticket>({ headerName: "Actions", width: 140, onEdit, onDelete }),
  ];

  return columns;
};

export default getTicketsColumns;
