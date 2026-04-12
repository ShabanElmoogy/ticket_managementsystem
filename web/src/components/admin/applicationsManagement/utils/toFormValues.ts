import type { Application } from '../../../../services/api/types/application.ts';
import type { ApplicationFormValues } from '../types/types';

export function applicationToFormValues(app: Application): ApplicationFormValues {
  return {
    name:        app.name,
    description: app.description ?? '',
    version:     app.version     ?? '',
  };
}
