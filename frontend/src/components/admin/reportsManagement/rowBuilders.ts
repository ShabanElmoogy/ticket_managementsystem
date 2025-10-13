import type { Ticket, Customer } from "../../../services/api";
import type { CustomerTicketsSummaryRow, CustomerStatusRow, CustomerActivityRow } from "./types";

export function buildSummaryRows(tickets: Ticket[], customers: Customer[]): CustomerTicketsSummaryRow[] {
  const map = new Map<string, CustomerTicketsSummaryRow>();

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

  for (const t of tickets) {
    const key = t.customerId ?? "unassigned";
    if (!map.has(key)) {
      map.set(key, {
        id: key,
        customerName: key === "unassigned" ? "Unassigned" : t.customer?.name ?? key,
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

  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

export function buildCustomerStatusRows(tickets: Ticket[], customers: Customer[]): CustomerStatusRow[] {
  const summaries = buildSummaryRows(tickets, customers);
  return summaries.map((s) => {
    const total = s.total || 0;
    const openPct = total ? (s.open / total) * 100 : 0;
    const resolvedPct = total ? ((s.resolved + s.closed) / total) * 100 : 0;
    return {
      id: s.id,
      customerName: s.customerName,
      open: s.open,
      inProgress: s.inProgress,
      resolved: s.resolved,
      closed: s.closed,
      total,
      openPct,
      resolvedPct,
    };
  });
}

export function buildCustomerActivityRows(tickets: Ticket[], customers: Customer[]): CustomerActivityRow[] {
  const now = new Date();
  const d7 = new Date(now);
  d7.setDate(now.getDate() - 7);
  const d30 = new Date(now);
  d30.setDate(now.getDate() - 30);

  const map = new Map<string, CustomerActivityRow>();
  for (const c of customers) {
    map.set(c.id, {
      id: c.id,
      customerName: c.name,
      created7: 0,
      closed7: 0,
      created30: 0,
      closed30: 0,
    });
  }

  for (const t of tickets) {
    const key = t.customerId ?? "unassigned";
    if (!map.has(key)) {
      map.set(key, {
        id: key,
        customerName: key === "unassigned" ? "Unassigned" : t.customer?.name ?? key,
        created7: 0,
        closed7: 0,
        created30: 0,
        closed30: 0,
      });
    }

    const r = map.get(key)!;
    const createdAt = t.createdAt ? new Date(t.createdAt) : undefined;
    const closedAt = t.status === "CLOSED" && t.updatedAt ? new Date(t.updatedAt) : undefined;

    if (createdAt) {
      if (createdAt >= d7) r.created7 += 1;
      if (createdAt >= d30) r.created30 += 1;
    }
    if (closedAt) {
      if (closedAt >= d7) r.closed7 += 1;
      if (closedAt >= d30) r.closed30 += 1;
    }
  }

  return Array.from(map.values()).sort((a, b) => (b.created30 + b.closed30) - (a.created30 + a.closed30));
}
