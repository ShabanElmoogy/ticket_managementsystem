import React, { useState, useMemo } from "react";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import type {
  GridColDef,
  DataGridProps,
  GridRenderCellParams,
  GridValidRowModel,
} from "@mui/x-data-grid";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useAdminReadonly } from '../../../components/admin/AdminReadonlyContext';
import AppTextField from '../inputs/AppTextField';

export interface AppDataGridProps<T extends GridValidRowModel = GridValidRowModel>
  extends Omit<DataGridProps, "rows" | "columns"> {
  rows: T[];
  columns: GridColDef<T>[];
  height?: number;
  initialPageSize?: number;
  /** Message shown when rows is empty and not loading */
  emptyMessage?: string;
  /** When true, renders a built-in search field that filters rows client-side */
  searchable?: boolean;
}

/**
 * Consistent DataGrid wrapper used across Admin pages
 */
const AppDataGrid = <T extends GridValidRowModel = GridValidRowModel>({
  rows,
  columns,
  loading,
  height = 500,
  initialPageSize = 7,
  pageSizeOptions = [8, 16, 24],
  sx,
  emptyMessage,
  searchable = false,
  slots,
  ...rest
}: AppDataGridProps<T>) => {
  const [searchQuery, setSearchQuery] = useState('');

  const processedColumns = useMemo(() => {
    const hasFlex = columns.some((c) => c && typeof c.flex === "number" && c.flex > 0);
    if (hasFlex) return columns;
    const firstContentIdx = columns.findIndex((c) => c && c.field !== "actions" && c.type !== "actions");
    if (firstContentIdx === -1) return columns;
    return columns.map((c, i: number) => {
      if (i === firstContentIdx) {
        return { ...c, flex: 1 };
      }
      return c;
    });
  }, [columns]);

  const filteredRows = useMemo(() => {
    if (!searchable || !searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter((row) =>
      Object.values(row).some((val) =>
        String(val ?? '').toLowerCase().includes(q)
      )
    );
  }, [rows, searchQuery, searchable]);

  const isEmpty = !loading && filteredRows.length === 0;

  const resolvedSlots = useMemo(() => {
    if (!emptyMessage || !isEmpty) return slots;
    return {
      ...slots,
      noRowsOverlay: () => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {emptyMessage}
          </Typography>
        </Box>
      ),
    };
  }, [emptyMessage, isEmpty, slots]);

  return (
    <Box sx={{ width: "100%" }}>
      {searchable && (
        <Box sx={{ mb: 1.5 }}>
          <AppTextField
            fieldType="search"
            size="small"
            placeholder="Search…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            fullWidth
          />
        </Box>
      )}
      <Box sx={{ height, width: "100%" }}>
        <DataGrid
          rows={filteredRows}
          columns={processedColumns}
          loading={loading}
          pageSizeOptions={pageSizeOptions}
          initialState={{
            pagination: {
              paginationModel: { pageSize: initialPageSize },
            },
          }}
          disableRowSelectionOnClick
          rowBufferPx={10}
          columnBufferPx={2}
          disableVirtualization={false}
          slots={resolvedSlots}
          sx={{
            "& .MuiDataGrid-cell": {
              borderBottom: (theme) =>
                `1px solid ${theme.palette.mode === "dark" ? "#333" : "#f0f0f0"}`,
            },
            "& .MuiDataGrid-row:hover": {
              backgroundColor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(255, 255, 255, 0.08)"
                  : "#f5f5f5",
            },
            ...sx,
          }}
          {...rest}
        />
      </Box>
    </Box>
  );
};

export default AppDataGrid;

// Legacy alias
export { AppDataGrid as AdminDataGrid };
export type { AppDataGridProps as AdminDataGridProps };

// Reusable Actions Cell and helpers
export type ActionColor =
  | "default"
  | "primary"
  | "error"
  | "info"
  | "success"
  | "warning";

export interface RowAction<R extends GridValidRowModel = GridValidRowModel> {
  icon: React.ReactElement;
  title: string;
  onClick: (row: R) => void;
  color?: ActionColor;
  disabled?: boolean;
}

export interface ActionsCellProps<R extends GridValidRowModel = GridValidRowModel> {
  row: R;
  onEdit?: (row: R) => void;
  onDelete?: (row: R) => void;
  actions?: RowAction<R>[];
  size?: "small" | "medium";
}

export function ActionsCell<R extends GridValidRowModel = GridValidRowModel>({
  row,
  onEdit,
  onDelete,
  actions = [],
  size = "small",
}: ActionsCellProps<R>) {
  const readonly = useAdminReadonly();
  return (
    <Box sx={{ display: "flex", justifyContent: "center", gap: 1, alignItems: "center", width: "100%" }}>
      {onEdit && (
        <Tooltip title="Edit">
          <span>
            <IconButton size={size} onClick={() => onEdit(row)} disabled={readonly}>
              <EditIcon />
            </IconButton>
          </span>
        </Tooltip>
      )}
      {onDelete && (
        <Tooltip title="Delete">
          <span>
            <IconButton size={size} color="error" onClick={() => onDelete(row)} disabled={readonly}>
              <DeleteIcon />
            </IconButton>
          </span>
        </Tooltip>
      )}
      {actions.map((a, idx) => (
        <Tooltip key={idx} title={a.title}>
          <span>
            <IconButton
              size={size}
              color={a.color}
              onClick={() => a.onClick(row)}
              disabled={a.disabled || readonly}
            >
              {a.icon}
            </IconButton>
          </span>
        </Tooltip>
      ))}
    </Box>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function buildActionsColumn<R extends GridValidRowModel = GridValidRowModel>(opts: {
  headerName?: string;
  width?: number;
  onEdit?: (row: R) => void;
  onDelete?: (row: R) => void;
  actions?: RowAction<R>[];
}): GridColDef<R> {
  const { headerName = "Actions", width = 140, onEdit, onDelete, actions } = opts;
  return {
    field: "actions",
    headerName,
    width,
    align: "center",
    headerAlign: "center",
    sortable: false,
    filterable: false,
    renderCell: (params: GridRenderCellParams<R>) => (
      <ActionsCell<R>
        row={params.row}
        onEdit={onEdit}
        onDelete={onDelete}
        actions={actions}
      />
    ),
  } as GridColDef<R>;
}
