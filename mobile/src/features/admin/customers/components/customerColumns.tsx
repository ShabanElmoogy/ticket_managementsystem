import React from 'react';
import { AppBadge } from '@/src/shared/components';
import type { Customer } from '@/src/services/api/types';
import type { ColDef } from '@/src/shared/components/data/AppDataTable';
import type { TFunction } from 'i18next';

/**
 * Returns translated column definitions.
 * Accepts `t` so columns rebuild automatically on language change.
 */
export function getCustomerColumns(t: TFunction): ColDef<Customer>[] {
  return [
    { field: 'name',               headerName: t('customers.columns.name'),   flex: 1,    sortable: true  },
    { field: 'email',              headerName: t('customers.columns.email'),  width: 180, sortable: true  },
    { field: 'phone',              headerName: t('customers.columns.phone'),  width: 130, sortable: false },
    {
      field: 'subscriptionStatus', headerName: t('customers.columns.status'), width: 110, align: 'center',
      renderCell: (row) => row.subscriptionStatus
        ? <AppBadge label={row.subscriptionStatus} variant="status" size="small" />
        : null,
    },
    {
      field: '_count', headerName: t('customers.columns.tickets'), width: 80, align: 'center',
      valueGetter: (row) => row._count?.tickets ?? 0,
    },
  ];
}
