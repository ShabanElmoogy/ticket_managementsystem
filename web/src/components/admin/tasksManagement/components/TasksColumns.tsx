import type { GridColDef } from "@mui/x-data-grid";
import { Chip } from "@mui/material";
import { buildActionsColumn } from "../../../common";
import type { KanbanTask, TaskStatus } from "../../../kanban/types/types";
import { formatDate } from "../../../../utils/dateUtils";

function getStatusColor(status: TaskStatus): "default" | "success" | "warning" | "info" | "secondary" {
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
}

export const getTasksColumns = (handlers: {
  onEdit: (task: KanbanTask) => void;
  onDelete: (task: KanbanTask) => void;
}): GridColDef<KanbanTask>[] => {
  const { onEdit, onDelete } = handlers;

  const columns: GridColDef<KanbanTask>[] = [
    {
      field: "title",
      headerName: "Title",
      width: 250,
      renderCell: (params) => params.value || "-",
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Chip label={params.value} color={getStatusColor(params.value as TaskStatus) as any} size="small" />
      ),
    },
    {
      field: "board",
      headerName: "Board",
      width: 160,
      renderCell: (params) => params.row.board?.name || "-",
    },
    {
      field: "column",
      headerName: "Column",
      width: 140,
      renderCell: (params) => params.row.column?.name || "-",
    },
    {
      field: "assignee",
      headerName: "Assignee",
      width: 180,
      renderCell: (params) => params.row.assignee?.name || "Unassigned",
    },
    {
      field: "dueDate",
      headerName: "Due Date",
      width: 140,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const v = params.value as string | undefined;
        return v ? formatDate(v) : '-';
      },
    },
    {
      field: "createdAt",
      headerName: "Created",
      width: 140,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const v = params.value as string | undefined;
        return v ? formatDate(v) : '-';
      },
    },
    buildActionsColumn<KanbanTask>({ headerName: "Actions", width: 140, onEdit, onDelete }),
  ];

  return columns;
};

export default getTasksColumns;
