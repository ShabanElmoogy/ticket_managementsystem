import React, { useMemo } from "react";
import { ReusableFormDialog } from "../../../common/forms";
import type { FormField, SelectOption } from "../../../common/forms";
import type { CustomerFormDialogProps, CustomerFormValues } from "../types/types";
import { customerFormSchema } from "../schemas/customerSchema";

const CustomerFormDialog: React.FC<CustomerFormDialogProps> = ({
  open,
  editing = false,
  initialValues,
  applications,
  onClose,
  onSubmit,
  submitting = false,
}) => {
  // Convert applications to SelectOption format
  const applicationOptions: SelectOption[] = useMemo(
    () => applications.map((app) => ({ value: app.id, label: app.name })),
    [applications]
  );

  const customerFields: FormField<CustomerFormValues>[] = [
    {
      name: "name",
      label: "Name",
      required: true,
      autoFocus: true,
      width: 2,
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      required: true,
      width: 2,
    },
    {
      name: "phone",
      label: "Phone",
      width: 2,
    },
    {
      name: "address",
      label: "Address",
      width: 2,
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
      renderChip: (value, options) => {
        const app = options.find((opt) => opt.value === value);
        return app?.label || String(value);
      },
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
          name: "",
          email: "",
          phone: "",
          address: "",
          description: "",
          applicationIds: [],
        }
      }
      onClose={onClose}
      onSubmit={onSubmit}
      submitting={submitting}
    />
  );
};

export default CustomerFormDialog;
