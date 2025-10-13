import React from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import type {
  GridColDef,
  DataGridProps,
  GridRenderCellParams,
} from "@mui/x-data-grid";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";

export interface AdminDataGridProps
  extends Omit<DataGridProps, "rows" | "columns"> {
  rows: any[];
  columns: GridColDef[];
  height?: number; // container height
  initialPageSize?: number;
}

/**
 * Consistent DataGrid wrapper used across Admin pages
 */
const AdminDataGrid: React.FC<AdminDataGridProps> = ({
  rows,
  columns,
  loading,
  height = 600,
  initialPageSize = 10,
  pageSizeOptions = [10, 25, 50],
  sx,
  ...rest
}) => {
  return (
    <Box sx={{ height, width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        pageSizeOptions={pageSizeOptions}
        initialState={{
          pagination: {
            paginationModel: { pageSize: initialPageSize },
          },
        }}
        disableRowSelectionOnClick
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

export interface RowAction<R = any> {
  icon: React.ReactElement;
  title: string;
  onClick: (row: R) => void;
  color?: ActionColor;
  disabled?: boolean;
}

export interface ActionsCellProps<R = any> {
  row: R;
  onEdit?: (row: R) => void;
  onDelete?: (row: R) => void;
  actions?: RowAction<R>[];
  size?: "small" | "medium";
}

export function ActionsCell<R = any>({
  row,
  onEdit,
  onDelete,
  actions = [],
  size = "small",
}: ActionsCellProps<R>) {
  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
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

export function buildActionsColumn<R = any>(opts: {
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
