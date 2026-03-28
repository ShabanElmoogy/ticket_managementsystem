import { db } from '../../config/database.js';
import { users } from '../users/users.schema.js';
import { tickets } from '../tickets/tickets.schema.js';
import { tenants } from '../tenants/tenants.schema.js';
import { customers } from '../customers/customers.schema.js';
import { applications } from '../applications/applications.schema.js';
import { eq, and, or, not, lt, desc, asc, inArray } from 'drizzle-orm';
import { getTenantScope } from '../../utils/tenantUtils.js';
import { escalatePriorities, getEscalationInterval, setEscalationInterval } from '../../utils/scheduler.js';

// Manually trigger priority escalation (admin/test use)
export const triggerEscalation = async (req, res) => {
  try {
    await escalatePriorities();
    res.json({ message: 'Priority escalation completed. Check server logs for details.' });
  } catch (error) {
    console.error('Trigger escalation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get escalation interval — SUPER_ADMIN gets global, TENANT_ADMIN gets their tenant's
export const getEscalationSettings = async (req, res) => {
  try {
    if (req.user.role === 'SUPER_ADMIN') {
      return res.json({ intervalMinutes: getEscalationInterval(), scope: 'global' });
    }
    const tenantId = req.user.tenantId;
    if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });
    const [tenant] = await db
      .select({ escalationIntervalMinutes: tenants.escalationIntervalMinutes })
      .from(tenants).where(eq(tenants.id, tenantId)).limit(1);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    res.json({ intervalMinutes: tenant.escalationIntervalMinutes, scope: 'tenant' });
  } catch (error) {
    console.error('Get escalation settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update escalation interval — SUPER_ADMIN updates global, TENANT_ADMIN updates their tenant
export const updateEscalationSettings = async (req, res) => {
  try {
    const { intervalMinutes } = req.body;
    const parsed = parseInt(intervalMinutes, 10);
    if (isNaN(parsed) || parsed < 1) return res.status(400).json({ error: 'intervalMinutes must be a positive integer' });

    if (req.user.role === 'SUPER_ADMIN') {
      const updated = setEscalationInterval(parsed);
      return res.json({ intervalMinutes: updated, scope: 'global' });
    }

    const tenantId = req.user.tenantId;
    if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });
    const [updated] = await db
      .update(tenants)
      .set({ escalationIntervalMinutes: parsed, updatedAt: new Date() })
      .where(eq(tenants.id, tenantId))
      .returning({ escalationIntervalMinutes: tenants.escalationIntervalMinutes });
    res.json({ intervalMinutes: updated.escalationIntervalMinutes, scope: 'tenant' });
  } catch (error) {
    console.error('Update escalation settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get SLA settings for current tenant
export const getSlaSettings = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });
    const [tenant] = await db
      .select({
        slaUrgentHours: tenants.slaUrgentHours,
        slaHighHours: tenants.slaHighHours,
        slaMediumHours: tenants.slaMediumHours,
        slaLowHours: tenants.slaLowHours,
      })
      .from(tenants).where(eq(tenants.id, tenantId)).limit(1);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    res.json(tenant);
  } catch (error) {
    console.error('Get SLA settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update SLA settings for current tenant
export const updateSlaSettings = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });
    const { slaUrgentHours, slaHighHours, slaMediumHours, slaLowHours } = req.body;
    const [updated] = await db
      .update(tenants)
      .set({
        ...(slaUrgentHours != null && { slaUrgentHours: parseInt(slaUrgentHours) }),
        ...(slaHighHours != null && { slaHighHours: parseInt(slaHighHours) }),
        ...(slaMediumHours != null && { slaMediumHours: parseInt(slaMediumHours) }),
        ...(slaLowHours != null && { slaLowHours: parseInt(slaLowHours) }),
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, tenantId))
      .returning({
        slaUrgentHours: tenants.slaUrgentHours,
        slaHighHours: tenants.slaHighHours,
        slaMediumHours: tenants.slaMediumHours,
        slaLowHours: tenants.slaLowHours,
      });
    res.json(updated);
  } catch (error) {
    console.error('Update SLA settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get reminder settings
export const getReminderSettings = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const scope = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;

    const user = await db
      .select({
        reminderEnabled: users.reminderEnabled,
        reminderInterval: users.reminderInterval,
      })
      .from(users)
      .where(tenantId ? and(eq(users.id, userId), eq(users.tenantId, tenantId)) : eq(users.id, userId))
      .limit(1);

    if (!user.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user[0]);
  } catch (error) {
    console.error('Get reminder settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update user reminder settings
export const updateReminderSettings = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const scope = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;

    const { reminderEnabled, reminderInterval } = req.body;

    const updateData = {};
    if (reminderEnabled !== undefined) updateData.reminderEnabled = reminderEnabled;
    if (reminderInterval !== undefined) updateData.reminderInterval = reminderInterval;

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(tenantId ? and(eq(users.id, userId), eq(users.tenantId, tenantId)) : eq(users.id, userId))
      .returning({
        reminderEnabled: users.reminderEnabled,
        reminderInterval: users.reminderInterval,
      });

    res.json(user);
  } catch (error) {
    console.error('Update reminder settings error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Get delayed tickets for reminders
export const getDelayedTickets = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const scope = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;

    const user = await db
      .select({
        reminderEnabled: users.reminderEnabled,
        reminderInterval: users.reminderInterval,
      })
      .from(users)
      .where(tenantId ? and(eq(users.id, userId), eq(users.tenantId, tenantId)) : eq(users.id, userId))
      .limit(1);

    if (!user.length || !user[0]?.reminderEnabled) {
      return res.json([]);
    }

    const now = new Date();
    const delayThreshold = new Date(now.getTime() - user[0].reminderInterval * 60 * 1000);

    // Tickets table has no tenantId, so for tenant-scoped requests we scope via createdBy user.
    const ticketsData = await db
      .select({
        id: tickets.id,
        title: tickets.title,
        description: tickets.description,
        status: tickets.status,
        priority: tickets.priority,
        dueDate: tickets.dueDate,
        createdAt: tickets.createdAt,
        updatedAt: tickets.updatedAt,
        customerId: tickets.customerId,
        applicationId: tickets.applicationId,
      })
      .from(tickets)
      .innerJoin(users, eq(tickets.createdById, users.id))
      .leftJoin(customers, eq(tickets.customerId, customers.id))
      .leftJoin(applications, eq(tickets.applicationId, applications.id))
      .where(
        and(
          eq(tickets.assignedToId, userId),
          ...(tenantId ? [eq(users.tenantId, tenantId)] : []),
          not(eq(tickets.status, 'CLOSED')),
          or(lt(tickets.dueDate, now), lt(tickets.updatedAt, delayThreshold))
        )
      )
      .orderBy(desc(tickets.priority), asc(tickets.dueDate));

    // Get related data separately
    const customerIds = ticketsData.filter((t) => t.customerId).map((t) => t.customerId);
    const applicationIds = ticketsData.filter((t) => t.applicationId).map((t) => t.applicationId);

    const [customersData, applicationsData] = await Promise.all([
      customerIds.length > 0
        ? db.select({ id: customers.id, name: customers.name }).from(customers).where(inArray(customers.id, customerIds))
        : [],
      applicationIds.length > 0
        ? db.select({ id: applications.id, name: applications.name }).from(applications).where(inArray(applications.id, applicationIds))
        : [],
    ]);

    // Combine data
    const result = ticketsData.map((ticket) => ({
      ...ticket,
      customer: customersData.find((c) => c.id === ticket.customerId) || null,
      application: applicationsData.find((a) => a.id === ticket.applicationId) || null,
    }));

    res.json(result);
  } catch (error) {
    console.error('Get delayed tickets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
