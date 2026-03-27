import { BaseApiService } from "../../../services/api/base";
import type { LoginData, LoginResponse } from "../../../services/api/types";

export class AuthApiService extends BaseApiService {
  async login(data: LoginData): Promise<LoginResponse> {
    return this.post<LoginResponse>("/auth/login", data);
  }

  async register(
    data: LoginData & { name: string; role?: "ADMIN" | "EMPLOYEE" }
  ): Promise<LoginResponse> {
    return this.post<LoginResponse>("/auth/register", data);
  }
}

export const authApi = new AuthApiService();