import React from "react";
import { Box, Chip, Tooltip, IconButton, Typography } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import type { KanbanTask, TaskStatus } from "../../../types/kanban";

export interface TasksTableProps {
  tasks: KanbanTask[];
  loading: boolean;
  onEdit: (task: KanbanTask) => void;
  onDelete: (task: KanbanTask) => void;
}

const TasksTable: React.FC<TasksTableProps> = ({ tasks, loading, onEdit, onDelete }) => {
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "TODO":
        return "info";
      case "IN_PROGRESS":
        return "warning";
      case "REVIEW":
        return "secondary";
      case "DONE":
        return "success";
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
      field: "board",
      headerName: "Board",
      width: 150,
      renderCell: (params) => params.row.board?.name || "-",
    },
    {
      field: "column",
      headerName: "Column",
      width: 120,
      renderCell: (params) => params.row.column?.name || "-",
    },
    {
      field: "assignee",
      headerName: "Assignee",
      width: 150,
      renderCell: (params) => params.row.assignee?.name || "Unassigned",
    },
    {
      field: "dueDate",
      headerName: "Due Date",
      width: 120,
      renderCell: (params) => (params.value ? new Date(params.value).toLocaleDateString() : "-"),
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
            <IconButton size="small" onClick={() => onEdit(params.row as KanbanTask)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => onDelete(params.row as KanbanTask)} color="error">
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
        rows={tasks}
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

export default TasksTable;
