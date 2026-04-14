import { BaseApiService } from '../../../services/api/base';

export interface PublicTenant {
  id: string;
  name: string;
  slug: string;
  adminEmail?: string | null;
  employeeEmail?: string | null;
  programmerEmail?: string | null;
}

export class TenantsPublicApiService extends BaseApiService {
  listPublic = () => this.get<PublicTenant[]>('/tenants/public');
}

export const tenantsPublicApi = new TenantsPublicApiService();
