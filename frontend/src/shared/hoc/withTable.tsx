import React from "react";
import { AdminDataGrid } from "../../components/common";
import type { GridColDef } from "@mui/x-data-grid";

export interface TableConfig<T> {
  getColumns: (handlers: { onEdit: (item: T) => void; onDelete: (item: T) => void }) => GridColDef[];
}

export interface TableProps<T> {
  entities: T[];
  loading: boolean;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  tableConfig: TableConfig<T>;
}

export function withTable<T, P extends object = Record<string, never>>(
  tableConfig: TableConfig<T>
) {
  return function(Component: React.ComponentType<P & { renderTable: () => React.ReactNode }>) {
    const TableWrapper = (props: P & TableProps<T>) => {
      const { entities, loading, onEdit, onDelete, ...restProps } = props;
      
      const columns = tableConfig.getColumns({ onEdit, onDelete });
      
      const renderTable = () => (
        <AdminDataGrid rows={entities} columns={columns} loading={loading} />
      );

      return <Component {...(restProps as P)} renderTable={renderTable} />;
    };

    TableWrapper.displayName = `withTable(${Component.displayName || Component.name})`;
    return TableWrapper;
  };
}

export default withTable;