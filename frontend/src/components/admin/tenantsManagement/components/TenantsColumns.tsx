import { Chip } from '@mui/material';
import { buildActionsColumn } from '../../../common';
import type { GridColDef } from '@mui/x-data-grid';
import type { Tenant } from '../types/types';

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  ACTIVE: 'success', TRIAL: 'warning', PAST_DUE: 'error', CANCELED: 'default',
};

const PLAN_COLORS: Record<string, 'default' | 'primary' | 'secondary'> = {
  FREE: 'default', PRO: 'primary', ENTERPRISE: 'secondary',
};

export const getTenantsColumns = (handlers: {
  onEdit: (tenant: Tenant) => void;
  onDelete: (tenant: Tenant) => void;
}): GridColDef[] => {
  const { onEdit, onDelete } = handlers;

  return [
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 160, align: 'center', headerAlign: 'center' },
    { field: 'slug', headerName: 'Slug', flex: 1, minWidth: 140, align: 'center', headerAlign: 'center' },
    {
      field: 'subscriptionPlan',
      headerName: 'Plan',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Chip
          label={params.value ?? 'FREE'}
          size="small"
          color={PLAN_COLORS[params.value] ?? 'default'}
          variant="outlined"
        />
      ),
    },
    {
      field: 'subscriptionStatus',
      headerName: 'Status',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Chip
          label={params.value ?? 'ACTIVE'}
          size="small"
          color={STATUS_COLORS[params.value] ?? 'default'}
        />
      ),
    },
    {
      field: 'subscriptionSeats',
      headerName: 'Seats',
      width: 90,
      type: 'number',
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'subscriptionStart',
      headerName: 'Start',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => params.value ? new Date(params.value).toLocaleDateString() : '—',
    },
    {
      field: 'subscriptionEnd',
      headerName: 'End',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => params.value ? new Date(params.value).toLocaleDateString() : '—',
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => params.value ? new Date(params.value).toLocaleDateString() : '—',
    },
    buildActionsColumn<Tenant>({ headerName: 'Actions', width: 120, onEdit, onDelete }),
  ];
};

export default getTenantsColumns;
