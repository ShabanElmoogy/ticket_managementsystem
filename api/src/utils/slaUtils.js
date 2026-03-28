import { db } from '../config/database.js';
import { tenants } from '../modules/tenants/tenants.schema.js';
import { eq } from 'drizzle-orm';

const DEFAULT_SLA = { URGENT: 4, HIGH: 8, MEDIUM: 24, LOW: 72 };

export const getSlaHours = async (tenantId) => {
  if (!tenantId) return DEFAULT_SLA;
  const [tenant] = await db
    .select({ slaUrgentHours: tenants.slaUrgentHours, slaHighHours: tenants.slaHighHours, slaMediumHours: tenants.slaMediumHours, slaLowHours: tenants.slaLowHours })
    .from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  if (!tenant) return DEFAULT_SLA;
  return { URGENT: tenant.slaUrgentHours, HIGH: tenant.slaHighHours, MEDIUM: tenant.slaMediumHours, LOW: tenant.slaLowHours };
};

export const computeSlaDeadline = (createdAt, priority, slaHours) => {
  const hours = slaHours[priority] ?? slaHours['MEDIUM'];
  const base = createdAt ? new Date(createdAt) : new Date();
  return new Date(base.getTime() + hours * 3600000);
};
