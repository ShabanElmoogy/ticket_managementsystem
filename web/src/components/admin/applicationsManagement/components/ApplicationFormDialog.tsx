import React from "react";
import ReusableFormDialog from "../../../../shared/components/forms/ReusableFormDialog";
import type { FormField } from "../../../../shared/components/forms/ReusableFormDialog";
import type { CreateApplicationData } from "../../../../services/api";
import { applicationFormSchema } from "../schemas/applicationSchema";

export interface ApplicationFormDialogProps {
  open: boolean;
  editing?: boolean;
  initialValues?: CreateApplicationData;
  onClose: () => void;
  onSubmit: (values: CreateApplicationData) => void;
  submitting?: boolean;
}

const applicationFields: FormField<CreateApplicationData>[] = [
  { name: "name", label: "Name", required: true, autoFocus: true, width: 2 },
  { name: "version", label: "Version", width: 2 },
  { name: "description", label: "Description", type: "multiline", rows: 3, width: 1 },
];

const ApplicationFormDialog: React.FC<ApplicationFormDialogProps> = ({
  open,
  editing = false,
  initialValues,
  onClose,
  onSubmit,
  submitting = false,
}) => {
  return (
    <ReusableFormDialog
      open={open}
      title={editing ? "Edit Application" : "Create New Application"}
      editing={editing}
      schema={applicationFormSchema}
      fields={applicationFields}
      initialValues={initialValues || { name: "", description: "", version: "" }}
      onClose={onClose}
      onSubmit={onSubmit}
      submitting={submitting}
    />
  );
};

export default ApplicationFormDialog;