import React from 'react';
import getTicketsColumns from './TicketsColumns';
import { AdminDataGrid } from '../../../../shared/components';
import type { TicketsTableProps } from '../types/types';

const TicketsTable: React.FC<TicketsTableProps> = ({ tickets, loading, onEdit, onDelete }) => {
  const columns = getTicketsColumns({ onEdit, onDelete });
  return <AdminDataGrid rows={tickets} columns={columns} loading={loading} />;
};

export default TicketsTable;
