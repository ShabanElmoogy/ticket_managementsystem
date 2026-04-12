import React from 'react';
import { ReusableFormDialog } from '../../../common/forms';
import type { FormField, SelectOption } from '../../../common/forms';
import { tenantFormSchema } from '../schemas/tenantSchema';
import type { TenantFormDialogProps, TenantFormValues } from '../types/types';

const PLAN_OPTIONS: SelectOption[] = [
  { value: 'FREE',       label: 'Free'       },
  { value: 'PRO',        label: 'Pro'        },
  { value: 'ENTERPRISE', label: 'Enterprise' },
];

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'ACTIVE',    label: 'Active'    },
  { value: 'TRIAL',     label: 'Trial'     },
  { value: 'PAST_DUE',  label: 'Past Due'  },
  { value: 'SUSPENDED', label: 'Suspended' },
];

const DEFAULT_VALUES: TenantFormValues = {
  name:               '',
  slug:               '',
  subscriptionPlan:   'FREE',
  subscriptionStatus: 'ACTIVE',
  subscriptionSeats:  0,
  subscriptionStart:  '',
  subscriptionEnd:    '',
  supportEmail:       '',
};

const FIELDS: FormField<TenantFormValues>[] = [
  { name: 'name',               label: 'Name',               required: true, autoFocus: true, width: 2 },
  { name: 'slug',               label: 'Slug (auto-generated if empty)',      width: 2 },
  { name: 'subscriptionPlan',   label: 'Subscription Plan',  type: 'select', options: PLAN_OPTIONS,   width: 2 },
  { name: 'subscriptionStatus', label: 'Subscription Status',type: 'select', options: STATUS_OPTIONS, width: 2 },
  { name: 'subscriptionSeats',  label: 'Seats',              type: 'number', min: 0,                  width: 2 },
  { name: 'subscriptionStart',  label: 'Subscription Start', type: 'date',                            width: 2 },
  { name: 'subscriptionEnd',    label: 'Subscription End',   type: 'date',                            width: 2 },
  { name: 'supportEmail',       label: 'Support Email (for Email-to-Ticket)', type: 'email',          width: 1 },
];

const TenantFormDialog: React.FC<TenantFormDialogProps> = ({
  open, editing = false, initialValues, onClose, onSubmit, submitting = false,
}) => (
  <ReusableFormDialog
    open={open}
    title={editing ? 'Edit Tenant' : 'Create Tenant'}
    editing={editing}
    schema={tenantFormSchema}
    fields={FIELDS}
    initialValues={initialValues ?? DEFAULT_VALUES}
    onClose={onClose}
    onSubmit={onSubmit}
    submitting={submitting}
  />
);

export default TenantFormDialog;
