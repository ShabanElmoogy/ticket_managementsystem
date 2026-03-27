import type { GridColDef } from "@mui/x-data-grid";
import { CountChip, StatusCell, buildActionsColumn } from "../../../common";
import type { Customer } from "../../../../services/api";
import ApplicationsCell from "./ApplicationsCell";


// Columns factory for Customers grid
export const getCustomersColumns = (handlers: {
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}): GridColDef[] => {
  const { onEdit, onDelete } = handlers;

  return [
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      minWidth: 200,
      headerAlign: "left",
      align: "left",
    },
    {
      field: "email",
      headerName: "Email",
      align: "center",
      headerAlign: "center",
      width: 250,
    },
    {
      field: "phone",
      headerName: "Phone",
      align: "center",
      headerAlign: "center",
      width: 150,
      renderCell: (params) => params.value || "-",
    },
    {
      field: "applications",
      headerName: "Applications",
      align: "center",
      headerAlign: "center",
      width: 300,
      renderCell: (params) => (
        <ApplicationsCell apps={params.row.applications} />
      ),
    },
    {
      field: "ticketCount",
      headerName: "Tickets",
      width: 100,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <CountChip count={params.row._count?.tickets || 0} color="primary" />
      ),
    },
    {
      field: "isActive",
      headerName: "Status",
      align: "center",
      headerAlign: "center",
      width: 100,
      renderCell: (params) => <StatusCell active={params.value} />,
    },
    {
      field: "createdAt",
      headerName: "Created",
      align: "center",
      headerAlign: "center",
      width: 120,
      renderCell: (params) => new Date(params.value).toLocaleDateString(),
    },
    buildActionsColumn<Customer>({
      headerName: "Actions",
      width: 120,
      onEdit,
      onDelete,
    }),
  ];
};

export default getCustomersColumns;
