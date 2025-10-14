import {
  VersionCell,
  CustomersCell,
  CountChip,
  StatusCell,
  buildActionsColumn,
} from "../../../common";
import type { GridColDef } from "@mui/x-data-grid";
import type { Application } from "../../../../services/api";

// Columns factory
export const getApplicationsColumns = (handlers: {
  onEdit: (app: Application) => void;
  onDelete: (app: Application) => void;
}): GridColDef[] => {
  const { onEdit, onDelete } = handlers;

  return [
    {
      field: "name",
      headerName: "Name",
      align: "center",
      headerAlign: "center",
      width: 200,
    },
    {
      field: "description",
      headerName: "Description",
      align: "center",
      headerAlign: "center",
      width: 250,
      renderCell: (params) => params.value || "-",
    },
    {
      field: "version",
      headerName: "Version",
      align: "center",
      headerAlign: "center",
      width: 120,
      renderCell: (params) => <VersionCell value={params.value} />,
    },
    {
      field: "customers",
      headerName: "Customers",
      align: "center",
      headerAlign: "center",
      width: 300,
      renderCell: (params) => (
        <CustomersCell customers={params.row.customers} />
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
      field: "customerCount",
      headerName: "Customers Count",
      width: 130,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <CountChip count={params.row._count?.customers || 0} color="success" />
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
    buildActionsColumn<Application>({
      headerName: "Actions",
      width: 120,
      onEdit,
      onDelete,
    }),
  ];
};

export default getApplicationsColumns;
