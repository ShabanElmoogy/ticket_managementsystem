export type VisitStatus = 'PLANNED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface VisitUser {
  id:   string;
  name: string;
}

export interface CustomerVisit {
  id:         string;
  customerId: string;
  userId:     string;
  status:     VisitStatus;
  visitedAt:  string;
  notes:      string | null;
  latitude:   number | null;
  longitude:  number | null;
  createdAt:  string;
  updatedAt:  string;
  user?:      VisitUser | null;
}

export interface CreateVisitData {
  status?:    VisitStatus;
  visitedAt?: string;   // ISO datetime
  notes?:     string | null;
  latitude?:  number | null;
  longitude?: number | null;
}

export type UpdateVisitData = Partial<CreateVisitData>;
