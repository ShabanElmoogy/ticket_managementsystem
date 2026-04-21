import { BaseApiService } from '@/src/services/api/base';
import type { Customer, CreateCustomerData, CustomerApplication } from '@/src/services/api/types';

export class CustomersApiService extends BaseApiService {
  getCustomers  = ()                                          => this.get<Customer[]>('/customers');
  getCustomer   = (id: string)                               => this.get<Customer>(`/customers/${id}`);
  createCustomer = (data: CreateCustomerData)                => this.post<Customer>('/customers', data);
  updateCustomer = (id: string, data: Partial<CreateCustomerData>) => this.put<Customer>(`/customers/${id}`, data);
  deleteCustomer = (id: string)                              => this.delete<{ message: string }>(`/customers/${id}`);
  assignApplication = (customerId: string, applicationId: string) =>
    this.post<CustomerApplication>('/customers/assign-application', { customerId, applicationId });
  removeApplication = (customerId: string, applicationId: string) =>
    this.delete<{ message: string }>(`/customers/${customerId}/applications/${applicationId}`);
}

export const customersApi = new CustomersApiService();

export const customersKeys = {
  all:    ['customers']                     as const,
  detail: (id: string) => ['customers', id] as const,
};
