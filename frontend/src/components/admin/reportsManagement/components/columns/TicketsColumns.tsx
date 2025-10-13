import type { GridColDef } from "@mui/x-data-grid";
import type { Ticket } from "../../../../../services/api";

export const getTicketColumns = (): GridColDef<Ticket>[] => [
  {
    field: "title",
    headerName: "Title",
    headerAlign: "center",
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
    valueGetter: (p) => p?.name || "-",
  },
  {
    field: "application",
    headerName: "Application",
    headerAlign: "center",
    align: "center",
    width: 180,
    valueGetter: (p) => p?.name || "-",
  },
  {
    field: "assignedTo",
    headerName: "Assigned To",
    headerAlign: "center",
    align: "center",
    width: 180,
    valueGetter: (p) => p?.name || "Unassigned",
  },
  {
    field: "createdAt",
    headerName: "Created",
    headerAlign: "center",
    align: "center",
    width: 160,
    valueGetter: (p) => {
      const v = (p as any)?.row?.createdAt as string | undefined;
      return v ? new Date(v).toLocaleString() : "-";
    },
  },
  {
    field: "dueDate",
    headerName: "Due",
    headerAlign: "center",
    align: "center",
    width: 140,
    valueGetter: (p) => {
      const v = (p as any)?.row?.dueDate as string | undefined;
      return v ? new Date(v).toLocaleDateString() : "-";
    },
  },
];
