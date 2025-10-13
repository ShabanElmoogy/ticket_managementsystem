import type { GridColDef } from "@mui/x-data-grid";
import type { CustomerStatusRow } from "../../types";

export const getCustomerStatusColumns = (): GridColDef<CustomerStatusRow>[] => [
  {
    field: "customerName",
    headerName: "Customer",
    headerAlign: "center",
    align: "center",
    minWidth: 220,
    flex: 1,
  },
  {
    field: "open",
    headerName: "Open",
    headerAlign: "center",
    align: "center",
    width: 110,
    type: "number",
  },
  {
    field: "inProgress",
    headerName: "In Progress",
    headerAlign: "center",
    align: "center",
    width: 130,
    type: "number",
  },
  {
    field: "resolved",
    headerName: "Resolved",
    headerAlign: "center",
    align: "center",
    width: 120,
    type: "number",
  },
  {
    field: "closed",
    headerName: "Closed",
    headerAlign: "center",
    align: "center",
    width: 110,
    type: "number",
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
    field: "openPct",
    headerName: "Open %",
    headerAlign: "center",
    align: "center",
    width: 110,
    valueFormatter: (params) => {
      const value = Number(params);
      if (isNaN(value)) return "-";
      return `${value.toFixed(2)} %`;
    },
  },
  {
    field: "resolvedPct",
    headerName: "Resolved %",
    headerAlign: "center",
    align: "center",
    width: 130,
       valueFormatter: (params) => {
      const value = Number(params);
      if (isNaN(value)) return "-";
      return `${value.toFixed(2)} %`;
    },
  },
];
