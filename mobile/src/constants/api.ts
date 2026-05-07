/**
 * API constants for the mobile app.
 *
 * Sections:
 *   API.*         — endpoint path constants (static strings + typed param functions)
 *   QUERY_KEYS.*  — React Query cache key factories (centralized, no duplication)
 *   SOCKET.*      — Socket.IO event names
 *   QUERY_PARAMS  — typed query param builders for filterable endpoints
 *   HTTP_STATUS   — semantic HTTP status code constants
 *   PAGINATION    — shared pagination defaults
 *
 * Usage:
 *   import { API, QUERY_KEYS, SOCKET, HTTP_STATUS, PAGINATION } from '@/src/constants/api';
 *
 *   this.get<Ticket[]>(API.TICKETS.LIST)
 *   this.get<Ticket>(API.TICKETS.BY_ID(id))
 *   queryKey: QUERY_KEYS.TICKETS.all
 *   socket.on(SOCKET.EVENTS.NOTIFICATION, handler)
 */

// ─────────────────────────────────────────────────────────────────────────────
// API — Endpoint paths
// ─────────────────────────────────────────────────────────────────────────────

// ── Auth ──────────────────────────────────────────────────────────────────────

export const AUTH = {
  LOGIN:     '/auth/login',
  REFRESH:   '/auth/refresh',
  LOGOUT:    '/auth/logout',
  DEV_LOGIN: '/auth/dev-login',
} as const;

// ── Tenants ───────────────────────────────────────────────────────────────────

export const TENANTS = {
  LIST:                '/tenants',
  PUBLIC:              '/tenants/public',
  BY_SLUG:             (slug: string) => `/tenants/by-slug/${slug}`,
  BY_ID:               (id: string)   => `/tenants/${id}`,
  STATS:               (id: string)   => `/tenants/${id}/stats`,
  ACTIVATE:            (id: string)   => `/tenants/${id}/activate`,
  DEACTIVATE:          (id: string)   => `/tenants/${id}/deactivate`,
  PAGINATION_SETTINGS:               '/tenants/pagination-settings',
  PAGINATION_SETTINGS_BY_ID: (id: string) => `/tenants/${id}/pagination-settings`,
} as const;

// ── Users ─────────────────────────────────────────────────────────────────────

export const USERS = {
  LIST:              '/users',
  PROFILE:           '/users/profile',
  PROFILE_STATUS:    '/users/profile/tenant-status',
  EMPLOYEES:         '/users/employees',
  PROGRAMMERS:       '/users/programmers',
  STATS:             '/users/stats',
  TENANT:            '/users/tenant',
  TENANT_SEATS:      '/users/tenant/seats',
  BY_ID:             (id: string) => `/users/${id}`,
  TENANT_BY_ID:      (id: string) => `/users/tenant/${id}`,
  RESET_PASSWORD:    (id: string) => `/users/${id}/reset-password`,
  TENANT_RESET_PW:   (id: string) => `/users/tenant/${id}/reset-password`,
} as const;

// ── Tickets ───────────────────────────────────────────────────────────────────

export const TICKETS = {
  LIST:              '/tickets',
  DELAYED:           '/tickets/delayed',
  BULK:              '/tickets/bulk',
  BY_ID:             (id: string)                          => `/tickets/${id}`,
  TAKE:              (id: string)                          => `/tickets/${id}/take`,
  RESTORE:           (id: string)                          => `/tickets/${id}/restore`,
  REASSIGN:          (id: string)                          => `/tickets/${id}/reassign`,
  WATCHERS:          (id: string)                          => `/tickets/${id}/watchers`,
  WATCH:             (id: string)                          => `/tickets/${id}/watch`,
  ATTACHMENTS:       (id: string)                          => `/tickets/${id}/attachments`,
  ATTACHMENT_BY_ID:  (id: string, attachmentId: string)   => `/tickets/${id}/attachments/${attachmentId}`,
  COMMENTS:          (id: string)                          => `/tickets/${id}/comments`,
  COMMENT_BY_ID:     (id: string, commentId: string)      => `/tickets/${id}/comments/${commentId}`,
  PROGRAMMING:       (id: string)                          => `/tickets/${id}/programming`,
  ASSIGN_PROGRAMMER: (id: string)                          => `/tickets/${id}/assign-programmer`,
} as const;

// ── Customers ─────────────────────────────────────────────────────────────────

