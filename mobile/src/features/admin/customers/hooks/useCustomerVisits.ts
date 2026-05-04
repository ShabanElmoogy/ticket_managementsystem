/**
 * useCustomerVisits.ts
 *
 * React Query hooks for customer visit CRUD.
 * Used by CustomerVisitsScreen and VisitHistoryCard.
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS, PAGINATION } from '@/src/constants/api';
import { visitsApi } from '../api/visits';
import { toast } from '@/src/shared/hooks/useToast';
import type { CreateVisitData, UpdateVisitData } from '@/src/services/api/types/index';

export function useCustomerVisits(customerId: string) {
  const qc = useQueryClient();
  const key = QUERY_KEYS.CUSTOMERS.visits(customerId);

  const { data: visits = [], isLoading, refetch } = useQuery({
    queryKey: key,
    queryFn:  () => visitsApi.getVisits(customerId),
    staleTime: PAGINATION.LIST_STALE_TIME,
    enabled:  !!customerId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateVisitData) => visitsApi.createVisit(customerId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.CUSTOMERS.detail(customerId) });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ visitId, data }: { visitId: string; data: UpdateVisitData }) =>
      visitsApi.updateVisit(customerId, visitId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const deleteMutation = useMutation({
    mutationFn: (visitId: string) => visitsApi.deleteVisit(customerId, visitId),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const createVisit = useCallback(async (data: CreateVisitData, successMsg: string) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success(successMsg);
      return true;
    } catch {
      return false;
    }
  }, [createMutation]);

  const updateVisit = useCallback(async (visitId: string, data: UpdateVisitData, successMsg: string) => {
    try {
      await updateMutation.mutateAsync({ visitId, data });
      toast.success(successMsg);
      return true;
    } catch {
      return false;
    }
  }, [updateMutation]);

  const deleteVisit = useCallback(async (visitId: string, successMsg: string) => {
    try {
      await deleteMutation.mutateAsync(visitId);
      toast.success(successMsg);
      return true;
    } catch {
      return false;
    }
  }, [deleteMutation]);

  return {
    visits,
    isLoading,
    refetch,
    createVisit,
    updateVisit,
    deleteVisit,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
