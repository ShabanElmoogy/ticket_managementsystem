import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { ticketsApi, usersApi, customersApi, applicationsApi, type Ticket, type CreateTicketData } from '../../../services/api';
import { useAuthStore } from '../../../stores/authStore';

export const useTicketsQuery = (filters: {
  status?: string;
  priority?: string;
  userFilter?: string;
  customerFilter?: string;
  applicationFilter?: string;
  deletedFilter?: 'active' | 'deleted';
  search?: string;
}) => {
  const { status, priority, userFilter, customerFilter, applicationFilter, deletedFilter, search } = filters;

  return useQuery({
    queryKey: ['tickets', { status, priority, deletedFilter, search, customerFilter, applicationFilter, userFilter }],
    queryFn: () => ticketsApi.getTickets({
      status: status === '' ? undefined : status as Ticket['status'],
      priority: priority || undefined,
      deleted: deletedFilter === 'deleted',
      search: search || undefined,
      customerId: customerFilter || undefined,
      applicationId: applicationFilter || undefined,
      userId: userFilter && userFilter !== 'NEW_TICKETS' ? userFilter : undefined,
      assignedTo: userFilter === 'NEW_TICKETS' ? 'none' : undefined,
    }),
    staleTime: 0,
    placeholderData: keepPreviousData,
  });
};

export const useUsersQuery = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getUsers(),
    staleTime: 300000, // 5 minutes
  });
};

export const useEmployeesQuery = () => {
  return useQuery({
    queryKey: ['employees'],
    queryFn: () => usersApi.getEmployees(),
    staleTime: 300000,
  });
};

export const useCustomersQuery = () => {
  return useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.getCustomers(),
    staleTime: 300000,
  });
};

export const useApplicationsQuery = () => {
  return useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationsApi.getApplications(),
    staleTime: 300000,
  });
};

export const useCreateTicketMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateTicketData) => ticketsApi.createTicket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
};

export const useTakeTicketMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (ticketId: string) => ticketsApi.takeTicket(ticketId),
    // Optimistic update: update all tickets queries immediately
    onMutate: async (ticketId: string) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['tickets'] });

      // Find all tickets queries (with different filter params) and update them optimistically
      const queries = queryClient.getQueryCache().findAll({ queryKey: ['tickets'] });

      // Keep previous data per query key for rollback
      const previousData = queries.map((q) => {
        const key = q.queryKey;
        const data = queryClient.getQueryData<Ticket[]>(key);
        if (data) {
          const updated: Ticket[] = data.map((t) =>
            t.id === ticketId
              ? { ...t, assignedTo: (user ?? undefined) as Ticket['assignedTo'], assignedToId: user?.id, status: 'IN_PROGRESS' as Ticket['status'] }
              : t
          );
          queryClient.setQueryData<Ticket[]>(key, updated);
        }
        return { key, data };
      });

      return { previousData } as { previousData: { key: unknown; data: Ticket[] | undefined }[] };
    },
    // Rollback on error
    onError: (_err, _ticketId, context) => {
      const prev = context as { previousData?: { key: unknown; data: Ticket[] | undefined }[] } | undefined;
      if (prev?.previousData) {
        prev.previousData.forEach(({ key, data }) => {
          queryClient.setQueryData<ReadonlyArray<unknown>>(key as ReadonlyArray<unknown>, data as Ticket[] | undefined);
        });
      }
    },
    // Always refetch after success or error to ensure server truth
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'], refetchType: 'active' as 'active' | 'all' | 'inactive' | undefined });
    },
  });
};

export const useUpdateTicketMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Ticket> }) => ticketsApi.updateTicket(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
};

export const useAddCommentMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ ticketId, content }: { ticketId: string; content: string }) => 
      ticketsApi.addComment(ticketId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
};

export const useDeleteTicketMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticketId: string) => ticketsApi.deleteTicket(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
};

