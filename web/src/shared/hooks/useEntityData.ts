import { useCallback } from "react";
import { useAuthStore } from "../../stores/authStore";
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
  queryKey: readonly string[] | (() => readonly string[]);
  api: {
    getAll: () => Promise<T[]>;
    create: (data: CreateT) => Promise<T>;
    update: (id: string, data: CreateT) => Promise<T>;
    delete: (id: string) => Promise<unknown>;
  };
}

export function useEntityData<T, CreateT>(
  config: EntityConfig<T, CreateT>
): EntityDataReturn<T, CreateT> {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  const resolvedKey = typeof config.queryKey === 'function' ? config.queryKey() : config.queryKey;

  const { data: entities = [], isLoading: loading, refetch } = useQuery({
    queryKey: resolvedKey,
    queryFn: config.api.getAll,
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: config.api.create,
    onMutate: async (newEntity) => {
      await queryClient.cancelQueries({ queryKey: resolvedKey });
      const previousEntities = queryClient.getQueryData(resolvedKey);
      queryClient.setQueryData(resolvedKey, (old: T[] = []) => [
        ...old,
        { ...newEntity, id: `temp-${Date.now()}`, createdAt: new Date().toISOString() } as T
      ]);
      return { previousEntities };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(resolvedKey, context?.previousEntities);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: resolvedKey });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateT }) =>
      config.api.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: resolvedKey });
      const previousEntities = queryClient.getQueryData(resolvedKey);
      queryClient.setQueryData(resolvedKey, (old: T[] = []) =>
        old.map(entity =>
          (entity as { id: string }).id === id ? { ...entity, ...data } : entity
        )
      );
      return { previousEntities };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(resolvedKey, context?.previousEntities);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: resolvedKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: config.api.delete,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: resolvedKey });
      const previousEntities = queryClient.getQueryData(resolvedKey);
      queryClient.setQueryData(resolvedKey, (old: T[] = []) =>
        old.filter(entity => (entity as { id: string }).id !== id)
      );
      return { previousEntities };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(resolvedKey, context?.previousEntities);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: resolvedKey });
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