import { API } from '@/src/constants/api';
import { BaseApiService } from '@/src/services/api/base';

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

export interface PaginationConfig {
  paginationMode:    'SERVER' | 'CLIENT';
  defaultPageSize:   number;
  maxPageSize:       number;
  allowUserOverride: boolean;
  maxClientRecords:  number;
}

export class AdminSettingsApiService extends BaseApiService {
  getEscalationSettings  = ()                         => this.get<EscalationConfig>(API.SETTINGS.ESCALATION);
  saveEscalationSettings = (intervalMinutes: number)  => this.put<EscalationConfig>(API.SETTINGS.ESCALATION, { intervalMinutes });
  runEscalationNow       = ()                         => this.post(API.SETTINGS.TRIGGER_ESC, {});

  getSlaSettings  = ()                  => this.get<SlaConfig>(API.SETTINGS.SLA);
  saveSlaSettings = (config: SlaConfig) => this.put<SlaConfig>(API.SETTINGS.SLA, config);

  getEmailIngest    = ()  => this.get<EmailConfig>(API.SETTINGS.EMAIL_INGEST);
  runEmailIngestNow = ()  => this.post<{ message: string }>(API.SETTINGS.EMAIL_INGEST, {});

  getEpicAutoClose  = ()                 => this.get<EpicAutoCloseConfig>(API.SETTINGS.EPIC_CLOSE);
  saveEpicAutoClose = (enabled: boolean) => this.put<EpicAutoCloseConfig>(API.SETTINGS.EPIC_CLOSE, { epicAutoClose: enabled });

  getDateFormat  = ()                   => this.get<{ dateFormat: string }>(API.SETTINGS.DATE_FORMAT);
  saveDateFormat = (dateFormat: string) => this.put<{ dateFormat: string }>(API.SETTINGS.DATE_FORMAT, { dateFormat });

  getPaginationSettings  = ()                        => this.get<PaginationConfig>(API.TENANTS.PAGINATION_SETTINGS);
  savePaginationSettings = (config: PaginationConfig) => this.patch<PaginationConfig>(API.TENANTS.PAGINATION_SETTINGS, config);
}

export const adminSettingsApi = new AdminSettingsApiService();
