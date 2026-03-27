import React from "react";
import { useEntityData, type EntityConfig } from "../hooks/useEntityData";
import { ErrorBoundary } from "../../components/common/ErrorBoundary";

export interface CRUDConfig<T, CreateT> extends EntityConfig<T, CreateT> {
  entityName: string;
}

export interface CRUDProps<T, CreateT> {
  entities: T[];
  loading: boolean;
  create: (data: CreateT) => Promise<T>;
  update: (id: string | number, data: CreateT) => Promise<T>;
  remove: (id: string | number) => Promise<void>;
  refetch: () => void;
  entityName: string;
}

export function withCRUD<T, CreateT, P extends object = Record<string, never>>(
  Component: React.ComponentType<P & CRUDProps<T, CreateT>>,
  config: CRUDConfig<T, CreateT>
) {
  const CRUDWrapper = (props: P = {} as P) => {
    const { entities, loading, create, update, remove, refetch } = useEntityData<T, CreateT>(config);

    const crudProps: CRUDProps<T, CreateT> = {
      entities,
      loading,
      create,
      update,
      remove,
      refetch,
      entityName: config.entityName,
    };

    return (
      <ErrorBoundary>
        <Component {...props} {...crudProps} />
      </ErrorBoundary>
    );
  };

  CRUDWrapper.displayName = `withCRUD(${Component.displayName || Component.name})`;
  return CRUDWrapper;
}

export default withCRUD;