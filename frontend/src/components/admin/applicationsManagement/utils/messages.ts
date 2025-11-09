export const messages = {
  titleCreate: 'Create New Application',
  titleEdit: 'Edit Application',
  labels: {
    name: 'Name',
    description: 'Description',
    version: 'Version',
  },
  table: {
    name: 'Name',
    description: 'Description',
    version: 'Version',
    customers: 'Customers',
    tickets: 'Tickets',
    customersCount: 'Customers Count',
    status: 'Status',
    created: 'Created',
    actions: 'Actions',
  },
  success: {
    created: 'Application created successfully',
    updated: 'Application updated successfully',
    deleted: 'Application deleted successfully',
  },
  error: {
    create: 'Error creating application',
    update: 'Error updating application',
    delete: 'Error deleting application',
  },
} as const;

export type Messages = typeof messages;
