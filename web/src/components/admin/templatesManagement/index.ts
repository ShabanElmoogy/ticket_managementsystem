// Page
export { default as TemplatesManagement } from './TemplatesManagement';

// Components
export { default as TemplatePageLayout } from './components/TemplatePageLayout';
export { default as TicketTemplatesTab } from './components/TicketTemplatesTab';
export { default as EpicTemplatesTab } from './components/EpicTemplatesTab';
export { default as TicketTemplateFormDialog } from './components/TicketTemplateFormDialog';

// API
export { ticketTemplatesApi } from './api/templates';
export { ticketTemplatesKeys } from './api/queryKeys';

// Schema
export { ticketTemplateSchema } from './schemas/ticketTemplateSchema';
export type { TicketTemplateFormValues } from './schemas/ticketTemplateSchema';

// Types
export type { TicketTemplatePayload, TemplateItem } from './types/types';

// Hooks
export { useTicketTemplates } from './hooks/useTicketTemplates';
export { useEpicTemplates } from './hooks/useEpicTemplates';
