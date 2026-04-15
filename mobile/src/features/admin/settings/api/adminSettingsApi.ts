import { BaseApiService } from '../../../../services/api/base';

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

export class AdminSettingsApiService extends BaseApiService {
  getEscalationSettings  = ()                          => this.get<EscalationConfig>('/reminders/escalation-settings');
  saveEscalationSettings = (intervalMinutes: number)   => this.put<EscalationConfig>('/reminders/escalation-settings', { intervalMinutes });
  runEscalationNow       = ()                          => this.post('/reminders/escalate-now', {});

  getSlaSettings  = ()                   => this.get<SlaConfig>('/reminders/sla-settings');
  saveSlaSettings = (config: SlaConfig)  => this.put<SlaConfig>('/reminders/sla-settings', config);

  getEmailIngest   = ()  => this.get<EmailConfig>('/email-ingest/settings');
  runEmailIngestNow = () => this.post<{ message: string }>('/email-ingest/run-now', {});

  getEpicAutoClose  = ()                    => this.get<EpicAutoCloseConfig>('/reminders/epic-auto-close-settings');
  saveEpicAutoClose = (enabled: boolean)    => this.put<EpicAutoCloseConfig>('/reminders/epic-auto-close-settings', { epicAutoClose: enabled });

  getDateFormat  = ()                  => this.get<{ dateFormat: string }>('/reminders/date-format-settings');
  saveDateFormat = (dateFormat: string) => this.put<{ dateFormat: string }>('/reminders/date-format-settings', { dateFormat });
}

export const adminSettingsApi = new AdminSettingsApiService();
