export interface ApplicationCustomer {
  id: string;
  customerId: string;
  customer?: { name: string; email?: string };
}

export interface Application {
  id: string;
  name: string;
  description?: string;
  version?: string;
  createdAt: string;
  updatedAt: string;
  customers?: ApplicationCustomer[];
  _count?: {
    tickets: number;
    customers: number;
  };
}

export interface CreateApplicationData {
  name: string;
  description?: string;
  version?: string;
}
