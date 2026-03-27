// Re-export everything from the new API structure
export * from './api/index';

// Strict pattern: no legacy apiService export here
// Consumers must import named services (authApi, usersApi, ticketsApi, etc.)

// Export types for convenience
export type {
  User,
  Customer,
  Application,
  CustomerApplication,
  Ticket,
  Comment,
  TicketWithComments,
  DashboardStats,
  CreateTicketData,
  CreateCustomerData,
  CreateApplicationData,
  CreateUserData,
  UpdateUserData,
  ReminderSettings,
  UserStats,
  LoginData,
  LoginResponse,
} from './api/types';

