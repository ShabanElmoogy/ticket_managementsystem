import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminFeature } from '@/src/shared/hooks/useAdminFeature';
import { usersApi, usersKeys } from '@/src/features/admin/users/api/users';
import { getUserColumns } from '@/src/features/admin/users/components/userColumns';
import { exportUserPdf } from '@/src/features/admin/users/utils/exportUserPdf';
import { useAuthStore } from '@/src/stores/authStore';
import { usePaginationStore } from '@/src/stores/paginationStore';
import type { User, CreateUserData } from '@/src/services/api/types';

export function useUsers() {
  const { t }                    = useTranslation();
  const { user: authUser }       = useAuthStore();
  const isSuperAdmin             = authUser?.role === 'SUPER_ADMIN';
  const [exporting,  setExporting]  = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page,       setPage]       = useState(1);
  const pageSize = usePaginationStore((s) => s.getEffectivePageSize());

  const columns = useMemo(() => getUserColumns(t), [t]);

  const f = useAdminFeature<User, CreateUserData>({
    entityName: 'users',
    queryKey:   isSuperAdmin ? usersKeys.all : usersKeys.tenant,
    page,
    limit: pageSize,
    api: {
      getAll:  isSuperAdmin ? usersApi.getUsers.bind(usersApi)           : usersApi.getTenantUsers.bind(usersApi),
      create:  isSuperAdmin ? usersApi.createUser.bind(usersApi)         : usersApi.createTenantUser.bind(usersApi),
      update:  isSuperAdmin ? usersApi.updateUser.bind(usersApi)         : usersApi.updateTenantUser.bind(usersApi),
      delete:  isSuperAdmin ? usersApi.deleteUser.bind(usersApi)         : usersApi.deleteTenantUser.bind(usersApi),
    },
    messages: {
      success: {
        created: t('users.messages.created'),
        updated: t('users.messages.updated'),
        deleted: t('users.messages.deleted'),
      },
      error: {
        create: t('users.messages.errorCreate'),
        update: t('users.messages.errorUpdate'),
        delete: t('users.messages.errorDelete'),
      },
      titles: {
        create: t('users.addTitle'),
        edit:   t('users.editTitle'),
      },
    },
  });

  const handleExport = async () => {
    setExporting(true);
    try { await exportUserPdf(f.entities, t); }
    finally { setExporting(false); }
  };

  return { f, columns, exporting, handleExport, selectedId, setSelectedId, isSuperAdmin, page, setPage };
}
