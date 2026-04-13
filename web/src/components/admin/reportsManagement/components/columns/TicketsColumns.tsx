import type { GridColDef } from "@mui/x-data-grid";
import type { Ticket } from "../../../../../services/api";
import { formatDate, formatDateTime } from "../../../../../shared/utils/dateUtils";

export const getTicketColumns = (): GridColDef<Ticket>[] => [
  {
    field: "title",
    headerName: "Title",
    headerAlign: "center",
    align: "center",
    minWidth: 240,
    flex: 1,
  },
  {
    field: "status",
    headerName: "Status",
    headerAlign: "center",
    align: "center",
    width: 120,
  },
  {
    field: "priority",
    headerName: "Priority",
    headerAlign: "center",
    align: "center",
    width: 120,
  },
  {
    field: "customer",
    headerName: "Customer",
    headerAlign: "center",
    align: "center",
    width: 180,
    valueGetter: (value: any) => value?.name || "-",
  },
  {
    field: "application",
    headerName: "Application",
    headerAlign: "center",
    align: "center",
    width: 180,
    valueGetter: (value: any) => value?.name || "-",
  },
  {
    field: "assignedTo",
    headerName: "Assigned To",
    headerAlign: "center",
    align: "center",
    width: 180,
    valueGetter: (value: any) => value?.name || "Unassigned",
  },
  {
    field: "createdAt",
    headerName: "Created",
    headerAlign: "center",
    align: "center",
    width: 160,
    valueGetter: (_, row) => {
      return row.createdAt ? formatDateTime(row.createdAt) : "-";
    },
  },
  {
    field: "dueDate",
    headerName: "Due",
    headerAlign: "center",
    align: "center",
    width: 140,
    valueGetter: (_, row) => {
      return row.dueDate ? formatDate(row.dueDate) : "-";
    },
  },
];
