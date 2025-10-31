// Export all types
export * from "./types";

// Export base HTTP client
export { api } from "./base";
export type { AxiosRequestConfig } from "./base";

// Export domain services
export { authApi } from "./auth";
export { usersApi } from "./users";
export { ticketsApi } from "./tickets";
export { customersApi } from "./customers";
export { applicationsApi } from "./applications";
export { dashboardApi } from "./dashboard";
export { profileApi } from "./profile";
export { kanbanApi } from "./kanban";