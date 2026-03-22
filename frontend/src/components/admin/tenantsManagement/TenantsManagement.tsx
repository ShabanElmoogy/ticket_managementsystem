import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { AdminDataGrid, buildActionsColumn } from "../../common";
import type { GridColDef } from "@mui/x-data-grid";
import { tenantsApi, type Tenant } from "../../../services/api";

type TenantRow = Tenant;

const toDateInputValue = (value?: string | null) => {
  if (!value) return "";
  // Accept ISO string or date-like string
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10); // yyyy-mm-dd
};

const TenantsManagement: React.FC = () => {
  const [rows, setRows] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [subscriptionPlan, setSubscriptionPlan] = useState("FREE");
  const [subscriptionStatus, setSubscriptionStatus] = useState("ACTIVE");
  const [subscriptionSeats, setSubscriptionSeats] = useState<number>(0);
  const [subscriptionStart, setSubscriptionStart] = useState<string>("");
  const [subscriptionEnd, setSubscriptionEnd] = useState<string>("");

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<TenantRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editPlan, setEditPlan] = useState("FREE");
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [editSeats, setEditSeats] = useState<number>(0);
  const [editStart, setEditStart] = useState<string>("");
  const [editEnd, setEditEnd] = useState<string>("");

  const [error, setError] = useState<string | null>(null);

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
      await tenantsApi.create({
        name,
        slug: slug || undefined,
        subscriptionPlan,
        subscriptionStatus,
        subscriptionSeats,
        subscriptionStart: subscriptionStart || undefined,
        subscriptionEnd: subscriptionEnd || undefined,
      });

      setCreateOpen(false);
      setName("");
      setSlug("");
      setSubscriptionPlan("FREE");
      setSubscriptionStatus("ACTIVE");
      setSubscriptionSeats(0);
      setSubscriptionStart("");
      setSubscriptionEnd("");

      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to create tenant");
    }
  };

  const openEdit = (row: TenantRow) => {
    setEditing(row);
    setEditName(row.name || "");
    setEditSlug(row.slug || "");
    setEditPlan(row.subscriptionPlan || "FREE");
    setEditStatus(row.subscriptionStatus || "ACTIVE");
    setEditSeats(typeof row.subscriptionSeats === "number" ? row.subscriptionSeats : 0);
    setEditStart(toDateInputValue(row.subscriptionStart));
    setEditEnd(toDateInputValue(row.subscriptionEnd));
    setEditOpen(true);
  };

  const onSaveEdit = async () => {
    if (!editing?.id) return;
    setError(null);
    try {
      await tenantsApi.update(editing.id, {
        name: editName,
        slug: editSlug,
        subscriptionPlan: editPlan,
        subscriptionStatus: editStatus,
        subscriptionSeats: editSeats,
        subscriptionStart: editStart || null,
        subscriptionEnd: editEnd || null,
      });

      setEditOpen(false);
      setEditing(null);
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to update tenant");
    }
  };

  const columns = useMemo<GridColDef<TenantRow>[]>(
    () => [
      { field: "name", headerName: "Name", flex: 1, minWidth: 180 },
      { field: "slug", headerName: "Slug", flex: 1, minWidth: 160 },
      { field: "subscriptionPlan", headerName: "Plan", flex: 0.6, minWidth: 120 },
      { field: "subscriptionStatus", headerName: "Status", flex: 0.7, minWidth: 130 },
      { field: "subscriptionSeats", headerName: "Seats", flex: 0.5, minWidth: 90, type: "number" },
      { field: "subscriptionStart", headerName: "Start", flex: 0.8, minWidth: 130 },
      { field: "subscriptionEnd", headerName: "End", flex: 0.8, minWidth: 130 },
      buildActionsColumn<TenantRow>({ width: 110, onEdit: openEdit })
    ],
    []
  );

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Typography variant="h6">Tenants</Typography>
        <Button variant="contained" onClick={() => setCreateOpen(true)}>
          Create Tenant
        </Button>
      </Stack>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <AdminDataGrid rows={rows} columns={columns} loading={loading} />

      {/* Create */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Tenant</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
            <TextField label="Slug (optional)" value={slug} onChange={(e) => setSlug(e.target.value)} fullWidth />

            <TextField select label="Subscription Plan" value={subscriptionPlan} onChange={(e) => setSubscriptionPlan(e.target.value)} fullWidth>
              <MenuItem value="FREE">FREE</MenuItem>
              <MenuItem value="PRO">PRO</MenuItem>
              <MenuItem value="ENTERPRISE">ENTERPRISE</MenuItem>
            </TextField>

            <TextField select label="Subscription Status" value={subscriptionStatus} onChange={(e) => setSubscriptionStatus(e.target.value)} fullWidth>
              <MenuItem value="ACTIVE">ACTIVE</MenuItem>
              <MenuItem value="TRIAL">TRIAL</MenuItem>
              <MenuItem value="PAST_DUE">PAST_DUE</MenuItem>
              <MenuItem value="CANCELED">CANCELED</MenuItem>
            </TextField>

            <TextField
              label="Seats"
              type="number"
              value={subscriptionSeats}
              onChange={(e) => setSubscriptionSeats(Number(e.target.value || 0))}
              fullWidth
              inputProps={{ min: 0 }}
            />

            <TextField
              label="Subscription Start"
              type="date"
              value={subscriptionStart}
              onChange={(e) => setSubscriptionStart(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Subscription End"
              type="date"
              value={subscriptionEnd}
              onChange={(e) => setSubscriptionEnd(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={onCreate} disabled={!name.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Tenant</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Name" value={editName} onChange={(e) => setEditName(e.target.value)} fullWidth />
            <TextField label="Slug" value={editSlug} onChange={(e) => setEditSlug(e.target.value)} fullWidth />

            <TextField select label="Subscription Plan" value={editPlan} onChange={(e) => setEditPlan(e.target.value)} fullWidth>
              <MenuItem value="FREE">FREE</MenuItem>
              <MenuItem value="PRO">PRO</MenuItem>
              <MenuItem value="ENTERPRISE">ENTERPRISE</MenuItem>
            </TextField>

            <TextField select label="Subscription Status" value={editStatus} onChange={(e) => setEditStatus(e.target.value)} fullWidth>
              <MenuItem value="ACTIVE">ACTIVE</MenuItem>
              <MenuItem value="TRIAL">TRIAL</MenuItem>
              <MenuItem value="PAST_DUE">PAST_DUE</MenuItem>
              <MenuItem value="CANCELED">CANCELED</MenuItem>
            </TextField>

            <TextField
              label="Seats"
              type="number"
              value={editSeats}
              onChange={(e) => setEditSeats(Number(e.target.value || 0))}
              fullWidth
              inputProps={{ min: 0 }}
            />

            <TextField
              label="Subscription Start"
              type="date"
              value={editStart}
              onChange={(e) => setEditStart(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Subscription End"
              type="date"
              value={editEnd}
              onChange={(e) => setEditEnd(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={onSaveEdit} disabled={!editing}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TenantsManagement;