export const CUSTOMERS = {
  LIST:               '/customers',
  ASSIGN_APPLICATION: '/customers/assign-application',
  BY_ID:              (id: string)                              => `/customers/${id}`,
  REMOVE_APPLICATION: (customerId: string, applicationId: string) =>
    `/customers/${customerId}/applications/${applicationId}`,
  VISITS:             (customerId: string)                      => `/customers/${customerId}/visits`,
  VISIT_BY_ID:        (customerId: string, visitId: string)     => `/customers/${customerId}/visits/${visitId}`,
} as const;

// ── Applications ──────────────────────────────────────────────────────────────

export const APPLICATIONS = {
  LIST:            '/applications',
  ASSIGN_CUSTOMER: '/applications/assign-customer',
  BY_ID:           (id: string)                              => `/applications/${id}`,
  REMOVE_CUSTOMER: (applicationId: string, customerId: string) =>
    `/applications/${applicationId}/customers/${customerId}`,
} as const;

// ── Labels ────────────────────────────────────────────────────────────────────

export const LABELS = {
  LIST:          '/labels',
  ASSIGN:        '/labels/assign',
  BY_ID:         (id: string)                        => `/labels/${id}`,
  REMOVE_TICKET: (labelId: string, ticketId: string) => `/labels/${labelId}/tickets/${ticketId}`,
} as const;

// ── Notifications ─────────────────────────────────────────────────────────────

export const NOTIFICATIONS = {
  LIST:       '/notifications',
  COUNT:      '/notifications/count',
  READ_ALL:   '/notifications/read-all',
  PUSH_TOKEN: '/notifications/push-token',
  BY_ID:      (id: string) => `/notifications/${id}`,
  READ:       (id: string) => `/notifications/${id}/read`,
} as const;

// ── Kanban ────────────────────────────────────────────────────────────────────

export const KANBAN = {
  BOARDS:          '/kanban/boards',
  BOARD_BY_ID:     (id: string)       => `/kanban/boards/${id}`,
  BOARD_ANALYTICS: (boardId: string)  => `/kanban/boards/${boardId}/analytics`,
  BOARD_COLUMNS:   (boardId: string)  => `/kanban/boards/${boardId}/columns`,
  COLUMN_BY_ID:    (columnId: string) => `/kanban/columns/${columnId}`,
  MOVE_TICKET:     (ticketId: string) => `/kanban/tickets/${ticketId}/move`,
  MOVE_TASK:       (taskId: string)   => `/kanban/tasks/${taskId}/move`,
} as const;

// ── Tasks ─────────────────────────────────────────────────────────────────────

export const TASKS = {
  LIST:  '/tasks',
  BY_ID: (id: string) => `/tasks/${id}`,
  MOVE:  (id: string) => `/tasks/${id}/move`,
} as const;

// ── Epics ─────────────────────────────────────────────────────────────────────

export const EPICS = {
  LIST:              '/epics',
  BULK_STATUS:       '/epics/bulk-status',
  NETWORK_GRAPH:     '/epics/network/graph',
  BY_ID:             (id: string)                              => `/epics/${id}`,
  COMMENTS:          (id: string)                              => `/epics/${id}/comments`,
  COMMENT_BY_ID:     (id: string, commentId: string)          => `/epics/${id}/comments/${commentId}`,
  ACTIVITY:          (id: string)                              => `/epics/${id}/activity`,
  WATCHERS:          (id: string)                              => `/epics/${id}/watchers`,
  WATCH:             (id: string)                              => `/epics/${id}/watch`,
  TICKETS:           (id: string)                              => `/epics/${id}/tickets`,
  TICKET_BY_ID:      (id: string, ticketId: string)           => `/epics/${id}/tickets/${ticketId}`,
  SUB_EPICS:         (id: string)                              => `/epics/${id}/sub-epics`,
  CONTRIBUTORS:      (id: string)                              => `/epics/${id}/contributors`,
  CONTRIBUTOR_BY_ID: (id: string, contributorId: string)      => `/epics/${id}/contributors/${contributorId}`,
  FEATURES:          (id: string)                              => `/epics/${id}/features`,
  FEATURE_BY_ID:     (id: string, featureId: string)          => `/epics/${id}/features/${featureId}`,
  FEATURES_REORDER:  (id: string)                              => `/epics/${id}/features/reorder`,
  BLOCKERS:          (id: string)                              => `/epics/${id}/blockers`,
  BLOCKER_BY_ID:     (id: string, blockerId: string)          => `/epics/${id}/blockers/${blockerId}`,
  RELATIONS:         (id: string)                              => `/epics/${id}/relations`,
  RELATION_BY_ID:    (id: string, relationId: string)         => `/epics/${id}/relations/${relationId}`,
  BURNDOWN:          (id: string)                              => `/epics/${id}/burndown`,
  AUTO_CLOSE:        (id: string)                              => `/epics/${id}/auto-close`,
} as const;

