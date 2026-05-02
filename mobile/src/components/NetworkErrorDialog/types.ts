// ErrorReason is defined in services/api/types.ts (dependency-free module)
// and re-exported here so UI components can import from the nearest location.
export type { ErrorReason } from '@/src/services/api/types';

export type ErrorKind = 'network' | 'api';

export interface ErrorState {
  kind:      ErrorKind;
  title:     string;
  subtitle:  string;
  message:   string;
  status?:   number;
  details?:  unknown;
  count:     number;
  timestamp: string;
  /** Structured reason code — drives UI decisions (button labels, icons, etc.) */
  reason?:   import('@/src/services/api/types').ErrorReason;
}
