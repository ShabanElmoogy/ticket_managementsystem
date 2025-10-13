import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import AdminGridHeader from "../../common/AdminGridHeader";
import AdminDataGrid from "../../common/AdminDataGrid";
import type { GridColDef } from "@mui/x-data-grid";
import { useAuthStore } from "../../../stores/authStore";
import { apiService, type Ticket, type Customer } from "../../../services/api";

interface CustomerTicketsReportRow {
  id: string; // customer id or 'unassigned'
  customerName: string;
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  lastTicketAt?: string | null;
}

const ReportsManagement: React.FC = () => {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState<boolean>(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [ticketsData, customersData] = await Promise.all([
        apiService.getTickets(token, {}),
        apiService.getCustomers(token),
      ]);
      setTickets(ticketsData);
      setCustomers(customersData);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const rows: CustomerTicketsReportRow[] = useMemo(() => {
    // Initialize rows for each customer to ensure all customers appear
    const map = new Map<string, CustomerTicketsReportRow>();

    for (const c of customers) {
      map.set(c.id, {
        id: c.id,
        customerName: c.name,
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0,
        lastTicketAt: null,
      });
    }

    // Aggregate tickets by customerId
    for (const t of tickets) {
      const key = t.customerId ?? "unassigned";
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          customerName: key === "unassigned" ? "Unassigned" : (t.customer?.name ?? key),
          total: 0,
          open: 0,
          inProgress: 0,
          resolved: 0,
          closed: 0,
          lastTicketAt: null,
        });
      }

      const r = map.get(key)!;
      r.total += 1;
      if (t.status === "OPEN") r.open += 1;
      else if (t.status === "IN_PROGRESS") r.inProgress += 1;
      else if (t.status === "RESOLVED") r.resolved += 1;
      else if (t.status === "CLOSED") r.closed += 1;

      const createdAt = t.createdAt ? new Date(t.createdAt).toISOString() : undefined;
      if (createdAt) {
        if (!r.lastTicketAt || createdAt > r.lastTicketAt) {
          r.lastTicketAt = createdAt;
        }
      }
    }

    // Sort by total desc
    const list = Array.from(map.values()).sort((a, b) => b.total - a.total);
    return list;
  }, [tickets, customers]);

  const columns: GridColDef[] = useMemo(() => [
    {
      field: "customerName",
      headerName: "Customer",
      minWidth: 220,
      flex: 1,
    },
    {
      field: "total",
      headerName: "Total Tickets",
      width: 140,
      type: "number",
    },
    {
      field: "open",
      headerName: "Open",
      width: 110,
      type: "number",
      renderCell: (params) => (
        <Chip size="small" color="info" label={params.row.open} />
      ),
    },
    {
      field: "inProgress",
      headerName: "In Progress",
      width: 130,
      type: "number",
      renderCell: (params) => (
        <Chip size="small" color="warning" label={params.row.inProgress} />
      ),
    },
    {
      field: "resolved",
      headerName: "Resolved",
      width: 120,
      type: "number",
      renderCell: (params) => (
        <Chip size="small" color="success" label={params.row.resolved} />
      ),
    },
    {
      field: "closed",
      headerName: "Closed",
      width: 110,
      type: "number",
      renderCell: (params) => (
        <Chip size="small" color="default" label={params.row.closed} />
      ),
    },
    {
      field: "lastTicketAt",
      headerName: "Last Ticket",
      width: 160,
      renderCell: (params) =>
        params.row.lastTicketAt ? new Date(params.row.lastTicketAt).toLocaleString() : "-",
    },
  ], []);

  const rightActions = (
    <Stack direction="row" spacing={1}>
      <Button variant="outlined" onClick={fetchData}>Refresh</Button>
    </Stack>
  );

  return (
    <Box>
      <AdminGridHeader title="Reports: Customers Tickets" rightActions={rightActions} />
      <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
        Aggregated counts of tickets per customer.
      </Typography>
      <AdminDataGrid rows={rows} columns={columns} loading={loading} height={600} />
    </Box>
  );
};

export default ReportsManagement;
