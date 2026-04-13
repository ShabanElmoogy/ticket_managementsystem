import type { GridColDef } from "@mui/x-data-grid";
import type { CustomerTicketsSummaryRow } from "../../types";
import { Chip } from "@mui/material";
import { formatDateTime } from "../../../../../utils/dateUtils";

const lastTicketValueGetter = (p: any) => {
  const v = p?.row?.lastTicketAt as string | null | undefined;
  return v ? formatDateTime(v) : "-";
};

export const getSummaryColumns =
  (): GridColDef<CustomerTicketsSummaryRow>[] => [
    {
      field: "customerName",
      headerName: "Customer",
      headerAlign: "center",
      align: "center",
      minWidth: 220,
      flex: 1,
    },
    {
      field: "total",
      headerName: "Total",
      headerAlign: "center",
      align: "center",
      width: 120,
      type: "number",
    },
    {
      field: "open",
      headerName: "Open",
      headerAlign: "center",
      align: "center",
      width: 110,
      type: "number",
      renderCell: (p) => (
        <Chip size="small" color="info" label={p?.row?.open ?? 0} />
      ),
    },
    {
      field: "inProgress",
      headerName: "In Progress",
      headerAlign: "center",
      align: "center",
      width: 130,
      type: "number",
      renderCell: (p) => (
        <Chip size="small" color="warning" label={p?.row?.inProgress ?? 0} />
      ),
    },
    {
      field: "resolved",
      headerName: "Resolved",
      headerAlign: "center",
      align: "center",
      width: 120,
      type: "number",
      renderCell: (p) => (
        <Chip size="small" color="success" label={p?.row?.resolved ?? 0} />
      ),
    },
    {
      field: "closed",
      headerName: "Closed",
      headerAlign: "center",
      align: "center",
      width: 110,
      type: "number",
      renderCell: (p) => (
        <Chip size="small" color="default" label={p?.row?.closed ?? 0} />
      ),
    },
    {
      field: "lastTicketAt",
      headerName: "Last Ticket",
      headerAlign: "center",
      align: "center",
      width: 170,
      valueGetter: lastTicketValueGetter,
    },
  ];
