import React, { useMemo } from 'react';
import { ReusableFormDialog } from '../../../common/forms';
import type { FormField, SelectOption } from '../../../common/forms';
import { useAuthStore } from '../../../../stores/authStore';
import { useAuxData } from '../../../../shared/hooks/useAuxData';
import { tenantsApi } from '../../../../services/api';
import { userFormSchema } from '../schemas/userSchema';
import type { UserFormDialogProps, UserFormValues } from '../types/types';
import { Role } from '../../../../types/roles';

const ROLE_OPTIONS: SelectOption[] = [
  { value: Role.TENANT_ADMIN, label: 'Tenant Admin' },
  { value: Role.EMPLOYEE,     label: 'Employee'     },
  { value: Role.PROGRAMMER,   label: 'Programmer'   },
];

const DEFAULT_VALUES: UserFormValues = {
  name:                  '',
  email:                 '',
  password:              '',
  role:                  Role.EMPLOYEE,
  tenantSlug:            '',
  phone:                 '',
  whatsappNotifications: false,
};

const UserFormDialog: React.FC<UserFormDialogProps> = ({
  open,
  editing = false,
  initialValues,
  onClose,
  onSubmit,
}) => {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === Role.SUPER_ADMIN;

  const { data: tenants = [], isLoading: tenantsLoading } = useAuxData(
    ['tenants-for-user-form'],
    () => tenantsApi.list(),
    isSuperAdmin && open,   // only fetch when dialog is open and user is super admin
  );

  const tenantOptions: SelectOption[] = useMemo(
    () => tenants.map((t) => ({ value: t.slug, label: `${t.name} (${t.slug})` })),
    [tenants],
  );

  // Filter role options — only super admin can assign TENANT_ADMIN
  const roleOptions = isSuperAdmin && !editing
    ? ROLE_OPTIONS
    : ROLE_OPTIONS.filter((o) => o.value !== Role.TENANT_ADMIN);

  const fields: FormField<UserFormValues>[] = [
    { name: 'name',     label: 'Name',     required: true, autoFocus: true, width: 2 },
    { name: 'email',    label: 'Email',    type: 'email',  required: true,  width: 2 },
    {
      name:  'password',
      label: editing ? 'New Password (leave blank to keep current)' : 'Password',
      type:  'password',
      width: 2,
    },
    { name: 'role', label: 'Role', type: 'select', options: roleOptions, width: 2 },
    ...(isSuperAdmin ? [{
      name:     'tenantSlug' as const,
      label:    'Tenant',
      type:     'customSelect' as const,
      options:  tenantOptions,
      width:    2 as const,
      disabled: () => tenantsLoading,
    }] : []),
    {
      name:       'phone',
      label:      'Phone Number',
      width:      2,
    },
  ];

  return (
    <ReusableFormDialog
      open={open}
      title={editing ? 'Edit User' : 'Create New User'}
      editing={editing}
      schema={userFormSchema}
      fields={fields}
      initialValues={initialValues ?? DEFAULT_VALUES}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
};

export default UserFormDialog;
