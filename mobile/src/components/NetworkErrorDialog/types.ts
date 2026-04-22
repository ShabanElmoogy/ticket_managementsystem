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
}
