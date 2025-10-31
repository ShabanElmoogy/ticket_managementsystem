import { BaseApiService } from "./base";
import type { User, ReminderSettings } from "./types";

export class ProfileApiService extends BaseApiService {
  async getProfile(): Promise<User> {
    return this.get<User>("/users/profile");
  }

  async updateProfile(data: { name: string; email: string; phone: string }): Promise<User> {
    return this.put<User>("/users/profile", data);
  }

  async getReminderSettings(): Promise<ReminderSettings> {
    return this.get<ReminderSettings>("/reminders/settings");
  }

  async updateReminderSettings(settings: ReminderSettings): Promise<ReminderSettings> {
    return this.put<ReminderSettings>("/reminders/settings", settings);
  }
}

export const profileApi = new ProfileApiService();