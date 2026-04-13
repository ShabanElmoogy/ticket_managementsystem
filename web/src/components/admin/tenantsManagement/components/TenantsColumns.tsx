import React from 'react';
import { Chip, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { ActionsCell } from '../../../../shared/components';
import type { GridColDef } from '@mui/x-data-grid';
import type { Tenant } from '../types/types';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import BlockIcon from '@mui/icons-material/Block';
import { formatDate } from '../../../../shared/utils/dateUtils';

const STATUSES = ['ACTIVE', 'TRIAL', 'PAST_DUE', 'SUSPENDED'] as const;
type TenantStatus = typeof STATUSES[number];

const STATUS_COLORS: Record<TenantStatus, 'success' | 'warning' | 'error' | 'default'> = {
  ACTIVE: 'success',
  TRIAL: 'warning',
  PAST_DUE: 'error',
  SUSPENDED: 'default',
};

const STATUS_ICONS: Record<TenantStatus, React.ReactElement> = {
  ACTIVE:    <CheckCircleIcon fontSize="small" color="success" />,
  TRIAL:     <WarningAmberIcon fontSize="small" color="warning" />,
  PAST_DUE:  <ErrorOutlineIcon fontSize="small" color="error" />,
  SUSPENDED: <BlockIcon fontSize="small" />,
};

const PLAN_COLORS: Record<string, 'default' | 'primary' | 'secondary'> = {
  FREE: 'default', PRO: 'primary', ENTERPRISE: 'secondary',
};

export const isTenantInactive = (tenant: Tenant): boolean => {
  if (tenant.subscriptionStatus === 'SUSPENDED') return true;
  if (tenant.subscriptionEnd && new Date(tenant.subscriptionEnd) < new Date()) return true;
  return false;
};

// Inline status-change menu rendered inside the grid cell
function StatusMenuCell({
  tenant,
  onStatusChange,
}: {
  tenant: Tenant;
  onStatusChange: (tenant: Tenant, status: TenantStatus) => void;
}) {
  const [anchor, setAnchor] = React.useState<null | HTMLElement>(null);
  const current = (tenant.subscriptionStatus ?? 'ACTIVE') as TenantStatus;

  return (
    <>
      <Chip
        label={current}
        size="small"
        color={STATUS_COLORS[current] ?? 'default'}
        onClick={(e) => { e.stopPropagation(); setAnchor(e.currentTarget); }}
        sx={{ cursor: 'pointer', fontWeight: 600 }}
      />
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        onClick={(e) => e.stopPropagation()}
      >
        {STATUSES.map((s) => (
          <MenuItem
            key={s}
            selected={s === current}
            disabled={s === current}
            onClick={() => { onStatusChange(tenant, s); setAnchor(null); }}
          >
            <ListItemIcon>{STATUS_ICONS[s]}</ListItemIcon>
            <ListItemText>{s}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

export const getTenantsColumns = (handlers: {
  onEdit: (tenant: Tenant) => void;
  onDelete: (tenant: Tenant) => void;
  onStatusChange: (tenant: Tenant, status: TenantStatus) => void;
}): GridColDef[] => {
  const { onEdit, onDelete, onStatusChange } = handlers;

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
      width: 140,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <StatusMenuCell tenant={params.row} onStatusChange={onStatusChange} />
      ),
    },
    {
      field: 'subscriptionSeats',
      headerName: 'Seats',
      width: 90,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const seats = params.value;
        const color = !seats || seats === 0 ? 'default' : seats < 5 ? 'warning' : seats < 20 ? 'primary' : 'success';
        return <Chip label={seats ?? '—'} size="small" color={color} variant="outlined" />;
      },
    },
    {
      field: 'subscriptionStart',
      headerName: 'Start',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => params.value ? formatDate(params.value) : '—',
    },
    {
      field: 'subscriptionEnd',
      headerName: 'End',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        if (!params.value) return '—';
        const expired = new Date(params.value) < new Date();
        return (
          <Chip
            label={formatDate(params.value)}
            size="small"
            color={expired ? 'error' : 'default'}
            variant={expired ? 'filled' : 'outlined'}
          />
        );
      },
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => params.value ? formatDate(params.value) : '—',
    },
    {
      field: '_stats.userCount',
      headerName: 'Users',
      width: 90,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const count = params.row._stats?.userCount;
        const color = count === undefined ? 'default' : count === 0 ? 'default' : count < 5 ? 'warning' : 'success';
        return <Chip label={count ?? '—'} size="small" color={color} />;
      },
    },
    {
      field: '_stats.ticketCount',
      headerName: 'Tickets',
      width: 90,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const count = params.row._stats?.ticketCount;
        const color = count === undefined ? 'default' : count === 0 ? 'default' : count < 10 ? 'primary' : count < 50 ? 'warning' : 'error';
        return <Chip label={count ?? '—'} size="small" color={color} />;
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <ActionsCell row={params.row} onEdit={onEdit} onDelete={onDelete} />
      ),
    },
  ];
};

export default getTenantsColumns;
