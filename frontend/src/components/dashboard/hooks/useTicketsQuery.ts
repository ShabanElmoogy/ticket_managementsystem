import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { ticketsApi, usersApi, customersApi, applicationsApi, type Ticket, type CreateTicketData } from '../../../services/api';

export const useTicketsQuery = (filters: {
  status?: string;
  priority?: string;
  userFilter?: string;
  customerFilter?: string;
  applicationFilter?: string;
}) => {
  const { status, priority, userFilter, customerFilter, applicationFilter } = filters;
  
  const selectFn = useMemo(() => (data: Ticket[]) => {
    let ticketsData = data;

    if (userFilter) {
      if (userFilter === 'NEW_TICKETS') {
        ticketsData = ticketsData.filter((t) => !t.assignedTo);
      } else {
        ticketsData = ticketsData.filter((t) => 
          t.createdBy?.id === userFilter || t.assignedTo?.id === userFilter
        );
      }
    }
    
    if (customerFilter) {
      ticketsData = ticketsData.filter((t) => t.customer?.id === customerFilter);
    }
    
    if (applicationFilter) {
      ticketsData = ticketsData.filter((t) => t.application?.id === applicationFilter);
    }

    return ticketsData;
  }, [userFilter, customerFilter, applicationFilter]);
  
  return useQuery({
    queryKey: ['tickets', { status, priority, userFilter, customerFilter, applicationFilter }],
    queryFn: () => ticketsApi.getTickets({
      status: status === '' ? undefined : status as any,
      priority: priority || undefined
    }),
    staleTime: 30000,
    select: selectFn,
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
  
  return useMutation({
    mutationFn: (ticketId: string) => ticketsApi.takeTicket(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
};

export const useUpdateTicketMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => ticketsApi.updateTicket(id, data),
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