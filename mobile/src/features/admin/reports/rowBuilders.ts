// Copied verbatim from web/src/components/admin/reportsManagement/rowBuilders.ts
// Pure functions — no platform-specific code.

import type { Ticket, Customer } from '../../../services/api/types';
import type {
  CustomerTicketsSummaryRow,
  CustomerStatusRow,
  CustomerActivityRow,
  SlaMetricsRow,
} from './types';

export function buildSummaryRows(
  tickets: Ticket[],
  customers: Customer[],
): CustomerTicketsSummaryRow[] {
  const map = new Map<string, CustomerTicketsSummaryRow>();

  for (const c of customers) {
    map.set(c.id, {
      id: c.id,
      customerName: c.name,
      total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0,
      lastTicketAt: null,
    });
  }

  for (const t of tickets) {
    const key = t.customerId ?? 'unassigned';
    if (!map.has(key)) {
      map.set(key, {
        id: key,
        customerName: key === 'unassigned' ? 'Unassigned' : (t.customer?.name ?? key),
        total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0,
        lastTicketAt: null,
      });
    }
    const r = map.get(key)!;
    r.total += 1;
    if (t.status === 'OPEN')        r.open       += 1;
    else if (t.status === 'IN_PROGRESS') r.inProgress += 1;
    else if (t.status === 'RESOLVED')    r.resolved   += 1;
    else if (t.status === 'CLOSED')      r.closed     += 1;

    const createdAt = t.createdAt ? new Date(t.createdAt).toISOString() : undefined;
    if (createdAt && (!r.lastTicketAt || createdAt > r.lastTicketAt)) {
      r.lastTicketAt = createdAt;
    }
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

export function buildCustomerStatusRows(
  tickets: Ticket[],
  customers: Customer[],
): CustomerStatusRow[] {
  return buildSummaryRows(tickets, customers).map((s) => {
    const total = s.total || 0;
    return {
      id: s.id,
      customerName: s.customerName,
      open: s.open, inProgress: s.inProgress,
      resolved: s.resolved, closed: s.closed, total,
      openPct:     total ? (s.open / total) * 100 : 0,
      resolvedPct: total ? ((s.resolved + s.closed) / total) * 100 : 0,
    };
  });
}

export function buildCustomerActivityRows(
  tickets: Ticket[],
  customers: Customer[],
  periodA = 7,   // first period in days  (default 7)
  periodB = 30,  // second period in days (default 30)
): CustomerActivityRow[] {
  const now = new Date();
  const dA  = new Date(now); dA.setDate(now.getDate() - periodA);
  const dB  = new Date(now); dB.setDate(now.getDate() - periodB);

  const map = new Map<string, CustomerActivityRow>();
  for (const c of customers) {
    map.set(c.id, { id: c.id, customerName: c.name, created7: 0, closed7: 0, created30: 0, closed30: 0 });
  }

  for (const t of tickets) {
    const key = t.customerId ?? 'unassigned';
    if (!map.has(key)) {
      map.set(key, {
        id: key,
        customerName: key === 'unassigned' ? 'Unassigned' : (t.customer?.name ?? key),
        created7: 0, closed7: 0, created30: 0, closed30: 0,
      });
    }
    const r = map.get(key)!;
    const createdAt = t.createdAt ? new Date(t.createdAt) : undefined;
    const closedAt  = t.status === 'CLOSED' && t.updatedAt ? new Date(t.updatedAt) : undefined;

    if (createdAt) {
      if (createdAt >= dA) r.created7  += 1;
      if (createdAt >= dB) r.created30 += 1;
    }
    if (closedAt) {
      if (closedAt >= dA) r.closed7  += 1;
      if (closedAt >= dB) r.closed30 += 1;
    }
  }

  return Array.from(map.values())
    .sort((a, b) => (b.created30 + b.closed30) - (a.created30 + a.closed30));
}

export function buildSlaMetricsRows(
  tickets: Ticket[],
  customers: Customer[],
): SlaMetricsRow[] {
  const now = new Date();

  const map = new Map<string, SlaMetricsRow & { _resolutionHoursSum: number }>();

  for (const c of customers) {
    map.set(c.id, {
      id: c.id,
      customerName: c.name,
      total: 0,
      withDeadline: 0,
      overdue: 0,
      resolved: 0,
      onTimeCount: 0,
      avgResolutionHours: null,
      _resolutionHoursSum: 0,
    });
  }

  for (const t of tickets) {
    const key = t.customerId ?? 'unassigned';
    if (!map.has(key)) {
      map.set(key, {
        id: key,
        customerName: key === 'unassigned' ? 'Unassigned' : (t.customer?.name ?? key),
        total: 0,
        withDeadline: 0,
        overdue: 0,
        resolved: 0,
        onTimeCount: 0,
        avgResolutionHours: null,
        _resolutionHoursSum: 0,
      });
    }

    const r = map.get(key)!;
    r.total += 1;

    const isResolved = t.status === 'RESOLVED' || t.status === 'CLOSED';
    const deadline   = t.slaDeadline ? new Date(t.slaDeadline) : null;

    if (deadline) {
      r.withDeadline += 1;
      if (!isResolved && deadline < now) {
        r.overdue += 1;
      }
    }

    if (isResolved) {
      r.resolved += 1;
      // avg resolution time: createdAt → updatedAt
      if (t.createdAt && t.updatedAt) {
        const hours = (new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime()) / 3_600_000;
        r._resolutionHoursSum += hours;
      }
      // on-time: resolved before slaDeadline
      if (deadline && t.updatedAt && new Date(t.updatedAt) <= deadline) {
        r.onTimeCount += 1;
      }
    }
  }

  return Array.from(map.values())
    .map(({ _resolutionHoursSum, ...row }) => ({
      ...row,
      avgResolutionHours: row.resolved > 0
        ? Math.round((_resolutionHoursSum / row.resolved) * 10) / 10
        : null,
    }))
    .sort((a, b) => b.total - a.total);
}
