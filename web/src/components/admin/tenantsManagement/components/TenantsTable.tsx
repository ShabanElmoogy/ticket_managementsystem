import React from 'react';
import { AdminDataGrid } from '../../../../shared/components';
import { getTenantsColumns } from './TenantsColumns';
import type { TenantsTableProps } from '../types/types';

const TenantsTable: React.FC<TenantsTableProps> = ({ tenants, loading, onEdit, onDelete, onStatusChange }) => {
  const columns = getTenantsColumns({ onEdit, onDelete, onStatusChange });
  return <AdminDataGrid rows={tenants} columns={columns} loading={loading} />;
};

export default TenantsTable;
