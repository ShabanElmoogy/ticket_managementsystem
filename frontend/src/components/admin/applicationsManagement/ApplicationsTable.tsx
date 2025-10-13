import React from "react";
import type { Application } from "../../../services/api";
import getApplicationsColumns from "./ApplicationsColumns";
import AdminDataGrid from "../../common/AdminDataGrid";

export interface ApplicationsTableProps {
  applications: Application[];
  loading: boolean;
  onEdit: (app: Application) => void;
  onDelete: (app: Application) => void;
}

const ApplicationsTable: React.FC<ApplicationsTableProps> = ({
  applications,
  loading,
  onEdit,
  onDelete,
}) => {
  const columns = getApplicationsColumns({ onEdit, onDelete });

  return (
    <AdminDataGrid rows={applications} columns={columns} loading={loading} />
  );
};

export default ApplicationsTable;
