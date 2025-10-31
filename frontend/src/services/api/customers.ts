import { BaseApiService } from "./base";
import type { Customer, CreateCustomerData, CustomerApplication } from "./types";

export class CustomersApiService extends BaseApiService {
  async getCustomers(): Promise<Customer[]> {
    return this.get<Customer[]>("/customers");
  }

  async getCustomer(id: string): Promise<Customer> {
    return this.get<Customer>(`/customers/${id}`);
  }

  async createCustomer(data: CreateCustomerData): Promise<Customer> {
    return this.post<Customer>("/customers", data);
  }

  async updateCustomer(id: string, data: Partial<CreateCustomerData>): Promise<Customer> {
    return this.put<Customer>(`/customers/${id}`, data);
  }

  async deleteCustomer(id: string): Promise<{ message: string }> {
    return this.delete<{ message: string }>(`/customers/${id}`);
  }

  async assignApplicationToCustomer(
    customerId: string,
    applicationId: string
  ): Promise<CustomerApplication> {
    return this.post<CustomerApplication>("/customers/assign-application", { customerId, applicationId });
  }

  async removeApplicationFromCustomer(
    customerId: string,
    applicationId: string
  ): Promise<{ message: string }> {
    return this.delete<{ message: string }>(`/customers/${customerId}/applications/${applicationId}`);
  }
}

export const customersApi = new CustomersApiService();