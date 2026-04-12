import type { User } from '../../../../services/api/types/user.ts';
import type { UserFormValues } from '../types/types';

export function userToFormValues(u: User): UserFormValues {
  return {
    name:                  u.name,
    email:                 u.email,
    password:              '',
    role:                  u.role,
    tenantSlug:            '',
    phone:                 u.phone                 ?? '',
    whatsappNotifications: u.whatsappNotifications ?? false,
  };
}
