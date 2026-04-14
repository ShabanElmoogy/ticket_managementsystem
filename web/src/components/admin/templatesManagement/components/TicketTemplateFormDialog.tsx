import React from 'react';
import ReusableFormDialog from '../../../../shared/components/forms/ReusableFormDialog';
import type { FormField, SelectOption } from '../../../../shared/components/forms/ReusableFormDialog';
import { ticketTemplateSchema } from '../schemas/ticketTemplateSchema';
import type { TicketTemplateFormValues } from '../schemas/ticketTemplateSchema';
import type { TicketTemplate } from '../../../../services/api/types';

const PRIORITY_OPTIONS: SelectOption[] = [
  { value: 'LOW',    label: 'Low'    },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH',   label: 'High'   },
  { value: 'URGENT', label: 'Urgent' },
];

const FIELDS: FormField<TicketTemplateFormValues>[] = [
  { name: 'name',           label: 'Template Name',       required: true, autoFocus: true, width: 1, maxLength: 100 },
  { name: 'description',    label: 'Default Description', type: 'multiline', rows: 3, width: 1 },
  { name: 'priority',       label: 'Default Priority',    type: 'select', options: PRIORITY_OPTIONS, width: 2 },
  { name: 'estimatedHours', label: 'Estimated Hours',     type: 'number', min: 0, step: 0.25, width: 2 },
];

interface Props {
  open: boolean;
  editing: TicketTemplate | null;
  onClose: () => void;
  onSubmit: (values: TicketTemplateFormValues) => Promise<void>;
}

const TicketTemplateFormDialog: React.FC<Props> = ({ open, editing, onClose, onSubmit }) => (
  <ReusableFormDialog
    open={open}
    title={editing ? 'Edit Template' : 'New Template'}
    editing={!!editing}
    schema={ticketTemplateSchema}
    fields={FIELDS}
    initialValues={editing ? {
      name:           editing.name,
      description:    editing.description ?? '',
      priority:       editing.priority,
      estimatedHours: editing.estimatedHours ?? null,
    } : { name: '', description: '', priority: 'MEDIUM', estimatedHours: null }}
    onClose={onClose}
    onSubmit={onSubmit}
  />
);

export default TicketTemplateFormDialog;
