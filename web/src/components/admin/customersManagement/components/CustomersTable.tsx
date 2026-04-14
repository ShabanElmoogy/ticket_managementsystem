import React from "react";
import getCustomersColumns from "./CustomersColumns";
import { AdminDataGrid } from "../../../../shared/components";
import type { CustomersTableProps } from "../types/types";

const CustomersTable: React.FC<CustomersTableProps> = ({ customers, loading, onEdit, onDelete }) => {
  const columns = getCustomersColumns({ onEdit, onDelete });
  return <AdminDataGrid rows={customers} columns={columns} loading={loading} />;
};

export default CustomersTable;
