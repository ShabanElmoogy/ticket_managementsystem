import { BaseApiService } from '../../../../services/api/base';
import type { DateFormatValue } from '../../../../stores/tenantStore';
import type {
  EmailConfig,
  SlaConfig,
  EscalationConfig,
  EpicAutoCloseConfig,
} from '../types/types';

export class AdminSettingsApiService extends BaseApiService {
  // ── Date Format ─────────────────────────────────────────────────────────────
  async getDateFormat(): Promise<{ dateFormat: DateFormatValue }> {
    return this.get<{ dateFormat: DateFormatValue }>('/reminders/date-format-settings');
  }

  async saveDateFormat(fmt: DateFormatValue): Promise<{ dateFormat: DateFormatValue }> {
    return this.put<{ dateFormat: DateFormatValue }>('/reminders/date-format-settings', { dateFormat: fmt });
  }

  // ── Email Ingest ─────────────────────────────────────────────────────────────
  async getEmailIngest(): Promise<EmailConfig> {
    return this.get<EmailConfig>('/email-ingest/settings');
  }

  async runEmailIngestNow(): Promise<{ message: string }> {
    return this.post<{ message: string }>('/email-ingest/run-now', {});
  }

  // ── Epic Auto-Close ──────────────────────────────────────────────────────────
  async getEpicAutoClose(): Promise<EpicAutoCloseConfig> {
    return this.get<EpicAutoCloseConfig>('/reminders/epic-auto-close-settings');
  }

  async saveEpicAutoClose(enabled: boolean): Promise<EpicAutoCloseConfig> {
    return this.put<EpicAutoCloseConfig>('/reminders/epic-auto-close-settings', { epicAutoClose: enabled });
  }

  // ── Escalation / Scheduler ───────────────────────────────────────────────────
  async getEscalationSettings(): Promise<EscalationConfig> {
    return this.get<EscalationConfig>('/reminders/escalation-settings');
  }

  async saveEscalationSettings(intervalMinutes: number): Promise<EscalationConfig> {
    return this.put<EscalationConfig>('/reminders/escalation-settings', { intervalMinutes });
  }

  async runEscalationNow(): Promise<void> {
    return this.post('/reminders/escalate-now', {});
  }

  // ── SLA ──────────────────────────────────────────────────────────────────────
  async getSlaSettings(): Promise<SlaConfig> {
    return this.get<SlaConfig>('/reminders/sla-settings');
  }

  async saveSlaSettings(config: SlaConfig): Promise<SlaConfig> {
    return this.put<SlaConfig>('/reminders/sla-settings', config);
  }
}

export const adminSettingsApi = new AdminSettingsApiService();
