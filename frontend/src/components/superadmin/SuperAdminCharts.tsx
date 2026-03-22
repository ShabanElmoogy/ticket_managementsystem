import React, { useMemo } from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Tenant } from "../../services/api";

export type SuperAdminChartsProps = {
  tenants: Tenant[];
};

function getMonthKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function formatMonthLabel(key: string) {
  // key: YYYY-MM
  const [y, m] = key.split("-");
  return `${m}/${y}`;
}

const SuperAdminCharts: React.FC<SuperAdminChartsProps> = ({ tenants }) => {
  const createdByMonth = useMemo(() => {
    const map = new Map<string, number>();

    for (const t of tenants) {
      if (!t.createdAt) continue;
      const d = new Date(t.createdAt);
      if (Number.isNaN(d.getTime())) continue;
      const key = getMonthKey(d);
      map.set(key, (map.get(key) ?? 0) + 1);
    }

    // last 6 months (including current)
    const now = new Date();
    const keys: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.push(getMonthKey(d));
    }

    return keys.map((k) => ({ month: formatMonthLabel(k), tenants: map.get(k) ?? 0 }));
  }, [tenants]);

  const byPlan = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tenants) {
      const plan = (t.subscriptionPlan || "Unknown").trim() || "Unknown";
      map.set(plan, (map.get(plan) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [tenants]);

  const planColors = ["#1976d2", "#9c27b0", "#2e7d32", "#ed6c02", "#d32f2f", "#0288d1"];

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 7 }}>
        <Card variant="outlined" sx={{ borderRadius: 2, height: "100%" }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Tenants created (last 6 months)
            </Typography>
            <Box sx={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={createdByMonth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="tenants" fill="#1976d2" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 5 }}>
        <Card variant="outlined" sx={{ borderRadius: 2, height: "100%" }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Tenants by plan
            </Typography>
            <Box sx={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byPlan}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {byPlan.map((_, idx) => (
                      <Cell key={idx} fill={planColors[idx % planColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default SuperAdminCharts;
