export interface EmailConfig {
  enabled: boolean;
  host: string;
  port: string;
  secure: boolean;
  user: string;
  intervalMinutes: string;
}

export interface SlaConfig {
  slaUrgentHours: number;
  slaHighHours: number;
  slaMediumHours: number;
  slaLowHours: number;
}

export interface EscalationConfig {
  intervalMinutes: number;
  scope: 'global' | 'tenant';
}

export interface EpicAutoCloseConfig {
  epicAutoClose: boolean;
}

/** Shared alert state used across all settings hooks */
export interface AlertState {
  type: 'success' | 'error' | 'info';
  msg: string;
}
