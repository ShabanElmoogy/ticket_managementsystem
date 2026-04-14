// Re-export shared API types so feature code imports from one place
export type {
  Application,
  CreateApplicationData,
  CustomerApplication,
} from '../../../../services/api/types/application.ts';

// ── Feature-local types ──────────────────────────────────────────────────────

import type { Application } from '../../../../services/api/types/application.ts';
import type { CreateApplicationData } from '../../../../services/api/types/application.ts';

export type ApplicationFormValues = CreateApplicationData;

export interface ApplicationFormDialogProps {
  open: boolean;
  editing?: boolean;
  initialValues?: ApplicationFormValues;
  onClose: () => void;
  onSubmit: (values: ApplicationFormValues) => void;
  submitting?: boolean;
}

export interface UseApplicationFormArgs {
  open: boolean;
  initialValues?: ApplicationFormValues;
  onSubmit: (values: ApplicationFormValues) => void;
}
