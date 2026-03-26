// Export all types
export * from "./types";

// Export base HTTP client
export { api } from "./base";
export type { AxiosRequestConfig } from "./base";

// Export domain services
export { authApi } from "../../components/auth/api/auth";
export { usersApi } from "../../components/admin/usersManagement/api/users";
export { ticketsApi } from "../../components/admin/ticketsManagement/api/tickets";
export { customersApi } from "../../components/admin/customersManagement/api/customers";
export { applicationsApi } from "../../components/admin/applicationsManagement/api/applications";
export { dashboardApi } from "../../components/dashboard/api/dashboard";
export { profileApi } from "../../components/profile/api/profile";
export { kanbanApi } from "../../components/kanban/api/kanban";
export { docsApi } from "../../components/admin/docs/api/docs";
export { tenantsApi } from "../../components/admin/tenantsManagement/api/tenants";
export { programmingApi } from "../../components/programming/api/programming";
export type { Tenant } from "../../components/admin/tenantsManagement/api/tenants";