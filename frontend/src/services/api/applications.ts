import { BaseApiService } from "./base";
import type { Application, CreateApplicationData } from "./types";

export class ApplicationsApiService extends BaseApiService {
  async getApplications(): Promise<Application[]> {
    return this.get<Application[]>("/applications");
  }

  async getApplication(id: string): Promise<Application> {
    return this.get<Application>(`/applications/${id}`);
  }

  async createApplication(data: CreateApplicationData): Promise<Application> {
    return this.post<Application>("/applications", data);
  }

  async updateApplication(id: string, data: Partial<CreateApplicationData>): Promise<Application> {
    return this.put<Application>(`/applications/${id}`, data);
  }

  async deleteApplication(id: string): Promise<{ message: string }> {
    return this.delete<{ message: string }>(`/applications/${id}`);
  }
}

export const applicationsApi = new ApplicationsApiService();