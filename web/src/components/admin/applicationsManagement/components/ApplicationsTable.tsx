import React from "react";
import { AdminDataGrid } from "../../../../shared/components";
import { getApplicationsColumns } from "./ApplicationsColumns";
import type { ApplicationsTableProps } from "../types/types";

const ApplicationsTable: React.FC<ApplicationsTableProps> = ({
  applications,
  loading,
  onEdit,
  onDelete,
}) => {
  const columns = getApplicationsColumns({ onEdit, onDelete });
  return <AdminDataGrid rows={applications} columns={columns} loading={loading} />;
};

export default ApplicationsTable;