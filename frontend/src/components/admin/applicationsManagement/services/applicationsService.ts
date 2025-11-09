import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { applicationsApi } from "../api/applications";
import { type CreateApplicationData } from "../../../../services/api";
import { applicationsKeys } from "./keys";
import { getErrorMessage } from "../utils/errorUtils";

export const useApplicationsQuery = (enabled: boolean) => {
  return useQuery({
    queryKey: applicationsKeys.all,
    queryFn: () => applicationsApi.getApplications(),
    enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
};

export const useCreateApplicationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateApplicationData) => {
      return await applicationsApi.createApplication(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationsKeys.all });
    },
    onError: (error) => {
      // Surface normalized error for callers using mutateAsync
      getErrorMessage(error); // no-op call to ensure tree-shaking doesn't drop util; callers use thrown error
    },
  });
};

export const useUpdateApplicationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CreateApplicationData }) => {
      return await applicationsApi.updateApplication(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationsKeys.all });
    },
    onError: (error) => {
      getErrorMessage(error);
    },
  });
};

export const useDeleteApplicationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await applicationsApi.deleteApplication(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationsKeys.all });
    },
    onError: (error) => {
      getErrorMessage(error);
    },
  });
};