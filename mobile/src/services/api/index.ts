// Types
export type { ApiError } from './types';

// HTTP infrastructure
export { api } from './apiClient';
export { http } from './httpClient';
export type { ApiError as HttpClientApiError } from './httpClient';

// Domain API singletons — added here as each feature is built
// export { authApi }         from '../../features/auth/api/auth';
// export { ticketsApi }      from '../../features/tickets/api/tickets';
// export { dashboardApi }    from '../../features/dashboard/api/dashboard';
// export { usersApi }        from '../../features/admin/users/api/users';
// export { customersApi }    from '../../features/admin/customers/api/customers';
// export { applicationsApi } from '../../features/admin/applications/api/applications';
// export { kanbanApi }       from '../../features/kanban/api/kanban';
// export { profileApi }      from '../../features/profile/api/profile';