// ── Feature Requests ──────────────────────────────────────────────────────────

export const FEATURES = {
  LIST:       '/features',
  BY_ID:      (id: string)                    => `/features/${id}`,
  VOTE:       (id: string)                    => `/features/${id}/vote`,
  STEPS:      (id: string)                    => `/features/${id}/steps`,
  STEP_BY_ID: (id: string, stepId: string)   => `/features/${id}/steps/${stepId}`,
} as const;

// ── Templates ─────────────────────────────────────────────────────────────────

export const TEMPLATES = {
  LIST:  '/templates',
  BY_ID: (id: string) => `/templates/${id}`,
} as const;

// ── Documents ─────────────────────────────────────────────────────────────────

export const DOCS = {
  LIST:        '/documents',
  TREE:        '/documents/tree',
  TREE_FOLDER: '/documents/tree/folder',
  TREE_DOC:    '/documents/tree/doc',
  BY_ID:       (id: string) => `/documents/${id}`,
  TREE_BY_ID:  (id: string) => `/documents/tree/${id}`,
  TREE_RENAME: (id: string) => `/documents/tree/${id}/rename`,
  TREE_MOVE:   (id: string) => `/documents/tree/${id}/move`,
} as const;

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const DASHBOARD = {
  STATS:      '/dashboard',
  ACTIVITIES: '/dashboard/activities',
} as const;

// ── Settings ──────────────────────────────────────────────────────────────────

export const SETTINGS = {
  ESCALATION:  '/reminders/escalation-settings',
  SLA:         '/reminders/sla-settings',
  REMINDERS:   '/reminders/reminder-settings',
  DATE_FORMAT: '/reminders/date-format-settings',
  EPIC_CLOSE:  '/reminders/epic-auto-close-settings',
  TRIGGER_ESC: '/reminders/trigger-escalation',
  EMAIL_INGEST:'/email-ingest/settings',
} as const;

