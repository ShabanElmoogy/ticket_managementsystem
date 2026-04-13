import React from "react";
import type { Customer } from "../../../../services/api";
import getCustomersColumns from "./CustomersColumns";
import { AdminDataGrid } from "../../../../shared/components";

export interface CustomersTableProps {
  customers: Customer[];
  loading: boolean;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

const CustomersTable: React.FC<CustomersTableProps> = ({ customers, loading, onEdit, onDelete }) => {
  const columns = getCustomersColumns({ onEdit, onDelete });

  return (
    <AdminDataGrid
      rows={customers}
      columns={columns}
      loading={loading}
    />
  );
};

export default CustomersTable;
