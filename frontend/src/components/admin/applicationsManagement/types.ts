import type { CreateApplicationData } from "../../../services/api";

// Alias the API CreateApplicationData for form usage
export type ApplicationFormValues = CreateApplicationData;

export interface ApplicationFormDialogProps {
  open: boolean;
  editing?: boolean;
  initialValues?: ApplicationFormValues;
  onClose: () => void;
  onSubmit: (values: ApplicationFormValues) => void;
}

export interface UseApplicationFormArgs {
  open: boolean;
  initialValues?: ApplicationFormValues;
  onSubmit: (values: ApplicationFormValues) => void;
}