/** Barrel — import everything via `API.*` */
export const API = {
  AUTH, TENANTS, USERS, TICKETS, CUSTOMERS, APPLICATIONS,
  LABELS, NOTIFICATIONS, KANBAN, TASKS, EPICS, FEATURES,
  TEMPLATES, DOCS, DASHBOARD, SETTINGS,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// QUERY_KEYS — React Query cache key factories
// Centralized here so invalidation is consistent across the app.
// ─────────────────────────────────────────────────────────────────────────────

export const QUERY_KEYS = {
  TICKETS: {
    all:         ['tickets']                                          as const,
    detail:      (id: string)                    => ['tickets', id]  as const,
    comments:    (id: string)                    => ['tickets', id, 'comments']    as const,
    attachments: (id: string)                    => ['tickets', id, 'attachments'] as const,
    activities:  (id: string)                    => ['tickets', id, 'activities']  as const,
    watchers:    (id: string)                    => ['tickets', id, 'watchers']    as const,
    programming: (id: string)                    => ['tickets', id, 'programming'] as const,
  },
  PROGRAMMING: {
    detail: (id: string) => ['programming', id] as const,
  },
  ACTIVITIES: {
    recent: ['activities', 'recent'] as const,
  },
  CUSTOMERS:    { all: ['customers']                    as const, detail: (id: string) => ['customers', id]    as const, visits: (id: string) => ['customers', id, 'visits'] as const },
  APPLICATIONS: { all: ['applications']                 as const, detail: (id: string) => ['applications', id] as const },
  USERS:        { all: ['users']                        as const, detail: (id: string) => ['users', id]        as const },
  TENANTS:      { all: ['tenants']                      as const, detail: (id: string) => ['tenants', id]      as const },
  TEMPLATES:    { all: ['templates']                    as const, detail: (id: string) => ['templates', id]    as const },
  EPICS:        { all: ['epics']                        as const, detail: (id: string) => ['epics', id]        as const },
  FEATURES:     { all: ['features']                     as const, detail: (id: string) => ['features', id]     as const },
  KANBAN:       { boards: ['kanban', 'boards']          as const, board: (id: string)  => ['kanban', 'boards', id] as const },
  TASKS:        { all: ['tasks']                        as const, detail: (id: string) => ['tasks', id]        as const },
  DOCS:         { all: ['docs']                         as const, detail: (id: string) => ['docs', id]         as const },
  NOTIFICATIONS:{ all: ['notifications']                as const },
  DASHBOARD:    { stats: ['dashboard', 'stats']         as const, activities: ['dashboard', 'activities'] as const },
  SETTINGS:     {
    sla:        ['settings', 'sla']         as const,
    escalation: ['settings', 'escalation']  as const,
    dateFormat: ['settings', 'dateFormat']  as const,
    reminders:  ['settings', 'reminders']   as const,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// SOCKET — Socket.IO event names
// ─────────────────────────────────────────────────────────────────────────────

export const SOCKET = {
  /** Events emitted by the server */
  EVENTS: {
    NOTIFICATION:    'notification',
    TICKET_CREATED:  'ticket:created',
    TICKET_UPDATED:  'ticket:updated',
    TICKET_DELETED:  'ticket:deleted',
  },
  /** Events emitted by the client */
  EMIT: {
    JOIN:         'join',
    JOIN_TENANT:  'joinTenant',
    LEAVE:        'leave',
    LEAVE_TENANT: 'leaveTenant',
  },
  /** Notification type strings */
  NOTIFICATION_TYPES: {
    TICKET_CREATED:             'TICKET_CREATED',
    TICKET_UPDATED:             'TICKET_UPDATED',
    TICKET_ASSIGNED:            'TICKET_ASSIGNED',
    COMMENT_ADDED:              'COMMENT_ADDED',
    COMMENT_DELETED:            'COMMENT_DELETED',
    COMMENT_MENTION:            'COMMENT_MENTION',
    TICKET_DUE_SOON:            'TICKET_DUE_SOON',
    TICKET_OVERDUE:             'TICKET_OVERDUE',
    STATUS_CHANGED:             'STATUS_CHANGED',
    PRIORITY_ESCALATED:         'PRIORITY_ESCALATED',
    EPIC_FEATURE_STATUS_CHANGED:'EPIC_FEATURE_STATUS_CHANGED',
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// QUERY_PARAMS — Typed query param builders for filterable endpoints
// ─────────────────────────────────────────────────────────────────────────────

export type TicketStatus =
  | 'OPEN' | 'IN_PROGRESS' | 'PROGRAMMING' | 'UNDER_DEVELOPMENT'
  | 'CODE_REVIEW' | 'TESTING' | 'RESOLVED' | 'CLOSED';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TicketFilters = {
  status?:        TicketStatus;
  priority?:      TicketPriority;
  assignedTo?:    string;
  customerId?:    string;
  applicationId?: string;
  userId?:        string;
  search?:        string;
  deleted?:       boolean;
};

/** Build a query string from ticket filters — omits undefined values */
export function buildTicketQuery(filters: TicketFilters): string {
  const params = new URLSearchParams();
  if (filters.status)        params.set('status',        filters.status);
  if (filters.priority)      params.set('priority',      filters.priority);
  if (filters.assignedTo)    params.set('assignedTo',    filters.assignedTo);
  if (filters.customerId)    params.set('customerId',    filters.customerId);
  if (filters.applicationId) params.set('applicationId', filters.applicationId);
  if (filters.userId)        params.set('userId',        filters.userId);
  if (filters.search)        params.set('search',        filters.search);
  if (filters.deleted)       params.set('deleted',       'true');
  const qs = params.toString();
  return qs ? `${API.TICKETS.LIST}?${qs}` : API.TICKETS.LIST;
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP_STATUS — Semantic HTTP status code constants
// ─────────────────────────────────────────────────────────────────────────────

export const HTTP_STATUS = {
  OK:                    200,
  CREATED:               201,
  NO_CONTENT:            204,
  BAD_REQUEST:           400,
  UNAUTHORIZED:          401,
  FORBIDDEN:             403,
  NOT_FOUND:             404,
  CONFLICT:              409,
  UNPROCESSABLE_ENTITY:  422,
  REQUEST_TIMEOUT:       408,
  TOO_MANY_REQUESTS:     429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE:   503,
} as const;

export type HttpStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];

// ─────────────────────────────────────────────────────────────────────────────
// PAGINATION — Shared pagination defaults
// ─────────────────────────────────────────────────────────────────────────────

export const PAGINATION = {
  /** Default page size for admin list screens (AdminCrudScreen) */
  ADMIN_PAGE_SIZE: 5,
  /** Default stale time for detail queries (2 minutes) */
  DETAIL_STALE_TIME: 2 * 60 * 1000,
  /** Default stale time for list queries (30 seconds) */
  LIST_STALE_TIME: 30 * 1000,
} as const;
