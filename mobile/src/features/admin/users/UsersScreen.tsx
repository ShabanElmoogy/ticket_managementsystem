import React, { useState } from 'react';
import { useAdminFeature } from '../../../shared/hooks/useAdminFeature';
import { usersApi, usersKeys } from './api/users';
import AdminCrudScreen from '../shared/AdminCrudScreen';
import AdminFormModal from '../shared/AdminFormModal';
import { AppTextInput, AppBadge } from '../../../shared/components';
import type { User, CreateUserData } from '../../../services/api/types';
import type { ColDef } from '../../../shared/components';
import { useAuthStore } from '../../../stores/authStore';

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: '#ef4444', TENANT_ADMIN: '#f59e0b',
  EMPLOYEE: '#10b981',    PROGRAMMER: '#8b5cf6',
};

const COLUMNS: ColDef<User>[] = [
  { field: 'name',  headerName: 'Name',  flex: 1,   sortable: true },
  { field: 'email', headerName: 'Email', width: 180, sortable: true },
  { field: 'phone', headerName: 'Phone', width: 130, sortable: false },
  {
    field: 'role', headerName: 'Role', width: 130, align: 'center',
    renderCell: (row) => <AppBadge label={row.role} color={ROLE_COLORS[row.role]} size="small" />,
  },
];

const UserForm: React.FC<{
  item: User | null; onClose: () => void;
  onSave: (data: CreateUserData) => Promise<void>; submitting: boolean;
}> = ({ item, onClose, onSave, submitting }) => {
  const [name,     setName]     = useState(item?.name  ?? '');
  const [email,    setEmail]    = useState(item?.email ?? '');
  const [password, setPassword] = useState('');
  const [phone,    setPhone]    = useState(item?.phone ?? '');

  return (
    <AdminFormModal open title={item ? 'Edit User' : 'Add User'} onClose={onClose}
      onSubmit={() => onSave({ name, email, password: password || undefined, phone: phone || undefined, role: item?.role ?? 'EMPLOYEE' })}
      submitting={submitting}
    >
      <AppTextInput label="Name *"  value={name}     onChangeText={setName}     placeholder="Full name" />
      <AppTextInput label="Email *" value={email}    onChangeText={setEmail}    fieldType="email" placeholder="email@example.com" />
      <AppTextInput label={item ? 'New Password (leave blank to keep)' : 'Password *'}
        value={password} onChangeText={setPassword} fieldType="password" placeholder="••••••••" />
      <AppTextInput label="Phone"   value={phone}    onChangeText={setPhone}    placeholder="+1234567890" />
    </AdminFormModal>
  );
};

const UsersScreen: React.FC = () => {
  const { user: authUser } = useAuthStore();
  const isSuperAdmin = authUser?.role === 'SUPER_ADMIN';

  const f = useAdminFeature<User, CreateUserData>({
    entityName: 'users', queryKey: usersKeys.all,
    api: {
      getAll:  isSuperAdmin ? usersApi.getUsers.bind(usersApi) : usersApi.getTenantUsers.bind(usersApi),
      create:  isSuperAdmin ? usersApi.createUser.bind(usersApi) : usersApi.createTenantUser.bind(usersApi),
      update:  usersApi.updateUser.bind(usersApi),
      delete:  usersApi.deleteUser.bind(usersApi),
    },
    messages: {
      success: { created: 'User created', updated: 'User updated', deleted: 'User deleted' },
      error:   { create: 'Error creating user', update: 'Error updating user', delete: 'Error deleting user' },
      titles:  { create: 'Add User', edit: 'Edit User' },
    },
  });

  return (
    <AdminCrudScreen<User>
      title="Users" icon="👤" itemType="user"
      entities={f.entities} loading={f.loading}
      columns={COLUMNS} searchFields={['name', 'email']}
      getItemName={(u) => u.name} onDelete={(id) => f.remove(id)}
      renderForm={(item, onClose) => (
        <UserForm item={item} onClose={onClose} submitting={f.ui.submitting}
          onSave={async (data) => { if (item) await f.update(item.id, data); else await f.create(data); onClose(); }}
        />
      )}
    />
  );
};

export default UsersScreen;
