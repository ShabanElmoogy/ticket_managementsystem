import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminFeature } from '../../../shared/hooks/useAdminFeature';
import { usersApi, usersKeys } from './api/users';
import AdminCrudScreen  from '../shared/AdminCrudScreen';
import AdminFormModal   from '../shared/AdminFormModal';
import { AppTextInput, AppBadge } from '../../../shared/components';
import type { User, CreateUserData } from '../../../services/api/types';
import type { ColDef } from '../../../shared/components';
import { useAuthStore } from '../../../stores/authStore';

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN:  '#ef4444',
  TENANT_ADMIN: '#f59e0b',
  EMPLOYEE:     '#10b981',
  PROGRAMMER:   '#8b5cf6',
};

// ── Inline form (simple enough to not need a separate file) ───────────────────

const UserForm: React.FC<{
  item:       User | null;
  onClose:    () => void;
  onSave:     (data: CreateUserData) => Promise<void>;
  submitting: boolean;
}> = ({ item, onClose, onSave, submitting }) => {
  const { t } = useTranslation();
  const [name,     setName]     = useState(item?.name  ?? '');
  const [email,    setEmail]    = useState(item?.email ?? '');
  const [password, setPassword] = useState('');
  const [phone,    setPhone]    = useState(item?.phone ?? '');

  return (
    <AdminFormModal
      open
      title={item ? t('users.editTitle') : t('users.addTitle')}
      onClose={onClose}
      onSubmit={() => onSave({
        name,
        email,
        password: password || undefined,
        phone:    phone    || undefined,
        role:     item?.role ?? 'EMPLOYEE',
      })}
      submitting={submitting}
    >
      <AppTextInput
        label={t('users.form.name')}
        value={name}
        onChangeText={setName}
        placeholder={t('users.form.namePlaceholder')}
        autoCapitalize="words"
      />
      <AppTextInput
        label={t('users.form.email')}
        value={email}
        onChangeText={setEmail}
        fieldType="email"
        placeholder={t('users.form.emailPlaceholder')}
      />
      <AppTextInput
        label={item ? t('users.form.passwordEdit') : t('users.form.password')}
        value={password}
        onChangeText={setPassword}
        fieldType="password"
        placeholder={t('users.form.passwordPlaceholder')}
      />
      <AppTextInput
        label={t('users.form.phone')}
        value={phone}
        onChangeText={setPhone}
        placeholder={t('users.form.phonePlaceholder')}
      />
    </AdminFormModal>
  );
};

// ── Screen ────────────────────────────────────────────────────────────────────

const UsersScreen: React.FC = () => {
  const { t } = useTranslation();
  const { user: authUser } = useAuthStore();
  const isSuperAdmin = authUser?.role === 'SUPER_ADMIN';

  const columns: ColDef<User>[] = [
    { field: 'name',  headerName: t('users.columns.name'),  flex: 1,    sortable: true  },
    { field: 'email', headerName: t('users.columns.email'), width: 180, sortable: true  },
    { field: 'phone', headerName: t('users.columns.phone'), width: 130, sortable: false },
    {
      field: 'role', headerName: t('users.columns.role'), width: 130, align: 'center',
      renderCell: (row) => (
        <AppBadge label={row.role} color={ROLE_COLORS[row.role] ?? '#6b7280'} size="small" />
      ),
    },
  ];

  const f = useAdminFeature<User, CreateUserData>({
    entityName: 'users',
    queryKey:   usersKeys.all,
    api: {
      getAll:  isSuperAdmin ? usersApi.getUsers.bind(usersApi)       : usersApi.getTenantUsers.bind(usersApi),
      create:  isSuperAdmin ? usersApi.createUser.bind(usersApi)     : usersApi.createTenantUser.bind(usersApi),
      update:  usersApi.updateUser.bind(usersApi),
      delete:  usersApi.deleteUser.bind(usersApi),
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
      titles: { create: t('users.addTitle'), edit: t('users.editTitle') },
    },
  });

  return (
    <AdminCrudScreen<User>
      title={t('users.title')}
      icon="👤"
      itemType={t('users.itemType')}
      entities={f.entities}
      loading={f.loading}
      columns={columns}
      searchFields={['name', 'email']}
      getItemName={(u) => u.name}
      onDelete={(id) => f.remove(id)}
      onRefresh={f.refetch}
      searchPlaceholder={t('users.searchPlaceholder')}
      emptyMessage={t('users.emptyMessage')}
      emptyFilteredMessage={t('users.emptyFilteredMessage')}
      addLabel={t('users.addTitle')}
      refreshLabel={t('common.refresh')}
      refreshingLabel={t('common.refreshing')}
      deleteSuccessMessage={t('users.messages.deleted')}
      renderForm={(item, onClose) => (
        <UserForm
          item={item}
          onClose={onClose}
          submitting={f.ui.submitting}
          onSave={async (data) => {
            if (item) await f.update(item.id, data);
            else      await f.create(data);
            onClose();
          }}
        />
      )}
    />
  );
};

export default UsersScreen;
