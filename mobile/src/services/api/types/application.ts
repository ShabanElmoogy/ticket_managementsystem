export interface Application {
  id: string;
  name: string;
  description?: string;
  version?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
