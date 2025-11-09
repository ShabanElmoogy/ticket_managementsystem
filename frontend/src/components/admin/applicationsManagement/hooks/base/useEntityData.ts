import { useCallback } from "react";
import { useAuthStore } from "../../../../../stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface EntityDataReturn<T, CreateT> {
  entities: T[];
  loading: boolean;
  create: (data: CreateT) => Promise<T>;
  update: (id: string | number, data: CreateT) => Promise<T>;
  remove: (id: string | number) => Promise<void>;
  refetch: () => void;
}

export interface EntityConfig<T, CreateT> {
  queryKey: readonly string[];
  api: {
    getAll: () => Promise<T[]>;
    create: (data: CreateT) => Promise<T>;
    update: (id: string, data: CreateT) => Promise<T>;
    delete: (id: string) => Promise<any>;
  };
}

export function useEntityData<T, CreateT>(
  config: EntityConfig<T, CreateT>
): EntityDataReturn<T, CreateT> {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: entities = [], isLoading: loading, refetch } = useQuery({
    queryKey: config.queryKey,
    queryFn: config.api.getAll,
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: config.api.create,
    onMutate: async (newEntity) => {
      await queryClient.cancelQueries({ queryKey: config.queryKey });
      const previousEntities = queryClient.getQueryData(config.queryKey);
      queryClient.setQueryData(config.queryKey, (old: T[] = []) => [
        ...old,
        { ...newEntity, id: `temp-${Date.now()}`, createdAt: new Date().toISOString() } as T
      ]);
      return { previousEntities };
    },
    onError: (err, newEntity, context) => {
      queryClient.setQueryData(config.queryKey, context?.previousEntities);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: config.queryKey });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateT }) => 
      config.api.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: config.queryKey });
      const previousEntities = queryClient.getQueryData(config.queryKey);
      queryClient.setQueryData(config.queryKey, (old: T[] = []) =>
        old.map(entity => 
          (entity as any).id === id ? { ...entity, ...data } : entity
        )
      );
      return { previousEntities };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(config.queryKey, context?.previousEntities);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: config.queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: config.api.delete,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: config.queryKey });
      const previousEntities = queryClient.getQueryData(config.queryKey);
      queryClient.setQueryData(config.queryKey, (old: T[] = []) =>
        old.filter(entity => (entity as any).id !== id)
      );
      return { previousEntities };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(config.queryKey, context?.previousEntities);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: config.queryKey });
    },
  });

  const create = useCallback(
    async (data: CreateT) => {
      if (!token) throw new Error('No authentication token');
      return await createMutation.mutateAsync(data);
    },
    [token, createMutation]
  );

  const update = useCallback(
    async (id: string | number, data: CreateT) => {
      if (!token) throw new Error('No authentication token');
      return await updateMutation.mutateAsync({ id: String(id), data });
    },
    [token, updateMutation]
  );

  const remove = useCallback(
    async (id: string | number) => {
      if (!token) throw new Error('No authentication token');
      await deleteMutation.mutateAsync(String(id));
    },
    [token, deleteMutation]
  );

  return { 
    entities: entities as T[], 
    loading, 
    create, 
    update, 
    remove, 
    refetch: () => refetch() 
  };
}