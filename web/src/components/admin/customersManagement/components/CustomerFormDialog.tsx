import React, { useMemo } from "react";
import { ReusableFormDialog } from "../../../common/forms";
import type { FormField, SelectOption } from "../../../common/forms";
import type { CustomerFormDialogProps, CustomerFormValues } from "../types/types";
import { customerFormSchema } from "../schemas/customerSchema";

const MAINTENANCE_OPTIONS: SelectOption[] = [
  { value: 'MONTHLY_SUBSCRIPTION', label: 'Monthly Subscription' },
  { value: 'FREE_TRIAL',           label: 'Free Trial'           },
  { value: 'PAY_AS_YOU_GO',        label: 'Pay As You Go'        },
];

const CustomerFormDialog: React.FC<CustomerFormDialogProps> = ({
  open,
  editing = false,
  initialValues,
  applications,
  onClose,
  onSubmit,
  submitting = false,
}) => {
  const applicationOptions: SelectOption[] = useMemo(
    () => applications.map((app) => ({ value: app.id, label: app.name })),
    [applications]
  );

  const needsDates = (values: CustomerFormValues) =>
    values.maintenanceType === 'MONTHLY_SUBSCRIPTION' || values.maintenanceType === 'FREE_TRIAL';

  const customerFields: FormField<CustomerFormValues>[] = [
    { name: "name",  label: "Name",  required: true, autoFocus: true, width: 2 },
    { name: "email", label: "Email", type: "email", required: true, width: 2 },
    { name: "phone", label: "Phone", width: 2 },
    { name: "address", label: "Address", width: 2 },
    {
      name: "maintenanceType",
      label: "Maintenance Type",
      type: "select",
      options: MAINTENANCE_OPTIONS,
      width: 1,
    },
    {
      name: "subscriptionStartDate",
      label: "Subscription Start Date",
      type: "datepicker",
      dateFormat: "dd/MM/yyyy",
      width: 2,
      disabled: (values) => !needsDates(values),
    },
    {
      name: "subscriptionEndDate",
      label: "Subscription End Date",
      type: "datepicker",
      dateFormat: "dd/MM/yyyy",
      width: 2,
      disabled: (values) => !needsDates(values),
    },
    {
      name: "description",
      label: "Description",
      type: "multiline",
      rows: 3,
      width: 1,
    },
    {
      name: "applicationIds",
      label: "Applications",
      type: "multiSelect",
      options: applicationOptions,
      renderChip: (value, options) => options.find((opt) => opt.value === value)?.label || String(value),
      width: 1,
    },
  ];

  return (
    <ReusableFormDialog
      open={open}
      title={editing ? "Edit Customer" : "Create New Customer"}
      editing={editing}
      schema={customerFormSchema}
      fields={customerFields}
      initialValues={
        initialValues || {
          name: "", email: "", phone: "", address: "", description: "",
          applicationIds: [], maintenanceType: null,
          subscriptionStartDate: null, subscriptionEndDate: null,
        }
      }
      onClose={onClose}
      onSubmit={onSubmit}
      submitting={submitting}
    />
  );
};

export default CustomerFormDialog;
