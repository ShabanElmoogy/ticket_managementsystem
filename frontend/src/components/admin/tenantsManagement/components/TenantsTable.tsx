import React from 'react';
import { AdminDataGrid } from '../../../common';
import { getTenantsColumns } from './TenantsColumns';
import type { Tenant } from '../types/types';

export interface TenantsTableProps {
  tenants: Tenant[];
  loading: boolean;
  onEdit: (tenant: Tenant) => void;
  onDelete: (tenant: Tenant) => void;
}

const TenantsTable: React.FC<TenantsTableProps> = ({ tenants, loading, onEdit, onDelete }) => {
  const columns = getTenantsColumns({ onEdit, onDelete });
  return <AdminDataGrid rows={tenants} columns={columns} loading={loading} />;
};

export default TenantsTable;
