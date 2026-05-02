export type ErrorKind   = 'network' | 'api';

/**
 * Structured reason codes — set by the caller, never inferred from message text.
 * Add new codes here as needed rather than parsing free-form strings.
 */
export type ErrorReason = 'associated_data';

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
  reason?:   ErrorReason;
}
