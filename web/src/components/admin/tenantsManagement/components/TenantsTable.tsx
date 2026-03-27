import React from 'react';
import { AdminDataGrid } from '../../../common';
import { getTenantsColumns } from './TenantsColumns';
import type { Tenant } from '../types/types';

export interface TenantsTableProps {
  tenants: Tenant[];
  loading: boolean;
  onEdit: (tenant: Tenant) => void;
  onDelete: (tenant: Tenant) => void;
  onStatusChange: (tenant: Tenant, status: string) => void;
}

const TenantsTable: React.FC<TenantsTableProps> = ({ tenants, loading, onEdit, onDelete, onStatusChange }) => {
  const columns = getTenantsColumns({ onEdit, onDelete, onStatusChange });
  return <AdminDataGrid rows={tenants} columns={columns} loading={loading} />;
};

export default TenantsTable;
