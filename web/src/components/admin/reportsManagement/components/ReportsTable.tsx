import type { GridColDef } from "@mui/x-data-grid";
import AdminDataGrid from "../../../common/data-display/AppDataGrid";

export interface ReportsTableProps {
  rows: unknown[];
  columns: GridColDef[];
  loading?: boolean;
  height?: number | string;
}

const ReportsTable = ({ rows, columns, loading, height = 600 }: ReportsTableProps) => {
  return (
    <AdminDataGrid
      rows={rows}
      columns={columns}
      loading={loading}
      height={height as number}
    />
  );
};

export default ReportsTable;
