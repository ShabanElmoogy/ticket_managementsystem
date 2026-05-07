/**
 * useProgrammingDetails — React Query hook for GET/PUT /tickets/:id/programming.
 *
 * Fetches the ProgrammingDetails for a ticket and exposes mutations for:
 *   - saveTechnicalInfo  — saves technicalDescription, rootCause, stepsToReproduce,
 *                          estimatedHours, actualHours
 *   - saveSolutionSteps  — saves the solutionSteps array
 *   - saveCodeSnippets   — saves the codeSnippets array
 *
 * All three save operations call the same PUT endpoint but with different
 * partial payloads, keeping the UI sections independent.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/src/constants/api';
import { programmingApi } from '@/src/features/programming/api/programming';
import type { ProgrammingDetails, SolutionStep, CodeSnippet } from '@/src/services/api/types/programming';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface TechnicalInfoPayload {
  technicalDescription?: string;
  rootCause?: string;
  stepsToReproduce?: string;
  estimatedHours?: number;
  actualHours?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useProgrammingDetails(ticketId: string, enabled = true) {
  const queryClient = useQueryClient();

  // ── Query ──────────────────────────────────────────────────────────────────

  const {
    data: programming,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.TICKETS.programming(ticketId),
    queryFn: () => programmingApi.getProgramming(ticketId),
    enabled: enabled && !!ticketId,
    staleTime: QUERY_KEYS.TICKETS.programming(ticketId).length > 0 ? 30_000 : 0,
  });

  // ── Invalidation helper ────────────────────────────────────────────────────

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.TICKETS.programming(ticketId),
    });
  };

  // ── Save technical info ────────────────────────────────────────────────────

  const saveTechnicalInfoMutation = useMutation({
    mutationFn: (payload: TechnicalInfoPayload) =>
      programmingApi.saveProgramming(ticketId, payload),
    onSuccess: (updated: ProgrammingDetails) => {
      // Optimistically update the cache with the returned data
      queryClient.setQueryData(
        QUERY_KEYS.TICKETS.programming(ticketId),
        updated,
      );
    },
  });

  // ── Save solution steps ────────────────────────────────────────────────────

  const saveSolutionStepsMutation = useMutation({
    mutationFn: (steps: SolutionStep[]) =>
      programmingApi.saveProgramming(ticketId, { solutionSteps: steps }),
    onSuccess: (updated: ProgrammingDetails) => {
      queryClient.setQueryData(
        QUERY_KEYS.TICKETS.programming(ticketId),
        updated,
      );
    },
  });

  // ── Save code snippets ─────────────────────────────────────────────────────

  const saveCodeSnippetsMutation = useMutation({
    mutationFn: (snippets: CodeSnippet[]) =>
      programmingApi.saveProgramming(ticketId, { codeSnippets: snippets }),
    onSuccess: (updated: ProgrammingDetails) => {
      queryClient.setQueryData(
        QUERY_KEYS.TICKETS.programming(ticketId),
        updated,
      );
    },
  });

  // ─────────────────────────────────────────────────────────────────────────

  return {
    programming,
    isLoading,
    isError,
    refetch,
    invalidate,

    // Technical info
    saveTechnicalInfo: (payload: TechnicalInfoPayload) =>
      saveTechnicalInfoMutation.mutateAsync(payload),
    isSavingTechnicalInfo: saveTechnicalInfoMutation.isPending,

    // Solution steps
    saveSolutionSteps: (steps: SolutionStep[]) =>
      saveSolutionStepsMutation.mutateAsync(steps),
    isSavingSolutionSteps: saveSolutionStepsMutation.isPending,

    // Code snippets
    saveCodeSnippets: (snippets: CodeSnippet[]) =>
      saveCodeSnippetsMutation.mutateAsync(snippets),
    isSavingCodeSnippets: saveCodeSnippetsMutation.isPending,
  };
}
