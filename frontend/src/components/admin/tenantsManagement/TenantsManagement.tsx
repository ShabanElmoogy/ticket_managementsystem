import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { AdminDataGrid } from "../../common";
import type { GridColDef } from "@mui/x-data-grid";
import { tenantsApi, type Tenant } from "../../../services/api";

type TenantRow = Tenant;

const TenantsManagement: React.FC = () => {
  const [rows, setRows] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);

  const columns = useMemo<GridColDef<TenantRow>[]>(
    () => [
      { field: "name", headerName: "Name", flex: 1, minWidth: 180 },
      { field: "slug", headerName: "Slug", flex: 1, minWidth: 180 },
      { field: "id", headerName: "ID", flex: 1, minWidth: 220 },
    ],
    []
  );

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await tenantsApi.list();
      setRows(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load tenants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onCreate = async () => {
    setError(null);
    try {
      await tenantsApi.create({ name, slug: slug || undefined });
      setOpen(false);
      setName("");
      setSlug("");
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to create tenant");
    }
  };

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} spacing={2} sx={{ mb: 2 }}>
        <Typography variant="h6">Tenants</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>
          Create Tenant
        </Button>
      </Stack>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <AdminDataGrid rows={rows} columns={columns} loading={loading} />

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Tenant</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
            <TextField label="Slug (optional)" value={slug} onChange={(e) => setSlug(e.target.value)} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={onCreate} disabled={!name.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TenantsManagement;
