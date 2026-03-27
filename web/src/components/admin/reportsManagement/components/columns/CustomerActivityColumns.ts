import type { GridColDef } from "@mui/x-data-grid";
import type { CustomerActivityRow } from "../../types";

export const getCustomerActivityColumns =
  (): GridColDef<CustomerActivityRow>[] => [
    {
      field: "customerName",
      headerName: "Customer",
      headerAlign: "center",
      align : "center",
      minWidth: 220,
      flex: 1,
    },
    {
      field: "created7",
      headerName: "Created (7d)",
      headerAlign: "center",
      align: "center",
      width: 140,
      type: "number",
    },
    {
      field: "closed7",
      headerName: "Closed (7d)",
      headerAlign: "center",
      align: "center",
      width: 140,
      type: "number",
    },
    {
      field: "created30",
      headerName: "Created (30d)",
      headerAlign: "center",
      align: "center",
      width: 150,
      type: "number",
    },
    {
      field: "closed30",
      headerName: "Closed (30d)",
      headerAlign: "center",
      align: "center",
      width: 150,
      type: "number",
    },
  ];
