import { BaseApiService } from '@/src/services/api/base';
import { API, QUERY_KEYS } from '@/src/constants/api';
import type { Customer, CreateCustomerData, CustomerApplication } from '@/src/services/api/types/index';

export class CustomersApiService extends BaseApiService {
  getCustomers      = (params?: Record<string, string>)                     => this.get<Customer[]>(API.CUSTOMERS.LIST, { params });
  getCustomer       = (id: string)                                          => this.get<Customer>(API.CUSTOMERS.BY_ID(id));
  createCustomer    = (data: CreateCustomerData)                            => this.post<Customer>(API.CUSTOMERS.LIST, data);
  updateCustomer    = (id: string, data: Partial<CreateCustomerData>)       => this.put<Customer>(API.CUSTOMERS.BY_ID(id), data);
  deleteCustomer    = (id: string)                                          => this.delete<{ message: string }>(API.CUSTOMERS.BY_ID(id));
  assignApplication = (customerId: string, applicationId: string)          =>
    this.post<CustomerApplication>(API.CUSTOMERS.ASSIGN_APPLICATION, { customerId, applicationId });
  removeApplication = (customerId: string, applicationId: string)          =>
    this.delete<{ message: string }>(API.CUSTOMERS.REMOVE_APPLICATION(customerId, applicationId));
}

export const customersApi  = new CustomersApiService();
export const customersKeys = QUERY_KEYS.CUSTOMERS;
