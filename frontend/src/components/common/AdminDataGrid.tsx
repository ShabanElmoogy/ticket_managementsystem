import React from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import type {
  GridColDef,
  DataGridProps,
  GridRenderCellParams,
  GridValidRowModel,
} from "@mui/x-data-grid";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";

export interface AdminDataGridProps<T extends GridValidRowModel = GridValidRowModel>
  extends Omit<DataGridProps, "rows" | "columns"> {
  rows: T[];
  columns: GridColDef<T>[];
  height?: number; // container height
  initialPageSize?: number;
}

/**
 * Consistent DataGrid wrapper used across Admin pages
 */
const AdminDataGrid = <T extends GridValidRowModel = GridValidRowModel>({
  rows,
  columns,
  loading,
  height = 500,
  initialPageSize = 7,
  pageSizeOptions = [8, 16, 24],
  sx,
  ...rest
}: AdminDataGridProps<T>) => {

  const processedColumns = React.useMemo(() => {
    const hasFlex = columns.some((c) => c && typeof c.flex === "number" && c.flex > 0);
    if (hasFlex) return columns;
    const firstContentIdx = columns.findIndex((c) => c && c.field !== "actions" && c.type !== "actions");
    if (firstContentIdx === -1) return columns;
    return columns.map((c, i: number) => {
      if (i === firstContentIdx) {
        // Ensure one content column flexes to avoid right-side filler space
        return { ...c, flex: 1 };
      }
      return c;
    });
  }, [columns]);

  return (
    <Box sx={{ height, width: "100%" }}>
      <DataGrid
        rows={rows}
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
  );
};

export default AdminDataGrid;

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
  return (
    <Box sx={{ display: "flex", justifyContent: "center", gap: 1, alignItems: "center", width: "100%" }}>
      {onEdit && (
        <Tooltip title="Edit">
          <IconButton size={size} onClick={() => onEdit(row)}>
            <EditIcon />
          </IconButton>
        </Tooltip>
      )}
      {onDelete && (
        <Tooltip title="Delete">
          <IconButton
            size={size}
            color="error"
            onClick={() => onDelete(row)}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      )}
      {actions.map((a, idx) => (
        <Tooltip key={idx} title={a.title}>
          <IconButton
            size={size}
            color={a.color}
            onClick={() => a.onClick(row)}
            disabled={a.disabled}
          >
            {a.icon}
          </IconButton>
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
