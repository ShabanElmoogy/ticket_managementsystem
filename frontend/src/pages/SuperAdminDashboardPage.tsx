import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Stack,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { AdminDataGrid } from "../components/common";
import Header from "../components/dashboard/Header";
import SuperAdminCharts from "../components/superadmin/SuperAdminCharts";
import { tenantsApi, type Tenant } from "../services/api";

type TenantRow = Tenant;

type ViewMode = "overview" | "charts" | "grid";

const SuperAdminDashboardPage: React.FC = () => {
  const [rows, setRows] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("overview");

  const columns = useMemo<GridColDef<TenantRow>[]>(
    () => [
      { field: "name", headerName: "Tenant", flex: 1, minWidth: 200 },
      { field: "slug", headerName: "Slug", flex: 1, minWidth: 180 },
      { field: "id", headerName: "ID", flex: 1, minWidth: 240 },
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

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Header />
      {/* Spacer for fixed AppBar */}
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64, md: 70 } }} />

      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
            spacing={2}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Super Admin Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage tenants and system-wide configuration.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button variant="outlined" onClick={load} disabled={loading}>
                Refresh
              </Button>
              <Button variant="contained" href="/admin">
                Open Management
              </Button>
            </Stack>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <Box
              sx={{
                flex: 1,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                p: 2,
                backgroundColor: "background.paper",
              }}
            >
              <Typography variant="overline" color="text.secondary">
                Total Tenants
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                {rows.length}
              </Typography>
            </Box>

            <Box
              sx={{
                flex: 2,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                p: 2,
                backgroundColor: "background.paper",
              }}
            >
              <Typography variant="overline" color="text.secondary">
                Quick Actions
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1 }}>
                <Button variant="contained" href="/admin">
                  Create / Manage Tenants
                </Button>
                <Button variant="outlined" href="/admin">
                  Manage Users
                </Button>
              </Stack>
            </Box>
          </Stack>

          {error && (
            <Typography color="error" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}

          <Box
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              backgroundColor: "background.paper",
              overflow: "hidden",
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", sm: "center" }}
              sx={{ px: 2, pt: 2, gap: 1 }}
            >
              <Box>
                <Typography variant="h6">Multi-view</Typography>
                <Typography variant="body2" color="text.secondary">
                  Switch between overview, charts, and tenant grid.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                <Chip
                  size="small"
                  label={loading ? "Loading" : "Up to date"}
                  color={loading ? "warning" : "success"}
                  variant="outlined"
                />
              </Stack>
            </Stack>

            <Tabs
              value={view}
              onChange={(_, v) => setView(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ px: 1, borderBottom: "1px solid", borderColor: "divider" }}
            >
              <Tab value="overview" label="Overview" />
              <Tab value="charts" label="Charts" />
              <Tab value="grid" label="Tenants Grid" />
            </Tabs>

            <Box sx={{ p: 2 }}>
              {view === "overview" && (
                <Stack spacing={2}>
                  <SuperAdminCharts tenants={rows} />
                  <Box
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                      p: 2,
                      backgroundColor: "background.paper",
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mb: 1 }}
                    >
                      <Typography variant="h6">Tenants</Typography>
                    </Stack>
                    <AdminDataGrid rows={rows} columns={columns} loading={loading} />
                  </Box>
                </Stack>
              )}

              {view === "charts" && <SuperAdminCharts tenants={rows} />}

              {view === "grid" && <AdminDataGrid rows={rows} columns={columns} loading={loading} />}
            </Box>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
};

export default SuperAdminDashboardPage;
